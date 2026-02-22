import {
  getDocuments,
  where,
  orderBy,
  limit,
} from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/constants";
import type { Order } from "@/types/order";
import type { Table } from "@/types/table";
import {
  getPaymentsByDateRange,
  calculateRevenue,
  getRevenueByDay,
  type RevenueByDayItem,
} from "@/services/report.service";
import { startOfDay, endOfDay, subDays } from "date-fns";

const ACTIVE_ORDER_STATUSES = [
  "pending",
  "preparing",
  "ready",
  "served",
] as const;

const ACTIVE_TABLE_STATUSES = ["occupied", "billing"] as const;

/**
 * Today's revenue (sum of payment totals) for the organization.
 * Multi-tenant: filtered by organizationId.
 */
export async function getTodayRevenue(
  organizationId: string
): Promise<number> {
  const start = startOfDay(new Date());
  const end = endOfDay(new Date());
  const payments = await getPaymentsByDateRange(organizationId, start, end);
  return Math.round(calculateRevenue(payments) * 100) / 100;
}

/**
 * Count of paid orders (payments) today for the organization.
 */
export async function getTodayOrders(organizationId: string): Promise<number> {
  const start = startOfDay(new Date());
  const end = endOfDay(new Date());
  const payments = await getPaymentsByDateRange(organizationId, start, end);
  return payments.length;
}

/**
 * Count of orders with status in [pending, preparing, ready, served].
 * Multi-tenant: filtered by organizationId.
 */
export async function getActiveOrdersCount(
  organizationId: string
): Promise<number> {
  const list = await getDocuments<Order & { id: string }>(
    COLLECTIONS.ORDERS,
    where("organizationId", "==", organizationId),
    where("status", "in", [...ACTIVE_ORDER_STATUSES]),
    limit(500)
  );
  return list.length;
}

/**
 * Count of tables with status not "available" (occupied or billing).
 * Multi-tenant: filtered by organizationId.
 */
export async function getActiveTablesCount(
  organizationId: string
): Promise<number> {
  const list = await getDocuments<Table & { id: string }>(
    COLLECTIONS.TABLES,
    where("organizationId", "==", organizationId),
    where("status", "in", [...ACTIVE_TABLE_STATUSES]),
    limit(200)
  );
  return list.length;
}

/**
 * Most recent 5 orders by createdAt desc for the organization.
 * Multi-tenant: filtered by organizationId.
 */
export async function getRecentOrders(
  organizationId: string,
  maxResults = 5
): Promise<Order[]> {
  const list = await getDocuments<Order & { id: string }>(
    COLLECTIONS.ORDERS,
    where("organizationId", "==", organizationId),
    orderBy("createdAt", "desc"),
    limit(maxResults)
  );
  return list.map((o) => ({ ...o, id: o.id }));
}

/**
 * Revenue grouped by date for the last 7 days (including today).
 * Uses report.service helpers; returns array sorted by date ascending for charting.
 */
export async function getRevenueLast7Days(
  organizationId: string
): Promise<RevenueByDayItem[]> {
  const end = endOfDay(new Date());
  const start = startOfDay(subDays(new Date(), 6));
  const payments = await getPaymentsByDateRange(organizationId, start, end);
  return getRevenueByDay(payments);
}

/**
 * Load all dashboard metrics for owner/manager in one batch (fewer round-trips).
 * Revenue and recent orders fetched on mount only; active counts can be real-time separately.
 */
export async function getDashboardMetrics(organizationId: string): Promise<{
  todayRevenue: number;
  todayOrders: number;
  recentOrders: Order[];
  revenueLast7Days: RevenueByDayItem[];
}> {
  const [todayRevenue, todayOrders, recentOrders, revenueLast7Days] =
    await Promise.all([
      getTodayRevenue(organizationId),
      getTodayOrders(organizationId),
      getRecentOrders(organizationId, 5),
      getRevenueLast7Days(organizationId),
    ]);

  return {
    todayRevenue,
    todayOrders,
    recentOrders,
    revenueLast7Days,
  };
}
