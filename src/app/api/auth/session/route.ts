import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 5; // 5 days

export async function POST(request: NextRequest) {
  const body = await request.json();
  const token = typeof body?.token === "string" ? body.token : null;
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
