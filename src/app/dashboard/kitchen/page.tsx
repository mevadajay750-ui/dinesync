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
import { cn } from "@/lib/utils";

const KITCHEN_PATH = "/dashboard/kitchen";

const KITCHEN_STATUSES: OrderStatus[] = ["pending", "preparing", "ready"];

const STATUS_STYLES: Record<
  OrderStatus,
  string
> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700",
  preparing: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700",
  ready: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700",
  served: "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-900/30 dark:text-violet-200 dark:border-violet-700",
  completed: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600",
  cancelled: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700",
};

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
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        STATUS_STYLES[status] ?? STATUS_STYLES.pending
      )}
    >
      {status}
    </span>
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
        "transition-shadow",
        order.status === "pending" && "ring-2 ring-amber-400/50"
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
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <span className="text-sm font-semibold text-foreground">
            Total ${order.total.toFixed(2)}
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
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
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
              "rounded-lg border px-4 py-2 text-sm font-medium transition-colors capitalize",
              tab === t
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-accent"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
