import type { Timestamp } from "firebase/firestore";

export type TableStatus = "available" | "occupied" | "billing";

export interface Table {
  id: string;
  name: string;
  floor?: string;
  capacity: number;
  status: TableStatus;
  organizationId: string;
  activeOrderId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateTableInput {
  name: string;
  floor?: string;
  capacity: number;
  organizationId: string;
}

export interface UpdateTableInput {
  name?: string;
  floor?: string;
  capacity?: number;
  status?: TableStatus;
  activeOrderId?: string;
}
