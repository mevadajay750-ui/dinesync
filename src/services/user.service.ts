import {
  getDocument,
  setDocument,
  getDocuments,
  where,
} from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/constants";
import type { User, UserCreateInput } from "@/types/user";

export async function getUserById(uid: string): Promise<User | null> {
  const doc = await getDocument<Omit<User, "uid"> & { id: string }>(
    COLLECTIONS.USERS,
    uid
  );
  if (!doc) return null;
  return { ...doc, uid: doc.id };
}

export async function createUser(data: UserCreateInput): Promise<void> {
  const { uid, ...rest } = data;
  await setDocument(
    COLLECTIONS.USERS,
    { ...rest, uid, createdAt: new Date() },
    uid
  );
}

export async function updateUser(uid: string, data: Partial<Omit<User, "uid" | "createdAt">>): Promise<void> {
  await setDocument(COLLECTIONS.USERS, { ...data, updatedAt: new Date() }, uid);
}

export async function getUsersByOrganization(organizationId: string): Promise<User[]> {
  return getDocuments<User>(COLLECTIONS.USERS, where("organizationId", "==", organizationId));
}

export async function userExists(uid: string): Promise<boolean> {
  const doc = await getDocument<User>(COLLECTIONS.USERS, uid);
  return doc !== null;
}
