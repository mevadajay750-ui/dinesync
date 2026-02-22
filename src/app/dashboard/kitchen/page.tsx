"use client";

import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/providers/ToastProvider";
import { PathGuard } from "@/components/guards/RoleGuard";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useOrdersRealtime, useNewPendingOrderAlert } from "@/hooks/useOrdersRealtime";
import { updateOrderStatus } from "@/services/order.service";
import type { Order, OrderStatus } from "@/types/order";
import { ChefHat, Clock, CheckCircle } from "lucide-react";
import { Badge, ORDER_STATUS_VARIANT } from "@/components/ui/Badge";
import { cn, formatCurrency } from "@/lib/utils";

const KITCHEN_PATH = "/dashboard/kitchen";

const KITCHEN_STATUSES: OrderStatus[] = ["pending", "preparing", "ready"];

function playNewOrderSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // ignore if autoplay blocked or unsupported
  }
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={ORDER_STATUS_VARIANT[status] ?? "muted"}>
      {status}
    </Badge>
  );
}

function OrderCard({
  order,
  onStatusChange,
  isUpdating,
}: {
  order: Order;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  isUpdating: Set<string>;
}) {
  const updating = isUpdating.has(order.id);
  const nextStatus: OrderStatus | null =
    order.status === "pending"
      ? "preparing"
      : order.status === "preparing"
        ? "ready"
        : null;

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        order.status === "pending" && "ring-2 ring-warning/50"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Table {order.tableName}</CardTitle>
        </div>
        <StatusBadge status={order.status} />
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {order.items.map((item, idx) => (
            <li
              key={`${item.menuItemId}-${idx}`}
              className="flex justify-between gap-2 text-sm"
            >
              <span className="text-foreground">
                {item.quantity}× {item.name}
                {item.notes ? (
                  <span className="block text-muted-foreground text-xs mt-0.5">
                    {item.notes}
                  </span>
                ) : null}
              </span>
              <span className="text-muted-foreground shrink-0">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <span className="text-sm font-semibold text-foreground">
            Total {formatCurrency(order.total)}
          </span>
          {nextStatus && (
            <Button
              size="sm"
              loading={updating}
              disabled={updating}
              onClick={() => onStatusChange(order.id, nextStatus)}
              leftIcon={
                nextStatus === "ready" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )
              }
            >
              {nextStatus === "preparing" ? "Start preparing" : "Mark ready"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

type TabFilter = "pending" | "preparing" | "ready" | "all";

function KitchenPageInner() {
  const { user } = useAuth();
  const toast = useToast();
  const orgId = user?.organizationId ?? null;

  const [tab, setTab] = useState<TabFilter>("pending");
  const [updating, setUpdating] = useState<Set<string>>(new Set());

  const { orders, loading, error } = useOrdersRealtime(orgId, { maxResults: 100 });

  const alertCallback = useCallback(() => {
    playNewOrderSound();
    toast.info("New order received");
  }, [toast]);

  useNewPendingOrderAlert(orgId, alertCallback);

  useEffect(() => {
    const handler = () => playNewOrderSound();
    window.addEventListener("dinesync-push-order-created", handler);
    return () => window.removeEventListener("dinesync-push-order-created", handler);
  }, []);

  const kitchenOrders = useMemo(
    () =>
      orders.filter((o) =>
        KITCHEN_STATUSES.includes(o.status)
      ),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    if (tab === "all") return kitchenOrders;
    return kitchenOrders.filter((o) => o.status === tab);
  }, [kitchenOrders, tab]);

  const handleStatusChange = useCallback(
    async (orderId: string, status: OrderStatus) => {
      if (!orgId) return;
      setUpdating((prev) => new Set(prev).add(orderId));
      try {
        await updateOrderStatus(orgId, orderId, status);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to update status"
        );
      } finally {
        setUpdating((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
      }
    },
    [orgId, toast]
  );

  if (loading && orders.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Kitchen</h2>
        <p className="text-muted-foreground">
          Real-time orders. Update status as you prepare and complete orders.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["pending", "preparing", "ready", "all"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 capitalize",
              tab === t
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-accent"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredOrders.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground py-8">
            No {tab === "all" ? "active" : tab} orders.
          </p>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              isUpdating={updating}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function KitchenPage() {
  return (
    <PathGuard pathname={KITCHEN_PATH}>
      <KitchenPageInner />
    </PathGuard>
  );
}
