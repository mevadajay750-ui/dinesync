import type { Timestamp } from "firebase/firestore";
import type { UserRole } from "@/types/roles";

/** Server-only: document ID is the FCM token. */
export interface DeviceTokenRecord {
  userId: string;
  organizationId: string;
  role: UserRole;
  updatedAt: Timestamp;
}
