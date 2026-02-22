import type { Timestamp } from "firebase/firestore";

export type BusinessType = "restaurant" | "cafe";

export interface Organization {
  id: string;
  name: string;
  businessType: BusinessType;
  logoUrl?: string;
  ownerId: string;
  createdAt: Timestamp;
}

export interface OrganizationCreateInput {
  name: string;
  businessType: BusinessType;
  logoUrl?: string;
  ownerId: string;
}
