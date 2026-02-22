"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import type { Organization } from "@/types/organization";

export function useOrganization() {
  const { user, isAuthenticated } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganization = useCallback(async () => {
    if (!user?.organizationId) {
      setOrganization(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { getOrganizationById } = await import("@/services/organization.service");
      const org = await getOrganizationById(user.organizationId);
      setOrganization(org);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load organization");
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  }, [user?.organizationId]);

  useEffect(() => {
    if (!isAuthenticated || !user?.organizationId) {
      setOrganization(null);
      setLoading(false);
      return;
    }
    fetchOrganization();
  }, [isAuthenticated, user?.organizationId, fetchOrganization]);

  return {
    organization,
    loading,
    error,
    refetch: fetchOrganization,
  };
}
