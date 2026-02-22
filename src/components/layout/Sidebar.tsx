"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { hasAccess } from "@/lib/hasAccess";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Square,
  UtensilsCrossed,
  ClipboardList,
  ChefHat,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ALL_NAV_ITEMS = [
  { href: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.DASHBOARD_TABLES, label: "Tables", icon: Square },
  { href: ROUTES.DASHBOARD_MENU, label: "Menu", icon: UtensilsCrossed },
  { href: ROUTES.DASHBOARD_ORDERS, label: "Orders", icon: ClipboardList },
  { href: ROUTES.DASHBOARD_KITCHEN, label: "Kitchen", icon: ChefHat },
  { href: ROUTES.DASHBOARD_REPORTS, label: "Reports", icon: BarChart3 },
  { href: ROUTES.DASHBOARD_SETTINGS, label: "Settings", icon: Settings },
] as const;

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export function Sidebar({ collapsed, onToggle, className }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = useMemo(() => {
    if (!user) return [];
    return ALL_NAV_ITEMS.filter((item) => hasAccess(user.role, item.href));
  }, [user]);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-64",
        className
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-border px-3">
        {!collapsed && (
          <Link href={ROUTES.DASHBOARD} className="font-semibold text-foreground">
            DineSync
          </Link>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="rounded p-2 hover:bg-accent"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
