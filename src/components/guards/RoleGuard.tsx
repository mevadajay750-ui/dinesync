"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types/roles";
import { hasAccess } from "@/lib/hasAccess";
import { ROUTES } from "@/lib/constants";
import { ShieldX } from "lucide-react";

interface RoleGuardProps {
  allowedRoles: readonly UserRole[];
  children: ReactNode;
}

/**
 * Client-side guard: renders children only if the current user's role
 * is in allowedRoles. Otherwise renders an unauthorized message.
 */
export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <UnauthorizedView
        message="You must be signed in to view this page."
        showDashboardButton
      />
    );
  }

  const hasRole = (allowedRoles as readonly string[]).includes(user.role);
  if (!hasRole) {
    return (
      <UnauthorizedView
        message="You don't have permission to view this page."
        showDashboardButton
      />
    );
  }

  return <>{children}</>;
}

/**
 * Guard by pathname: allows access only if the current user's role
 * has access to the given path (uses same rules as middleware).
 */
interface PathGuardProps {
  pathname: string;
  children: ReactNode;
}

export function PathGuard({ pathname, children }: PathGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <UnauthorizedView
        message="You must be signed in to view this page."
        showDashboardButton
      />
    );
  }

  if (!hasAccess(user.role, pathname)) {
    return (
      <UnauthorizedView
        message="You don't have permission to view this page."
        showDashboardButton
      />
    );
  }

  return <>{children}</>;
}

interface UnauthorizedViewProps {
  message: string;
  showDashboardButton?: boolean;
}

function UnauthorizedView({
  message,
  showDashboardButton = true,
}: UnauthorizedViewProps) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card p-8 text-center">
      <ShieldX className="h-12 w-12 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium text-foreground">{message}</p>
      {showDashboardButton && (
        <Link
          href={ROUTES.DASHBOARD}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Go to Dashboard
        </Link>
      )}
    </div>
  );
}
