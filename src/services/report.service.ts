import { Timestamp } from "firebase/firestore";
import { getDocuments, where, limit } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/constants";
import type { Payment } from "@/types/payment";
import type { Order, OrderItem } from "@/types/order";
import { startOfDay, endOfDay, format } from "date-fns";

const MAX_PAYMENTS = 2000;
const MAX_ORDERS = 2000;

export interface RevenueByDayItem {
  date: string;
  revenue: number;
}

export interface BestSellingItem {
  menuItemId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface ReportMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

/**
 * Fetch payments for the given organization and date range (inclusive of both dates).
 * Multi-tenant safe: filtered by organizationId.
 */
export async function getPaymentsByDateRange(
  organizationId: string,
  startDate: Date,
  endDate: Date
): Promise<Payment[]> {
  const start = Timestamp.fromDate(startOfDay(startDate));
  const end = Timestamp.fromDate(endOfDay(endDate));
  const list = await getDocuments<Payment & { id: string }>(
    COLLECTIONS.PAYMENTS,
    where("organizationId", "==", organizationId),
    where("paidAt", ">=", start),
    where("paidAt", "<=", end),
    limit(MAX_PAYMENTS)
  );
  return list.map((p) => ({ ...p, id: p.id }));
}

/**
 * Sum total revenue from an array of payments.
 */
export function calculateRevenue(payments: Payment[]): number {
  return payments.reduce((sum, p) => sum + p.total, 0);
}

/**
 * Average order value: total revenue / number of payments (completed orders).
 */
export function calculateAOV(payments: Payment[]): number {
  if (payments.length === 0) return 0;
  const total = calculateRevenue(payments);
  return Math.round((total / payments.length) * 100) / 100;
}

/**
 * Fetch orders for the given organization and date range (createdAt).
 * Used for order count and best-selling items aggregation.
 */
export async function getOrdersByDateRange(
  organizationId: string,
  startDate: Date,
  endDate: Date
): Promise<Order[]> {
  const start = Timestamp.fromDate(startOfDay(startDate));
  const end = Timestamp.fromDate(endOfDay(endDate));
  const list = await getDocuments<Order & { id: string }>(
    COLLECTIONS.ORDERS,
    where("organizationId", "==", organizationId),
    where("createdAt", ">=", start),
    where("createdAt", "<=", end),
    limit(MAX_ORDERS)
  );
  return list.map((o) => ({ ...o, id: o.id }));
}

/**
 * Count completed orders in the date range using payments (one payment per order).
 * Total orders in period = number of payments.
 */
export function getTotalOrdersFromPayments(payments: Payment[]): number {
  return payments.length;
}

/**
 * Group payments by date (YYYY-MM-DD) and sum revenue per day.
 * Returns array sorted by date ascending for charting.
 */
export function getRevenueByDay(payments: Payment[]): RevenueByDayItem[] {
  const byDate = new Map<string, number>();
  for (const p of payments) {
    const dateObj = p.paidAt && "toDate" in p.paidAt ? p.paidAt.toDate() : new Date();
    const key = format(dateObj, "yyyy-MM-dd");
    byDate.set(key, (byDate.get(key) ?? 0) + p.total);
  }
  const result: RevenueByDayItem[] = Array.from(byDate.entries()).map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue * 100) / 100,
  }));
  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

/**
 * From orders in date range, aggregate by menuItemId (quantity + revenue from item line).
 * Returns top 5 by quantity sold.
 * Only considers completed orders: we use orders that have items; for revenue we use order item price * quantity.
 */
export function getBestSellingItems(
  orders: Order[],
  limitCount = 5
): BestSellingItem[] {
  const completedOrders = orders.filter(
    (o) => o.status === "completed"
  );
  const byItem = new Map<
    string,
    { name: string; quantity: number; revenue: number }
  >();
  for (const order of completedOrders) {
    for (const item of order.items) {
      const id = item.menuItemId;
      const existing = byItem.get(id);
      const qty = item.quantity;
      const revenue = item.price * item.quantity;
      if (existing) {
        existing.quantity += qty;
        existing.revenue += revenue;
      } else {
        byItem.set(id, { name: item.name, quantity: qty, revenue });
      }
    }
  }
  const sorted = Array.from(byItem.entries())
    .map(([menuItemId, { name, quantity, revenue }]) => ({
      menuItemId,
      name,
      quantity,
      revenue: Math.round(revenue * 100) / 100,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limitCount);
  return sorted;
}

/**
 * Load all report data for a date range in one place (fewer round-trips if needed).
 * Returns metrics, revenue-by-day series, and best sellers.
 */
export async function getReportData(
  organizationId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  metrics: ReportMetrics;
  revenueByDay: RevenueByDayItem[];
  bestSellers: BestSellingItem[];
}> {
  const [payments, orders] = await Promise.all([
    getPaymentsByDateRange(organizationId, startDate, endDate),
    getOrdersByDateRange(organizationId, startDate, endDate),
  ]);

  const totalRevenue = calculateRevenue(payments);
  const totalOrders = getTotalOrdersFromPayments(payments);
  const averageOrderValue = calculateAOV(payments);
  const revenueByDay = getRevenueByDay(payments);
  const bestSellers = getBestSellingItems(orders, 5);

  return {
    metrics: {
      totalRevenue,
      totalOrders,
      averageOrderValue,
    },
    revenueByDay,
    bestSellers,
  };
}
