import { doc, serverTimestamp } from "firebase/firestore";
import {
  getCollectionRef,
  getDocRef,
  createBatch,
  getDocument,
  getDocuments,
  updateDocument,
  where,
  orderBy,
  limit,
} from "@/lib/firebase/firestore";
import { COLLECTIONS, DEFAULT_TAX_RATE, DEFAULT_SERVICE_CHARGE_RATE } from "@/lib/constants";
import type { Order, OrderItem, OrderStatus } from "@/types/order";
import * as tableService from "@/services/table.service";

const DEFAULT_MAX_ORDERS = 200;

/** Remove undefined values so Firestore accepts the object. */
function stripUndefined<T extends object>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((v) =>
      v !== null && typeof v === "object" && !(v instanceof Date)
        ? stripUndefined(v as object)
        : v
    ) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[k] =
      v !== null && typeof v === "object" && !(v instanceof Date)
        ? stripUndefined(v as object)
        : v;
  }
  return out as T;
}

/** Calculate subtotal from items. */
export function calculateSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/** Apply tax and service charge; return { subtotal, tax, serviceCharge, total }. */
export function calculateTotals(
  subtotal: number,
  taxRate = DEFAULT_TAX_RATE,
  serviceChargeRate = DEFAULT_SERVICE_CHARGE_RATE
): { subtotal: number; tax: number; serviceCharge: number; total: number } {
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const serviceCharge = Math.round(subtotal * serviceChargeRate * 100) / 100;
  const total = Math.round((subtotal + tax + serviceCharge) * 100) / 100;
  return { subtotal, tax, serviceCharge, total };
}

/**
 * Create a new order and set table to occupied in a single batch.
 * Order status = pending. Table status = occupied, activeOrderId = orderId.
 */
export async function createOrder(
  organizationId: string,
  params: {
    tableId: string;
    tableName: string;
    items: OrderItem[];
    createdBy: string;
  }
): Promise<string> {
  if (!params.items.length) {
    throw new Error("Order must have at least one item");
  }

  const table = await tableService.getTableById(organizationId, params.tableId);
  if (!table) {
    throw new Error("Table not found or access denied");
  }
  if (table.status !== "available") {
    throw new Error("Table is not available");
  }

  const subtotal = calculateSubtotal(params.items);
  const { tax, serviceCharge, total } = calculateTotals(subtotal);

  const orderData: Omit<Order, "id"> = {
    organizationId,
    tableId: params.tableId,
    tableName: params.tableName,
    items: params.items,
    subtotal,
    tax,
    serviceCharge,
    total,
    status: "pending",
    createdBy: params.createdBy,
    createdAt: serverTimestamp() as unknown as Order["createdAt"],
    updatedAt: serverTimestamp() as unknown as Order["updatedAt"],
  };

  const ordersRef = getCollectionRef<Order>(COLLECTIONS.ORDERS);
  const orderRef = doc(ordersRef);
  const tableRef = getDocRef(COLLECTIONS.TABLES, params.tableId);

  const batch = createBatch();
  batch.set(orderRef, stripUndefined(orderData));
  batch.update(tableRef, {
    status: "occupied",
    activeOrderId: orderRef.id,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
  return orderRef.id;
}

/**
 * Update order items and recalculate totals. Allowed only when status is not completed/cancelled.
 */
export async function updateOrderItems(
  organizationId: string,
  orderId: string,
  items: OrderItem[]
): Promise<void> {
  const order = await getOrderById(organizationId, orderId);
  if (!order) {
    throw new Error("Order not found or access denied");
  }
  if (order.status === "completed" || order.status === "cancelled") {
    throw new Error("Cannot update items on a completed or cancelled order");
  }
  if (!items.length) {
    throw new Error("Order must have at least one item");
  }

  const subtotal = calculateSubtotal(items);
  const { tax, serviceCharge, total } = calculateTotals(subtotal);

  await updateDocument(
    COLLECTIONS.ORDERS,
    stripUndefined({
      items,
      subtotal,
      tax,
      serviceCharge,
      total,
      updatedAt: serverTimestamp(),
    }),
    orderId
  );
}

/**
 * Update order status. Kitchen: pending → preparing → ready. Waiter: → served. Manager/Owner: → completed/cancelled.
 */
export async function updateOrderStatus(
  organizationId: string,
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const order = await getOrderById(organizationId, orderId);
  if (!order) {
    throw new Error("Order not found or access denied");
  }
  if (order.status === "completed" || order.status === "cancelled") {
    throw new Error("Cannot change status of a completed or cancelled order");
  }

  await updateDocument(
    COLLECTIONS.ORDERS,
    { status, updatedAt: serverTimestamp() },
    orderId
  );
}

/**
 * Mark order as completed and reset table to available. Manager/Owner only in practice.
 * Locks order from further edits.
 */
export async function completeOrder(
  organizationId: string,
  orderId: string
): Promise<void> {
  const order = await getOrderById(organizationId, orderId);
  if (!order) {
    throw new Error("Order not found or access denied");
  }
  if (order.status === "completed") {
    return; // idempotent
  }
  if (order.status === "cancelled") {
    throw new Error("Cannot complete a cancelled order");
  }

  const tableRef = getDocRef(COLLECTIONS.TABLES, order.tableId);
  const batch = createBatch();
  batch.update(getDocRef(COLLECTIONS.ORDERS, orderId), {
    status: "completed",
    updatedAt: serverTimestamp(),
  });
  batch.update(tableRef, {
    status: "available",
    activeOrderId: null,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function getOrderById(
  organizationId: string,
  orderId: string
): Promise<Order | null> {
  const raw = await getDocument<Order & { id: string }>(
    COLLECTIONS.ORDERS,
    orderId
  );
  if (!raw || raw.organizationId !== organizationId) return null;
  return { ...raw, id: raw.id };
}

export async function getOrdersByOrg(
  organizationId: string,
  maxResults = DEFAULT_MAX_ORDERS
): Promise<Order[]> {
  const list = await getDocuments<Order & { id: string }>(
    COLLECTIONS.ORDERS,
    where("organizationId", "==", organizationId),
    orderBy("updatedAt", "desc"),
    limit(maxResults)
  );
  return list.map((o) => ({ ...o, id: o.id }));
}

export async function getOrdersByStatus(
  organizationId: string,
  status: OrderStatus,
  maxResults = DEFAULT_MAX_ORDERS
): Promise<Order[]> {
  const list = await getDocuments<Order & { id: string }>(
    COLLECTIONS.ORDERS,
    where("organizationId", "==", organizationId),
    where("status", "==", status),
    orderBy("createdAt", "asc"),
    limit(maxResults)
  );
  return list.map((o) => ({ ...o, id: o.id }));
}
