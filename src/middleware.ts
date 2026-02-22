import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRoleFromToken } from "@/lib/auth/token";
import { hasAccess } from "@/lib/hasAccess";
import type { UserRole } from "@/types/roles";

const SESSION_COOKIE = "session";
const PROTECTED_PATHS = ["/dashboard", "/create-organization"];
const AUTH_PATHS = ["/login", "/register"];
const DASHBOARD_BASE = "/dashboard";

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.includes(pathname);
}

function isDashboardPath(pathname: string): boolean {
  return pathname === DASHBOARD_BASE || pathname.startsWith(`${DASHBOARD_BASE}/`);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;

  if (isAuthPath(pathname)) {
    if (sessionCookie) {
      return NextResponse.redirect(new URL(DASHBOARD_BASE, request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/create-organization") {
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (!isDashboardPath(pathname)) {
    return NextResponse.next();
  }

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role: UserRole | null = getRoleFromToken(sessionCookie);
  // No role in token (e.g. custom claims not set): allow through; client-side guards enforce from Firestore user
  if (role === null) {
    return NextResponse.next();
  }

  if (!hasAccess(role, pathname)) {
    return NextResponse.redirect(new URL(DASHBOARD_BASE, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/create-organization", "/login", "/register"],
};
