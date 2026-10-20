import { NextResponse, type NextRequest } from "next/server";

// Only this app may call its API: a request sent from another website (its
// Origin header names a different site) is refused before it reaches the code.
export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (req.method !== "GET" && origin) {
    let ok = false;
    try { ok = new URL(origin).host === req.nextUrl.host; } catch { ok = false; }
    if (!ok) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
