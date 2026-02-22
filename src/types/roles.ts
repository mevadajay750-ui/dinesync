/**
 * Canonical user role type for DineSync.
 * Used for route permissions, guards, and UI.
 */
export type UserRole = "owner" | "manager" | "waiter" | "kitchen";

export const USER_ROLES: readonly UserRole[] = [
  "owner",
  "manager",
  "waiter",
  "kitchen",
] as const;

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    (USER_ROLES as readonly string[]).includes(value)
  );
}
