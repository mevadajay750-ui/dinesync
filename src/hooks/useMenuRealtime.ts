"use client";

import { useEffect, useState } from "react";
import { onSnapshot, query } from "firebase/firestore";
import {
  getCollectionRef,
  where,
  orderBy,
  limit,
} from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/constants";
import type { MenuCategory, MenuItem } from "@/types/menu";

const DEFAULT_MAX_CATEGORIES = 200;
const DEFAULT_MAX_ITEMS = 2000;

interface MenuRealtimeState {
  categories: MenuCategory[];
  items: MenuItem[];
  loading: boolean;
  error: string | null;
}

/**
 * Real-time menu data via Firestore onSnapshot.
 * Categories and items update live when data changes.
 */
export function useMenuRealtime(
  organizationId: string | null | undefined,
  maxCategories = DEFAULT_MAX_CATEGORIES,
  maxItems = DEFAULT_MAX_ITEMS
): MenuRealtimeState {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) {
      setCategories([]);
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const categoriesRef = getCollectionRef<MenuCategory & { id: string }>(
      COLLECTIONS.MENU_CATEGORIES
    );
    const categoriesQuery = query(
      categoriesRef,
      where("organizationId", "==", organizationId),
      orderBy("displayOrder", "asc"),
      orderBy("createdAt", "asc"),
      limit(maxCategories)
    );

    const itemsRef = getCollectionRef<MenuItem & { id: string }>(
      COLLECTIONS.MENU_ITEMS
    );
    const itemsQuery = query(
      itemsRef,
      where("organizationId", "==", organizationId),
      orderBy("categoryId", "asc"),
      orderBy("createdAt", "asc"),
      limit(maxItems)
    );

    const unsubCategories = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as MenuCategory[];
        setCategories(list);
        setLoading((prev) => (prev ? false : prev));
        setError(null);
      },
      (err) => {
        setError(err instanceof Error ? err.message : "Failed to load categories");
        setCategories([]);
        setLoading(false);
      }
    );

    const unsubItems = onSnapshot(
      itemsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as MenuItem[];
        setItems(list);
        setLoading((prev) => (prev ? false : prev));
        setError(null);
      },
      (err) => {
        setError(err instanceof Error ? err.message : "Failed to load menu items");
        setItems([]);
        setLoading(false);
      }
    );

    return () => {
      unsubCategories();
      unsubItems();
    };
  }, [organizationId, maxCategories, maxItems]);

  return { categories, items, loading, error };
}
