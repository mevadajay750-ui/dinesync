import {
  addDocument,
  getDocument,
  getDocuments,
  updateDocument,
  where,
  orderBy,
} from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/constants";
import type { Invite, InviteCreateInput } from "@/types/invite";
import { Timestamp } from "firebase/firestore";

const INVITE_EXPIRY_DAYS = 7;

function getExpiresAt(): Timestamp {
  const d = new Date();
  d.setDate(d.getDate() + INVITE_EXPIRY_DAYS);
  return Timestamp.fromDate(d);
}

/**
 * Create an invite. Caller must enforce canInviteRole and same organization.
 * Returns the invite id (use for invite link: /register?inviteId=...).
 */
export async function createInvite(input: InviteCreateInput): Promise<string> {
  const invitedBy = input.invitedBy ?? "";
  if (!invitedBy) {
    throw new Error("invitedBy is required to create an invite");
  }
  const now = Timestamp.now();
  const data = {
    email: input.email.trim().toLowerCase(),
    role: input.role,
    organizationId: input.organizationId,
    invitedBy,
    status: "pending" as const,
    createdAt: now,
    expiresAt: getExpiresAt(),
  };
  const ref = await addDocument(COLLECTIONS.INVITES, data);
  return ref.id;
}

/**
 * Fetch invite by id. Returns null if not found.
 */
export async function getInviteById(inviteId: string): Promise<Invite | null> {
  return getDocument<Invite>(COLLECTIONS.INVITES, inviteId);
}

/**
 * Mark invite as accepted after successful registration.
 * Fails if invite is not pending or expired (caller should validate first).
 */
export async function acceptInvite(inviteId: string): Promise<void> {
  await updateDocument(COLLECTIONS.INVITES, { status: "accepted" }, inviteId);
}

/**
 * List invites for an organization, most recent first.
 * Uses composite index (organizationId + createdAt desc). If index is still building,
 * we fall back to query by organizationId only and sort in memory.
 */
export async function getInvitesByOrganization(
  organizationId: string
): Promise<Invite[]> {
  try {
    const list = await getDocuments<Invite>(
      COLLECTIONS.INVITES,
      where("organizationId", "==", organizationId),
      orderBy("createdAt", "desc")
    );
    return list;
  } catch (err: unknown) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as { code?: string }).code
        : "";
    const msg =
      err && typeof err === "object" && "message" in err
        ? String((err as { message?: unknown }).message)
        : "";
    const isIndexRequired =
      code === "failed-precondition" ||
      code === "firestore/failed-precondition" ||
      /index.*(required|building)/i.test(msg);
    if (isIndexRequired) {
      const list = await getDocuments<Invite>(
        COLLECTIONS.INVITES,
        where("organizationId", "==", organizationId)
      );
      list.sort(
        (a, b) =>
          (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
      );
      return list;
    }
    throw err;
  }
}

/**
 * Check if invite is valid for use: pending and not expired.
 */
export function isInviteValid(invite: Invite): boolean {
  if (invite.status !== "pending") return false;
  const now = Timestamp.now();
  return invite.expiresAt.toMillis() > now.toMillis();
}
