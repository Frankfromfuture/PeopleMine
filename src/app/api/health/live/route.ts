import { NextResponse } from "next/server"

/** Liveness for load balancers / deploy scripts. No DB — only verifies Node responds. */
export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({ ok: true, service: "peoplemine" })
}
