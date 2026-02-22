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
    "bg-success/10 text-success dark:bg-success/10 dark:text-success",
  warning:
    "bg-warning/10 text-warning dark:bg-warning/10 dark:text-warning",
  danger:
    "bg-danger/10 text-danger dark:bg-danger/10 dark:text-danger",
  info:
    "bg-info/10 text-info dark:bg-info/10 dark:text-info",
  secondary:
    "bg-secondary/10 text-secondary-foreground dark:bg-secondary/10 dark:text-secondary-foreground",
  muted:
    "bg-muted/10 text-muted-foreground dark:bg-muted/10 dark:text-muted-foreground",
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
