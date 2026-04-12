import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE_NAME } from "@/lib/session-constants"

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/pricing",
  "/solutions",
  "/api/auth/send-otp",
  "/api/auth/verify-otp",
  "/api/auth/dev-login",
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_PATHS.some((p) => (p === "/" ? pathname === "/" : pathname.startsWith(p)))
  ) {
    return NextResponse.next()
  }

  if (process.env.NODE_ENV === "development") {
    return NextResponse.next()
  }

  // Middleware runs on Edge runtime. Avoid importing Node-only session parsing here.
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
