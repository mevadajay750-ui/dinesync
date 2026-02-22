"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import type { ToastType } from "@/components/providers/ToastProvider";

interface ToastProps {
  message: string;
  type: ToastType;
  onDismiss: () => void;
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  default: null,
};

const styles: Record<ToastType, string> = {
  success: "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  default: "border-border bg-card text-card-foreground",
};

export function Toast({ message, type, onDismiss }: ToastProps) {
  const Icon = icons[type];

  useEffect(() => {
    return () => {};
  }, []);

  return (
    <div
      role="alert"
      className={cn(
        "flex min-w-[280px] max-w-md items-start gap-3 rounded-lg border p-4 shadow-lg",
        styles[type]
      )}
    >
      {Icon && <Icon className="h-5 w-5 shrink-0" />}
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-1 hover:bg-black/10 dark:hover:bg-white/10"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
