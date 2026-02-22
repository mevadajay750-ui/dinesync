"use client";

import { type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Optional icon for the action button (defaults to same as icon) */
  actionIcon?: LucideIcon;
  /** e.g. "success" for kitchen caught-up green accent */
  accent?: "default" | "success";
  className?: string;
}

const containerVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

const iconFloat = {
  y: [0, -4, 0],
  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  accent = "default",
  className,
}: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion();
  const BtnIcon = ActionIcon ?? Icon;

  return (
    <motion.div
      className={cn(
        "mx-auto flex max-w-[420px] flex-col items-center justify-center rounded-xl py-12 text-center",
        className
      )}
      initial={containerVariants.initial}
      animate={containerVariants.animate}
      transition={containerVariants.transition}
    >
      <motion.div
        className={cn(
          "mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full",
          accent === "success"
            ? "bg-success/10 text-success"
            : "bg-secondary/10 text-muted-foreground"
        )}
        animate={prefersReducedMotion ? undefined : iconFloat}
      >
        <Icon className="h-7 w-7" aria-hidden />
      </motion.div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      {actionLabel != null && onAction != null && (
        <Button
          className="mt-5"
          onClick={onAction}
          leftIcon={<BtnIcon className="h-4 w-4" />}
        >
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
