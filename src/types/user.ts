import type { Timestamp } from "firebase/firestore";
import type { UserRole } from "@/types/roles";
import { USER_ROLES } from "@/types/roles";

export type { UserRole } from "@/types/roles";

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  createdAt: Timestamp;
}

export interface UserCreateInput {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
}

export { USER_ROLES };
