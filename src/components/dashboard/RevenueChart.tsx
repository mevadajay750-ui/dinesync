"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RevenueByDayItem } from "@/services/report.service";
import { format, parseISO } from "date-fns";

interface RevenueChartProps {
  data: RevenueByDayItem[];
  loading?: boolean;
}

export function RevenueChart({ data, loading }: RevenueChartProps) {
  if (loading) {
    return (
      <div className="h-[280px] w-full animate-pulse rounded-lg bg-muted/50" />
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    displayDate: format(parseISO(d.date), "MMM d"),
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[280px] w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
        No revenue data in this period
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${v}`)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
            }}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.date
                ? format(parseISO(payload[0].payload.date), "MMM d, yyyy")
                : ""
            }
            formatter={(value: number | undefined) => [
              value != null ? `₹${value.toLocaleString("en-IN")}` : "—",
              "Revenue",
            ]}
          />
          <Bar
            dataKey="revenue"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            name="Revenue"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
