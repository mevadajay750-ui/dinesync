import { doc, serverTimestamp } from "firebase/firestore";
import {
  createBatch,
  getCollectionRef,
  getDocRef,
  getDocuments,
  where,
  orderBy,
  limit,
} from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/constants";
import type { Payment, CreatePaymentInput } from "@/types/payment";
import type { Order } from "@/types/order";
import type { Organization } from "@/types/organization";
import { getOrderById } from "@/services/order.service";
import { getTableById } from "@/services/table.service";
import { getOrganizationById } from "@/services/organization.service";

const DEFAULT_MAX_PAYMENTS = 500;

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  time: string;
  restaurantName: string;
  address: string;
  tableName: string;
  items: { name: string; quantity: number; price: number; lineTotal: number }[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  discount: number;
  total: number;
  paymentMethod: string;
}

/**
 * Create payment document, set order status to completed, and reset table to available
 * in a single batch. Uses snapshot values from the provided payment input (no recalculation).
 * Call only when order status is "served".
 */
export async function createPaymentAndCompleteOrder(
  input: CreatePaymentInput
): Promise<{ paymentId: string }> {
  const order = await getOrderById(input.organizationId, input.orderId);
  if (!order) {
    throw new Error("Order not found or access denied");
  }
  if (order.status !== "served") {
    throw new Error("Order must be served before payment");
  }

  const table = await getTableById(input.organizationId, input.tableId);
  if (!table) {
    throw new Error("Table not found or access denied");
  }
  if (table.id !== order.tableId) {
    throw new Error("Order table mismatch");
  }

  const paymentData: Omit<Payment, "id"> = {
    orderId: input.orderId,
    tableId: input.tableId,
    subtotal: input.subtotal,
    tax: input.tax,
    serviceCharge: input.serviceCharge,
    discount: input.discount,
    total: input.total,
    paymentMethod: input.paymentMethod,
    paidAt: serverTimestamp() as Payment["paidAt"],
    organizationId: input.organizationId,
    processedBy: input.processedBy,
  };

  const paymentsRef = getCollectionRef<Payment>(COLLECTIONS.PAYMENTS);
  const paymentRef = doc(paymentsRef);
  const orderRef = getDocRef(COLLECTIONS.ORDERS, input.orderId);
  const tableRef = getDocRef(COLLECTIONS.TABLES, input.tableId);

  const batch = createBatch();
  batch.set(paymentRef, paymentData);
  batch.update(orderRef, {
    status: "completed",
    updatedAt: serverTimestamp(),
  });
  batch.update(tableRef, {
    status: "available",
    activeOrderId: null,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
  return { paymentId: paymentRef.id };
}

/**
 * Get payment by order ID (at most one per order in our flow).
 */
export async function getPaymentByOrderId(
  organizationId: string,
  orderId: string
): Promise<Payment | null> {
  const list = await getDocuments<Payment & { id: string }>(
    COLLECTIONS.PAYMENTS,
    where("organizationId", "==", organizationId),
    where("orderId", "==", orderId),
    orderBy("paidAt", "desc"),
    limit(1)
  );
  if (list.length === 0) return null;
  const raw = list[0];
  return { ...raw, id: raw.id };
}

/**
 * Build invoice data for PDF generation. Uses snapshot values from order and payment.
 * Optionally pass organization for header; address can be empty if not in org.
 */
export function generateInvoiceData(
  order: Order,
  payment: Payment,
  organization: Organization | null
): InvoiceData {
  const paidAt = payment.paidAt;
  const date = paidAt && "toDate" in paidAt ? paidAt.toDate() : new Date();
  return buildInvoiceDataFromValues(order, {
    subtotal: payment.subtotal,
    tax: payment.tax,
    serviceCharge: payment.serviceCharge,
    discount: payment.discount,
    total: payment.total,
    paymentMethod: payment.paymentMethod,
    date,
  }, organization);
}

/**
 * Build invoice data from order and payment input (e.g. right after create, before payment doc is read).
 * Use for immediate PDF generation after createPaymentAndCompleteOrder.
 */
export function buildInvoiceDataFromInput(
  order: Order,
  input: CreatePaymentInput,
  organization: Organization | null
): InvoiceData {
  return buildInvoiceDataFromValues(order, {
    subtotal: input.subtotal,
    tax: input.tax,
    serviceCharge: input.serviceCharge,
    discount: input.discount,
    total: input.total,
    paymentMethod: input.paymentMethod,
    date: new Date(),
  }, organization);
}

function buildInvoiceDataFromValues(
  order: Order,
  values: {
    subtotal: number;
    tax: number;
    serviceCharge: number;
    discount: number;
    total: number;
    paymentMethod: Payment["paymentMethod"];
    date: Date;
  },
  organization: Organization | null
): InvoiceData {
  const dateStr = values.date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = values.date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const items = order.items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    lineTotal: Math.round(item.price * item.quantity * 100) / 100,
  }));

  return {
    invoiceNumber: `INV-${order.id.slice(-8).toUpperCase()}`,
    date: dateStr,
    time: timeStr,
    restaurantName: organization?.name ?? "DineSync",
    address: "",
    tableName: order.tableName,
    items,
    subtotal: values.subtotal,
    tax: values.tax,
    serviceCharge: values.serviceCharge,
    discount: values.discount,
    total: values.total,
    paymentMethod: values.paymentMethod.charAt(0).toUpperCase() + values.paymentMethod.slice(1),
  };
}

export async function getPaymentsByOrganization(
  organizationId: string,
  maxResults = DEFAULT_MAX_PAYMENTS
): Promise<Payment[]> {
  const list = await getDocuments<Payment & { id: string }>(
    COLLECTIONS.PAYMENTS,
    where("organizationId", "==", organizationId),
    orderBy("paidAt", "desc"),
    limit(maxResults)
  );
  return list.map((p) => ({ ...p, id: p.id }));
}
