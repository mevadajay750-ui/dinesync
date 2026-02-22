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
        "flex h-full min-h-screen shrink-0 flex-col border-r border-white/10 bg-primary transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-72 min-w-[18rem]",
        className
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-white/10 px-3">
        {!collapsed && (
          <Link href={ROUTES.DASHBOARD} className="font-semibold text-primary-foreground transition-colors duration-200 hover:opacity-90">
            DineSync
          </Link>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="rounded-xl p-2 text-primary-foreground/80 transition-all duration-200 hover:bg-white/10 hover:text-primary-foreground"
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
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white/15 text-primary-foreground"
                  : "text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground"
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
