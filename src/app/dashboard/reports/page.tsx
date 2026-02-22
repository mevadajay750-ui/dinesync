"use client";

import { useCallback, useEffect, useState } from "react";
import { RoleGuard } from "@/components/guards/RoleGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { useOrganization } from "@/hooks/useOrganization";
import { getReportData } from "@/services/report.service";
import type { ReportMetrics, RevenueByDayItem, BestSellingItem } from "@/services/report.service";
import {
  startOfDay,
  endOfDay,
  subDays,
  format,
  isToday,
  isEqual,
  startOfToday,
} from "date-fns";
import { IndianRupee, ShoppingBag, TrendingUp, BarChart3, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [
  { id: "today", label: "Today", getRange: () => ({ start: startOfToday(), end: endOfDay(new Date()) }) },
  { id: "7d", label: "7 days", getRange: () => ({ start: startOfDay(subDays(new Date(), 6)), end: endOfDay(new Date()) }) },
  { id: "30d", label: "30 days", getRange: () => ({ start: startOfDay(subDays(new Date(), 29)), end: endOfDay(new Date()) }) },
] as const;

function formatCurrency(value: number): string {
  return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ReportsContent() {
  const { organization, loading: orgLoading } = useOrganization();
  const [preset, setPreset] = useState<"today" | "7d" | "30d">("7d");
  const [startDate, setStartDate] = useState<Date>(() => startOfDay(subDays(new Date(), 6)));
  const [endDate, setEndDate] = useState<Date>(() => endOfDay(new Date()));
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [revenueByDay, setRevenueByDay] = useState<RevenueByDayItem[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSellingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyPreset = useCallback((id: "today" | "7d" | "30d") => {
    const p = PRESETS.find((x) => x.id === id);
    if (p) {
      const { start, end } = p.getRange();
      setStartDate(start);
      setEndDate(end);
      setPreset(id);
    }
  }, []);

  useEffect(() => {
    if (!organization?.id || orgLoading) {
      setLoading(orgLoading);
      return;
    }
    setLoading(true);
    setError(null);
    getReportData(organization.id, startDate, endDate)
      .then(({ metrics: m, revenueByDay: r, bestSellers: b }) => {
        setMetrics(m);
        setRevenueByDay(r);
        setBestSellers(b);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Failed to load report";
        const isIndexBuilding =
          typeof message === "string" &&
          (/index.*building|currently building|cannot be used yet/i.test(message) ||
            message.includes("requires an index"));
        setError(
          isIndexBuilding
            ? "Reports use a Firestore index that is still building. Please try again in a few minutes."
            : message
        );
        setMetrics(null);
        setRevenueByDay([]);
        setBestSellers([]);
      })
      .finally(() => setLoading(false));
  }, [organization?.id, orgLoading, startDate, endDate]);

  const dateLabel =
    isEqual(startDate, endDate) && isToday(startDate)
      ? "Today"
      : `${format(startDate, "MMM d, yyyy")} – ${format(endDate, "MMM d, yyyy")}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reports</h2>
          <p className="text-muted-foreground">Revenue, orders, and best sellers by date range.</p>
        </div>
      </div>

      {/* Filter bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Date range</CardTitle>
          <CardDescription>Choose a preset or use custom dates.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                  preset === p.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-accent"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <input
              type="date"
              value={format(startDate, "yyyy-MM-dd")}
              onChange={(e) => {
                const d = e.target.valueAsDate;
                if (d) setStartDate(startOfDay(d));
                setPreset("7d");
              }}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-foreground"
            />
            <span>to</span>
            <input
              type="date"
              value={format(endDate, "yyyy-MM-dd")}
              onChange={(e) => {
                const d = e.target.valueAsDate;
                if (d) setEndDate(endOfDay(d));
                setPreset("7d");
              }}
              className="rounded-md border border-input bg-background px-2 py-1.5 text-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Metrics cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Loading…</span>
              </div>
            ) : metrics ? (
              <>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(metrics.totalRevenue)}
                </p>
                <p className="text-xs text-muted-foreground">{dateLabel}</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-foreground">—</p>
                <p className="text-xs text-muted-foreground">No data</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Loading…</span>
              </div>
            ) : metrics ? (
              <>
                <p className="text-2xl font-bold text-foreground">{metrics.totalOrders}</p>
                <p className="text-xs text-muted-foreground">Paid in period</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-foreground">—</p>
                <p className="text-xs text-muted-foreground">No data</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Order Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Loading…</span>
              </div>
            ) : metrics ? (
              <>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(metrics.averageOrderValue)}
                </p>
                <p className="text-xs text-muted-foreground">Per order</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-foreground">—</p>
                <p className="text-xs text-muted-foreground">No data</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Revenue by date
          </CardTitle>
          <CardDescription>Daily revenue in the selected range.</CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart data={revenueByDay} loading={loading} />
        </CardContent>
      </Card>

      {/* Best sellers table */}
      <Card>
        <CardHeader>
          <CardTitle>Best selling items (Top 5)</CardTitle>
          <CardDescription>By quantity sold in the selected period.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-md bg-muted/50"
                />
              ))}
            </div>
          ) : bestSellers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-12 text-center text-sm text-muted-foreground">
              <ShoppingBag className="mb-2 h-10 w-10 opacity-50" />
              <p>No orders with items in this period.</p>
              <p className="mt-1">Complete some orders to see best sellers.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 font-medium text-right">Qty sold</th>
                    <th className="pb-2 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {bestSellers.map((row, i) => (
                    <tr key={row.menuItemId} className="border-b border-border/70">
                      <td className="py-3">{i + 1}</td>
                      <td className="font-medium text-foreground">{row.name}</td>
                      <td className="text-right">{row.quantity}</td>
                      <td className="text-right">{formatCurrency(row.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <RoleGuard allowedRoles={["owner", "manager"]}>
      <ReportsContent />
    </RoleGuard>
  );
}
