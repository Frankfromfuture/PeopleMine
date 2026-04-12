import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { getSessionOptions, isSecureRequestFromHeaders, SessionData } from "@/lib/session"

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

  const res = NextResponse.next()
  const secure = isSecureRequestFromHeaders(req.headers, req.nextUrl.protocol)
  const session = await getIronSession<SessionData>(req, res, getSessionOptions(secure))

  if (!session.userId) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
