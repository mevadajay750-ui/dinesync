"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { X } from "lucide-react";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * Renders the same structure on server and client to avoid hydration mismatch.
 * No portal: fixed-position elements overlay correctly from the layout tree.
 */
export function MobileDrawer({ open, onClose, collapsed, onToggleCollapse }: MobileDrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [open, onClose]);

  return (
    <>
      <div
        role="button"
        tabIndex={-1}
        onClick={onClose}
        onKeyDown={(e) => e.key === "Enter" && onClose()}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 min-w-[18rem] transition-transform duration-200 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="relative flex h-full flex-col bg-brand-primary">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-2 z-10 rounded-xl p-2 text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
          <Sidebar collapsed={false} onToggle={onToggleCollapse} className="w-72 min-w-[18rem] border-0" />
        </div>
      </div>
    </>
  );
}
