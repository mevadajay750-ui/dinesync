import type { Timestamp } from "firebase/firestore";

export type PaymentMethod = "cash" | "upi" | "card" | "mixed";

export interface Payment {
  id: string;
  orderId: string;
  tableId: string;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paidAt: Timestamp;
  organizationId: string;
  processedBy: string;
}

export interface CreatePaymentInput {
  orderId: string;
  tableId: string;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  organizationId: string;
  processedBy: string;
}
