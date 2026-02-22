import type { Timestamp } from "firebase/firestore";

export type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "completed"
  | "cancelled";

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  organizationId: string;
  tableId: string;
  tableName: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  status: OrderStatus;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type OrderStatusFilter = "pending" | "preparing" | "ready" | "all";
