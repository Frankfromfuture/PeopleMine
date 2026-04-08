import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'

async function resolveUserId(): Promise<string> {
  try {
    const { userId } = await requireAuth()
    return userId
  } catch {
    if (process.env.NODE_ENV !== 'development') throw new Error('UNAUTHORIZED')
    const c = await db.contact.findFirst({ select: { userId: true }, orderBy: { createdAt: 'desc' } })
    if (c) return c.userId
    const u = await db.user.findFirst({ select: { id: true } })
    if (u) return u.id
    throw new Error('No user found')
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await resolveUserId()
    const { id } = await params

    const journey = await db.journey.findFirst({
      where: { id, userId },
      select: { id: true, goal: true, aiAnalysis: true, pathData: true, createdAt: true },
    })

    if (!journey) {
      return NextResponse.json({ error: '未找到' }, { status: 404 })
    }

    return NextResponse.json({ journey: { ...journey, createdAt: journey.createdAt.toISOString() } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
