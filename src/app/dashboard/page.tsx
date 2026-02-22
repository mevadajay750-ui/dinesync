"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  OnboardingChecklist,
  getOnboardingDismissed,
  setOnboardingDismissed,
  getOnboardingComplete,
  setOnboardingComplete,
} from "@/components/dashboard/OnboardingChecklist";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { ROUTES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { getDashboardMetrics } from "@/services/dashboard.service";
import type { Order } from "@/types/order";
import type { RevenueByDayItem } from "@/services/report.service";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";
import { useTablesRealtime } from "@/hooks/useTablesRealtime";
import {
  ClipboardList,
  TrendingUp,
  Square,
  ChefHat,
  UtensilsCrossed,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SHOW_CHECKLIST_ROLES = ["owner", "manager"] as const;
const ACTIVE_ORDER_STATUSES = ["pending", "preparing", "ready", "served"] as const;

function orderStatusBadgeClass(status: Order["status"]): string {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
    case "preparing":
      return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-50";
    case "ready":
      return "bg-emerald-200 text-emerald-900 dark:bg-emerald-700 dark:text-white";
    case "served":
      return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
    case "completed":
      return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function OrderStatusBadge({ status }: { status: Order["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        orderStatusBadgeClass(status)
      )}
    >
      {status}
    </span>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-5 w-5 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-9 w-16 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-24 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

interface DashboardMetricsState {
  todayRevenue: number;
  todayOrders: number;
  recentOrders: Order[];
  revenueLast7Days: RevenueByDayItem[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { organization, loading: orgLoading } = useOrganization();
  const [dismissed, setDismissed] = useState(false);
  const [complete, setComplete] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetricsState | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const orgId = organization?.id ?? null;

  const { orders: ordersRealtime } = useOrdersRealtime(orgId, { maxResults: 500 });
  const { tables: tablesRealtime, loading: tablesLoading } = useTablesRealtime(orgId);

  const activeOrdersCount = useMemo(() => {
    return ordersRealtime.filter((o) =>
      (ACTIVE_ORDER_STATUSES as readonly string[]).includes(o.status)
    ).length;
  }, [ordersRealtime]);

  const activeTablesCount = useMemo(() => {
    return tablesRealtime.filter((t) => t.status !== "available").length;
  }, [tablesRealtime]);

  const pendingOrdersCount = useMemo(
    () => ordersRealtime.filter((o) => o.status === "pending").length,
    [ordersRealtime]
  );
  const preparingOrdersCount = useMemo(
    () => ordersRealtime.filter((o) => o.status === "preparing").length,
    [ordersRealtime]
  );

  const loadMetrics = useCallback(async (organizationId: string) => {
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      const data = await getDashboardMetrics(organizationId);
      setMetrics({
        todayRevenue: data.todayRevenue,
        todayOrders: data.todayOrders,
        recentOrders: data.recentOrders,
        revenueLast7Days: data.revenueLast7Days,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard";
      setMetricsError(message);
      setMetrics(null);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(ROUTES.LOGIN);
    }
  }, [loading, user, router]);

  useEffect(() => {
    setDismissed(getOnboardingDismissed());
    setComplete(getOnboardingComplete());
  }, []);

  useEffect(() => {
    if (!orgId) {
      setMetricsLoading(false);
      setMetrics(null);
      setMetricsError(null);
      return;
    }
    loadMetrics(orgId);
  }, [orgId, loadMetrics]);

  const showChecklist =
    user?.organizationId &&
    (SHOW_CHECKLIST_ROLES as readonly string[]).includes(user.role) &&
    !dismissed &&
    !complete;

  const handleDismissChecklist = () => {
    setOnboardingDismissed(true);
    setDismissed(true);
  };

  const handleOnboardingComplete = () => {
    setOnboardingComplete(true);
    setComplete(true);
  };

  const isOwnerOrManager =
    user && (user.role === "owner" || user.role === "manager");
  const isWaiter = user?.role === "waiter";
  const isKitchen = user?.role === "kitchen";

  if (loading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome back, {user.name}
        </h1>
        <p className="text-muted-foreground">
          {orgLoading
            ? "Loading..."
            : organization
              ? organization.name
              : "Your organization"}
        </p>
      </div>

      {showChecklist && organization?.id && (
        <OnboardingChecklist
          organizationId={organization.id}
          onDismiss={handleDismissChecklist}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* Owner / Manager: full dashboard */}
      {isOwnerOrManager && orgId && (
        <>
          {metricsError && (
            <div className="rounded-lg border border-danger/50 bg-danger/5 px-4 py-3 text-sm text-danger">
              {metricsError}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {metricsLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <Link
                  href={ROUTES.DASHBOARD_ORDERS}
                  className="transition-all duration-200 hover:scale-[1.02]"
                >
                  <Card className="h-full transition-all duration-200 hover:shadow-md">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Orders today
                      </CardTitle>
                      <ClipboardList className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-semibold tracking-tight">
                        {metrics?.todayOrders ?? 0}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Paid orders
                      </p>
                    </CardContent>
                  </Card>
                </Link>
                <Card className="h-full transition-all duration-200 hover:shadow-md">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Revenue
                    </CardTitle>
                    <TrendingUp className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-semibold tracking-tight">
                      {metrics ? formatCurrency(metrics.todayRevenue) : "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Today
                    </p>
                  </CardContent>
                </Card>
                <Link
                  href={ROUTES.DASHBOARD_TABLES}
                  className="transition-all duration-200 hover:scale-[1.02]"
                >
                  <Card className="h-full transition-all duration-200 hover:shadow-md">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Active tables
                      </CardTitle>
                      <Square className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-semibold tracking-tight">
                        {tablesLoading ? "—" : activeTablesCount}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Real-time
                      </p>
                    </CardContent>
                  </Card>
                </Link>
                <Link
                  href={ROUTES.DASHBOARD_ORDERS}
                  className="transition-all duration-200 hover:scale-[1.02]"
                >
                  <Card className="h-full transition-all duration-200 hover:shadow-md">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Active orders
                      </CardTitle>
                      <ClipboardList className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-semibold tracking-tight">
                        {activeOrdersCount}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Real-time
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue (last 7 days)</CardTitle>
              <CardDescription>Daily revenue for the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart
                data={metrics?.revenueLast7Days ?? []}
                loading={metricsLoading}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent orders</CardTitle>
              <CardDescription>Latest orders by creation time</CardDescription>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="flex min-h-[200px] items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : !metrics?.recentOrders?.length ? (
                <EmptyState
                  icon={ClipboardList}
                  title="No recent orders"
                  description="Orders will appear here once created."
                  actionLabel="View all orders"
                  onAction={() => router.push(ROUTES.DASHBOARD_ORDERS)}
                />
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-4 py-3 text-left font-medium text-foreground">
                          Order ID
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">
                          Table
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-foreground">
                          Total
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">
                          Time
                        </th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.recentOrders.map((order) => {
                        const createdAt =
                          order.createdAt && "toMillis" in order.createdAt
                            ? new Date(order.createdAt.toMillis())
                            : new Date(0);
                        return (
                          <tr
                            key={order.id}
                            className="border-b border-border transition-colors hover:bg-muted/20 last:border-b-0"
                          >
                            <td className="px-4 py-3 font-mono text-xs text-foreground">
                              {order.id.slice(-8).toUpperCase()}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {order.tableName}
                            </td>
                            <td className="px-4 py-3">
                              <OrderStatusBadge status={order.status} />
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {formatCurrency(order.total)}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {createdAt.toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="px-4 py-3">
                              <Link
                                href={`${ROUTES.DASHBOARD_ORDERS}/${order.id}`}
                                className="inline-flex text-muted-foreground transition-colors hover:text-foreground"
                                aria-label={`Open order ${order.id}`}
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Waiter: my active orders, available tables */}
      {isWaiter && orgId && (
        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href={ROUTES.DASHBOARD_ORDERS}
            className="transition-all duration-200 hover:scale-[1.02]"
          >
            <Card className="h-full transition-all duration-200 hover:shadow-md">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  My active orders
                </CardTitle>
                <ClipboardList className="h-5 w-5 shrink-0 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight">
                  {activeOrdersCount}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pending, preparing, ready, or served
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link
            href={ROUTES.DASHBOARD_TABLES}
            className="transition-all duration-200 hover:scale-[1.02]"
          >
            <Card className="h-full transition-all duration-200 hover:shadow-md">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Available tables
                </CardTitle>
                <Square className="h-5 w-5 shrink-0 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight">
                  {tablesLoading
                    ? "—"
                    : tablesRealtime.filter((t) => t.status === "available").length}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ready for new orders
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Kitchen: pending count, preparing count, link to kitchen */}
      {isKitchen && orgId && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="h-full transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending orders
              </CardTitle>
              <ClipboardList className="h-5 w-5 shrink-0 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">
                {pendingOrdersCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Awaiting preparation
              </p>
            </CardContent>
          </Card>
          <Card className="h-full transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Preparing
              </CardTitle>
              <UtensilsCrossed className="h-5 w-5 shrink-0 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">
                {preparingOrdersCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                In progress
              </p>
            </CardContent>
          </Card>
          <Link
            href={ROUTES.DASHBOARD_KITCHEN}
            className="transition-all duration-200 hover:scale-[1.02] md:col-span-2"
          >
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <ChefHat className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Kitchen</p>
                    <p className="text-sm text-muted-foreground">
                      View and update order status
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Getting started (only when no role-specific content or as extra for owner/manager) */}
      {isOwnerOrManager && (
        <Card>
          <CardHeader>
            <CardTitle>Getting started</CardTitle>
            <CardDescription>
              Navigate using the sidebar. Tables, Menu, Orders, Kitchen, Reports,
              and Settings are available based on your role.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="list-inside list-disc text-sm text-muted-foreground">
              <li>Use the top bar to toggle dark mode and sign out.</li>
              <li>Reports show revenue and best sellers over a date range.</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
