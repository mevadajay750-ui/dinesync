import type { UserRole } from "@/types/roles";
import type { InviteRole } from "@/types/invite";

/**
 * Route permissions by role.
 * A role can access a path if it is listed here; nested routes are allowed
 * when the base path is allowed (checked via hasAccess).
 */
export const rolePermissions: Record<UserRole, readonly string[]> = {
  owner: [
    "/dashboard",
    "/dashboard/tables",
    "/dashboard/menu",
    "/dashboard/orders",
    "/dashboard/kitchen",
    "/dashboard/reports",
    "/dashboard/invites",
    "/dashboard/settings",
  ],
  manager: [
    "/dashboard",
    "/dashboard/tables",
    "/dashboard/menu",
    "/dashboard/orders",
    "/dashboard/kitchen",
    "/dashboard/reports",
    "/dashboard/invites",
    "/dashboard/settings",
  ],
  waiter: [
    "/dashboard",
    "/dashboard/tables",
    "/dashboard/menu",
    "/dashboard/orders",
  ],
  kitchen: [
    "/dashboard",
    "/dashboard/kitchen",
    "/dashboard/tables",
    "/dashboard/menu",
  ],
} as const;

/** Roles that each inviter role may assign. Owner: all staff roles. Manager: waiter, kitchen only. */
const invitableRolesByRole: Record<UserRole, readonly InviteRole[]> = {
  owner: ["manager", "waiter", "kitchen"],
  manager: ["waiter", "kitchen"],
  waiter: [],
  kitchen: [],
};

/**
 * Returns whether the given inviter role is allowed to invite someone with the given role.
 * Prevents privilege escalation: managers cannot invite managers.
 */
export function canInviteRole(
  inviterRole: UserRole,
  targetRole: InviteRole
): boolean {
  const allowed = invitableRolesByRole[inviterRole];
  return allowed ? allowed.includes(targetRole) : false;
}

/** Returns inviteable roles for the current user role (for dropdown). */
export function getInvitableRoles(inviterRole: UserRole): InviteRole[] {
  return [...(invitableRolesByRole[inviterRole] ?? [])];
}

/** Whether the role can create/update/delete tables. Owner and manager only. */
export function canManageTables(role: UserRole): boolean {
  return role === "owner" || role === "manager";
}

/** Whether the role can create/update/delete menu categories and items. Owner and manager only. */
export function canManageMenu(role: UserRole): boolean {
  return role === "owner" || role === "manager";
}

/** Whether the role can complete billing (apply discount, set payment method, confirm payment). Owner and manager only. */
export function canManageBilling(role: UserRole): boolean {
  return role === "owner" || role === "manager";
}
