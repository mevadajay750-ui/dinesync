import { serverTimestamp } from "firebase/firestore";
import { setDocument } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/constants";
import type { UserRole } from "@/types/roles";

export interface SaveDeviceTokenInput {
  token: string;
  userId: string;
  organizationId: string;
  role: UserRole;
}

/**
 * Save or update device token in Firestore. Document ID is the token so the same device re-registering merges.
 * Call only for the current user (enforced by Firestore rules).
 */
export async function saveDeviceToken(input: SaveDeviceTokenInput): Promise<void> {
  const { token, userId, organizationId, role } = input;
  await setDocument(
    COLLECTIONS.DEVICE_TOKENS,
    {
      userId,
      organizationId,
      role,
      updatedAt: serverTimestamp(),
    },
    token
  );
}
