import type { Timestamp } from "firebase/firestore";

/** Roles that can be assigned via invite (no owner). */
export type InviteRole = "manager" | "waiter" | "kitchen";

export const INVITE_ROLES: readonly InviteRole[] = [
  "manager",
  "waiter",
  "kitchen",
] as const;

export type InviteStatus = "pending" | "accepted" | "expired";

export interface Invite {
  id: string;
  email: string;
  role: InviteRole;
  organizationId: string;
  invitedBy: string;
  status: InviteStatus;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export interface InviteCreateInput {
  email: string;
  role: InviteRole;
  organizationId: string;
  invitedBy: string;
}

export function isInviteRole(value: unknown): value is InviteRole {
  return (
    typeof value === "string" &&
    (INVITE_ROLES as readonly string[]).includes(value)
  );
}
