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
  success: "border-success/30 bg-success/10 text-success",
  error: "border-danger/30 bg-danger/10 text-danger",
  info: "border-info/30 bg-info/10 text-info",
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
        "flex min-w-[280px] max-w-md items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-200",
        styles[type]
      )}
    >
      {Icon && <Icon className="h-5 w-5 shrink-0" />}
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-lg p-1 transition-colors duration-200 hover:bg-black/10 dark:hover:bg-white/10"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
