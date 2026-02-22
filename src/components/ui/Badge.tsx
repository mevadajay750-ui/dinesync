"use client";

import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "secondary"
  | "muted";

const variantStyles: Record<BadgeVariant, string> = {
  success:
    "bg-success/15 text-success dark:bg-success/20 dark:text-success",
  warning:
    "bg-warning/15 text-warning dark:bg-warning/20 dark:text-warning",
  danger:
    "bg-danger/15 text-danger dark:bg-danger/20 dark:text-danger",
  info:
    "bg-info/15 text-info dark:bg-info/20 dark:text-info",
  secondary:
    "bg-secondary/15 text-secondary dark:bg-secondary/20 dark:text-secondary",
  muted:
    "bg-muted/20 text-muted-foreground dark:bg-muted/30",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "muted", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-200",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

/** Table status → badge variant */
export const TABLE_STATUS_VARIANT: Record<string, BadgeVariant> = {
  available: "success",
  occupied: "warning",
  billing: "danger",
};

/** Order status → badge variant */
export const ORDER_STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending: "warning",
  preparing: "info",
  ready: "success",
  served: "secondary",
  completed: "muted",
  cancelled: "danger",
};
