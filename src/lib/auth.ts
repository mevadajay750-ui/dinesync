import type { User } from "@/types/user";

/**
 * Returns the current user's organization ID for multi-tenant queries.
 * Use with: where("organizationId", "==", getCurrentOrganizationId(user))
 */
export function getCurrentOrganizationId(user: User | null): string | null {
  return user?.organizationId ?? null;
}
