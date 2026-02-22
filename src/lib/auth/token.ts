import { decodeJwt } from "jose";
import type { UserRole } from "@/types/roles";
import { isUserRole } from "@/types/roles";

const ROLE_CLAIM = "role";

/**
 * Decodes the Firebase ID token and returns the role from custom claims.
 * Use in Edge (middleware); for verification use Firebase Admin on the server.
 *
 * Set the "role" custom claim via Firebase Admin (e.g. when creating/updating
 * the user doc) so middleware can enforce route access. If role is not in the
 * token, middleware redirects to /dashboard and client-side guards enforce.
 */
export function getRoleFromToken(token: string): UserRole | null {
  try {
    const payload = decodeJwt(token);
    const role = payload[ROLE_CLAIM];
    if (isUserRole(role)) return role;
    return null;
  } catch {
    return null;
  }
}
