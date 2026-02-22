import {
  createBatch,
  getCollectionRef,
  getDocRef,
  getDocument,
  getDocuments,
  where,
} from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/constants";
import type { Organization, OrganizationCreateInput } from "@/types/organization";
import { doc, Timestamp } from "firebase/firestore";

export interface CreateOrganizationParams {
  name: string;
  businessType: OrganizationCreateInput["businessType"];
  logoUrl?: string;
}

export interface CreateOrganizationUser {
  uid: string;
  email: string;
  name: string;
}

/**
 * Create organization and assign user as owner in a single batch.
 * Creates organization document and creates/updates user document with role "owner" and organizationId.
 */
export async function createOrganization(
  data: CreateOrganizationParams,
  user: CreateOrganizationUser
): Promise<string> {
  const batch = createBatch();
  const orgCol = getCollectionRef(COLLECTIONS.ORGANIZATIONS);
  const newOrgRef = doc(orgCol);
  const now = Timestamp.now();

  const orgData: Omit<Organization, "id"> = {
    name: data.name,
    businessType: data.businessType,
    ...(data.logoUrl && { logoUrl: data.logoUrl }),
    ownerId: user.uid,
    createdAt: now,
  };

  batch.set(newOrgRef, orgData);

  const userRef = getDocRef(COLLECTIONS.USERS, user.uid);
  const userData = {
    uid: user.uid,
    name: user.name,
    email: user.email,
    role: "owner" as const,
    organizationId: newOrgRef.id,
    createdAt: now,
  };
  batch.set(userRef, userData, { merge: true });

  await batch.commit();
  return newOrgRef.id;
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  const org = await getDocument<Organization>(COLLECTIONS.ORGANIZATIONS, id);
  return org ? { ...org, id } : null;
}

export async function getOrganizationsByOwner(ownerId: string): Promise<Organization[]> {
  const list = await getDocuments<Organization & { id: string }>(
    COLLECTIONS.ORGANIZATIONS,
    where("ownerId", "==", ownerId)
  );
  return list.map((o) => ({ ...o, id: o.id }));
}
