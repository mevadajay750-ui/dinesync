"use client";

import { useEffect, useState, useRef } from "react";
import { getTablesByOrganization } from "@/services/table.service";
import type { Table } from "@/types/table";

const DEFAULT_MAX_TABLES = 100;
const POLL_INTERVAL_MS = 2500;

/**
 * Tables list with periodic refresh (polling).
 * We use polling instead of Firestore onSnapshot due to a known SDK bug
 * (FIRESTORE INTERNAL ASSERTION FAILED: Unexpected state ID ca9) that can
 * occur with real-time listeners in React/Next.js.
 */
export function useTablesRealtime(
  organizationId: string | null | undefined,
  maxResults = DEFAULT_MAX_TABLES
): { tables: Table[]; loading: boolean; error: string | null } {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTables = async (orgId: string) => {
    try {
      const list = await getTablesByOrganization(orgId, maxResults);
      setTables(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tables");
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!organizationId) {
      setTables([]);
      setLoading(false);
      setError(null);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setLoading(true);
    setError(null);

    fetchTables(organizationId);

    intervalRef.current = setInterval(() => {
      fetchTables(organizationId);
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [organizationId, maxResults]);

  return { tables, loading, error };
}
