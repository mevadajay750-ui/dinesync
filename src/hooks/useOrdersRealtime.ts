"use client";

import { useEffect, useState, useRef } from "react";
import { onSnapshot, query } from "firebase/firestore";
import {
  getCollectionRef,
  where,
  orderBy,
  limit,
} from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/constants";
import type { Order, OrderStatus } from "@/types/order";

const DEFAULT_MAX_ORDERS = 200;

interface UseOrdersRealtimeOptions {
  statusFilter?: OrderStatus | null;
  maxResults?: number;
}

/**
 * Real-time orders via Firestore onSnapshot.
 * Optionally filter by status (e.g. pending, preparing, ready for kitchen).
 */
export function useOrdersRealtime(
  organizationId: string | null | undefined,
  options: UseOrdersRealtimeOptions = {}
): { orders: Order[]; loading: boolean; error: string | null } {
  const { statusFilter = null, maxResults = DEFAULT_MAX_ORDERS } = options;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setOrders([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const ordersRef = getCollectionRef<Order & { id: string }>(COLLECTIONS.ORDERS);
    const q = statusFilter
      ? query(
          ordersRef,
          where("organizationId", "==", organizationId),
          where("status", "==", statusFilter),
          orderBy("createdAt", "asc"),
          limit(maxResults)
        )
      : query(
          ordersRef,
          where("organizationId", "==", organizationId),
          orderBy("updatedAt", "desc"),
          limit(maxResults)
        );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as Order[];
        setOrders(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err instanceof Error ? err.message : "Failed to load orders");
        setOrders([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [organizationId, statusFilter, maxResults]);

  return { orders, loading, error };
}

/**
 * Subscribe to orders and invoke callback when a new pending order appears.
 * Returns ref to latest pending count for comparison.
 */
export function useNewPendingOrderAlert(
  organizationId: string | null | undefined,
  onNewPending: () => void
): void {
  const { orders } = useOrdersRealtime(organizationId, {
    statusFilter: "pending",
    maxResults: 100,
  });
  const previousCountRef = useRef(0);
  const isInitialRef = useRef(true);

  useEffect(() => {
    if (!organizationId) return;
    const pendingCount = orders.length;
    if (isInitialRef.current) {
      isInitialRef.current = false;
      previousCountRef.current = pendingCount;
      return;
    }
    if (pendingCount > previousCountRef.current) {
      onNewPending();
    }
    previousCountRef.current = pendingCount;
  }, [organizationId, orders.length, onNewPending]);
}
