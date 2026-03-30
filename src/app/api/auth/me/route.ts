import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const session = await getSession()
    if (!session.userId) {
      return NextResponse.json({ user: null })
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, phone: true, name: true, image: true, industry: true, role: true, goal: true },
    })

    return NextResponse.json({ user })
  } catch (err) {
    console.error('[me]', err)
    return NextResponse.json({ user: null })
  }
}
