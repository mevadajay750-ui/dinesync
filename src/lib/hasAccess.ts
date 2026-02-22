import type { UserRole } from "@/types/roles";
import { rolePermissions } from "@/lib/permissions";

/**
 * Returns whether a role is allowed to access the given pathname.
 * Allows access if the pathname equals or starts with any allowed base route.
 */
export function hasAccess(role: UserRole, pathname: string): boolean {
  const allowed = rolePermissions[role];
  if (!allowed) return false;

  const normalized = pathname.replace(/\/$/, "") || "/";
  return allowed.some(
    (base) => normalized === base || normalized.startsWith(`${base}/`)
  );
}
