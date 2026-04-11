import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

const DEMO_PHONE = "13800138000"
const DEMO_NAME = "Test Demo User"

export async function POST() {
  try {
    const user = await db.user.upsert({
      where: { phone: DEMO_PHONE },
      update: {},
      create: {
        phone: DEMO_PHONE,
        name: DEMO_NAME,
      },
    })

    const session = await getSession()
    session.userId = user.id
    session.phone = user.phone
    await session.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[dev-login]", error)
    return NextResponse.json({ error: "Preview login failed" }, { status: 500 })
  }
}
