"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/providers/ToastProvider";
import { PathGuard } from "@/components/guards/RoleGuard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useMenuRealtime } from "@/hooks/useMenuRealtime";
import { useTablesRealtime } from "@/hooks/useTablesRealtime";
import {
  createOrder,
  updateOrderStatus,
  calculateSubtotal,
  calculateTotals,
} from "@/services/order.service";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";
import type { Order, OrderItem, OrderStatus } from "@/types/order";
import type { MenuCategory, MenuItem } from "@/types/menu";
import type { Table } from "@/types/table";
import { Plus, Minus, Trash2, ShoppingCart, CheckCircle, Receipt } from "lucide-react";
import { Badge, ORDER_STATUS_VARIANT } from "@/components/ui/Badge";
import { cn, formatCurrency } from "@/lib/utils";

const ORDERS_PATH = "/dashboard/orders";

/** Cart line for UI: OrderItem with optional temp notes while editing. */
interface CartLine extends OrderItem {
  key: string; // menuItemId + index for list key
}

function TableSelect({
  tables,
  value,
  onChange,
  disabled,
}: {
  tables: Table[];
  value: string;
  onChange: (tableId: string, tableName: string) => void;
  disabled: boolean;
}) {
  const available = useMemo(
    () => tables.filter((t) => t.status === "available"),
    [tables]
  );

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">Table</label>
      <select
        value={value}
        onChange={(e) => {
          const id = e.target.value;
          const t = available.find((x) => x.id === id);
          if (t) onChange(t.id, t.name);
        }}
        disabled={disabled}
        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:opacity-50"
      >
        <option value="">Select table</option>
        {available.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
            {t.floor ? ` (${t.floor})` : ""}
          </option>
        ))}
      </select>
      {available.length === 0 && (
        <p className="text-xs text-muted-foreground">No available tables</p>
      )}
    </div>
  );
}

function OrdersPageInner({
  selectedCategoryId,
  setSelectedCategoryId,
}: {
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const orgId = user?.organizationId ?? null;

  const [tableId, setTableId] = useState("");
  const [tableName, setTableName] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const { tables, loading: tablesLoading, error: tablesError } =
    useTablesRealtime(orgId);
  const { categories, items, loading: menuLoading, error: menuError } =
    useMenuRealtime(orgId);
  const { orders: allOrders } = useOrdersRealtime(orgId, { maxResults: 100 });

  const addToCart = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.menuItemId === item.id);
      if (existing) {
        return prev.map((l) =>
          l.menuItemId === item.id
            ? { ...l, quantity: l.quantity + 1, key: l.key }
            : l
        );
      }
      const line: CartLine = {
        key: `line-${item.id}-${Date.now()}`,
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
      };
      return [...prev, line];
    });
  }, []);

  const updateQuantity = useCallback((key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.key === key
            ? { ...l, quantity: Math.max(0, l.quantity + delta) }
            : l
        )
        .filter((l) => l.quantity > 0)
    );
  }, []);

  const updateNotes = useCallback((key: string, notes: string) => {
    setCart((prev) =>
      prev.map((l) =>
        l.key === key ? { ...l, notes: notes || undefined } : l
      )
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const { subtotal, tax, serviceCharge, total } = useMemo(() => {
    const st = calculateSubtotal(cart);
    return calculateTotals(st);
  }, [cart]);

  const submitOrder = useCallback(async () => {
    if (!orgId || !user?.uid) {
      toast.error("Not signed in");
      return;
    }
    if (!tableId || !tableName) {
      toast.error("Select a table");
      return;
    }
    if (cart.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    const orderItems: OrderItem[] = cart.map((l) => ({
      menuItemId: l.menuItemId,
      name: l.name,
      price: l.price,
      quantity: l.quantity,
      notes: l.notes,
    }));

    setSubmitting(true);
    try {
      await createOrder(orgId, {
        tableId,
        tableName,
        items: orderItems,
        createdBy: user.uid,
      });
      toast.success("Order submitted to kitchen");
      setCart([]);
      setTableId("");
      setTableName("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create order"
      );
    } finally {
      setSubmitting(false);
    }
  }, [orgId, user?.uid, tableId, tableName, cart, toast]);

  const activeOrders = useMemo(
    () =>
      allOrders.filter(
        (o) => o.status !== "completed" && o.status !== "cancelled"
      ),
    [allOrders]
  );

  const canMarkServed =
    user?.role === "waiter" ||
    user?.role === "manager" ||
    user?.role === "owner";

  const handleMarkServed = useCallback(
    async (orderId: string) => {
      if (!orgId) return;
      setUpdatingOrderId(orderId);
      try {
        await updateOrderStatus(orgId, orderId, "served");
        toast.success("Order marked as served");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to update status"
        );
      } finally {
        setUpdatingOrderId(null);
      }
    },
    [orgId, toast]
  );

  const loading = tablesLoading || menuLoading;
  const error = tablesError ?? menuError;

  if (loading && tables.length === 0 && categories.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Orders</h2>
        <p className="text-muted-foreground">
          Create an order: select table, add items, then submit to kitchen.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Table & menu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TableSelect
                tables={tables}
                value={tableId}
                onChange={(id, name) => {
                  setTableId(id);
                  setTableName(name);
                }}
                disabled={submitting}
              />
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(null)}
                    className={cn(
                      "rounded-xl border px-3 py-1.5 text-sm font-medium transition-all duration-200",
                      selectedCategoryId === null
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-accent"
                    )}
                  >
                    All
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(c.id)}
                      className={cn(
                        "rounded-xl border px-3 py-1.5 text-sm font-medium transition-all duration-200",
                        selectedCategoryId === c.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-accent"
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {(selectedCategoryId
                    ? items.filter((i) => i.categoryId === selectedCategoryId)
                    : items
                  )
                    .filter((i) => i.isAvailable)
                    .map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => addToCart(item)}
                        className="flex flex-col rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-secondary hover:shadow-md"
                      >
                        <span className="font-medium text-foreground">
                          {item.name}
                        </span>
                        <span className="mt-0.5 text-sm text-muted-foreground text-right">
                          {formatCurrency(item.price)}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Cart</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Add items from the menu.
                </p>
              ) : (
                <ul className="space-y-3">
                  {cart.map((line) => (
                    <li
                      key={line.key}
                      className="flex flex-col gap-1.5 rounded-xl border border-border p-3 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-foreground">
                          {line.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(line.key, -1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-all duration-200 hover:bg-accent"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-6 text-center text-sm">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(line.key, 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-all duration-200 hover:bg-accent"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeLine(line.key)}
                            className="rounded-lg p-1 text-muted-foreground transition-all duration-200 hover:bg-destructive/20 hover:text-destructive"
                            aria-label="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <Input
                        label="Notes"
                        placeholder="Special requests"
                        value={line.notes ?? ""}
                        onChange={(e) =>
                          updateNotes(line.key, e.target.value.trim())
                        }
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(line.price * line.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {cart.length > 0 && !tableId && (
                <p className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
                  Select a table above to submit this order.
                </p>
              )}

              {cart.length > 0 && (
                <>
                  <div className="space-y-1 border-t border-border pt-3 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax (5%)</span>
                      <span>{formatCurrency(tax)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Service (5%)</span>
                      <span>{formatCurrency(serviceCharge)}</span>
                    </div>
                    <div className="flex justify-between pt-1 font-semibold text-foreground">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                  <Button
                    fullWidth
                    loading={submitting}
                    onClick={submitOrder}
                    disabled={cart.length === 0}
                  >
                    Submit to kitchen
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active orders: Mark served (waiter) / Mark completed (billing, manager/owner) */}
      {activeOrders.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Active orders</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {activeOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-foreground">
                      Table {order.tableName}
                    </span>
                    <Badge variant={ORDER_STATUS_VARIANT[order.status] ?? "muted"}>
                      {order.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {order.items.length} item(s) · {formatCurrency(order.total)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {order.status === "ready" && canMarkServed && (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={updatingOrderId === order.id}
                        disabled={updatingOrderId !== null}
                        onClick={() => handleMarkServed(order.id)}
                        leftIcon={<CheckCircle className="h-4 w-4" />}
                      >
                        Mark served
                      </Button>
                    )}
                    {order.status === "served" && (
                      <Link
                        href={`/dashboard/orders/${order.id}/billing`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-input bg-background px-3 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <Receipt className="h-4 w-4" />
                        Billing
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  return (
    <PathGuard pathname={ORDERS_PATH}>
      <OrdersPageInner
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
      />
    </PathGuard>
  );
}
