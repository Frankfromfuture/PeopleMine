import { getIronSession, type IronSession, type SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  userId?: string
  phone?: string
}

function isSecureSessionCookieEnabled() {
  return process.env.SESSION_COOKIE_SECURE === 'true'
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'peoplemine_session',
  cookieOptions: {
    secure: isSecureSessionCookieEnabled(),
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

export async function requireAuth(): Promise<{ userId: string; phone: string }> {
  const session = await getSession()
  if (!session.userId || !session.phone) {
    throw new Error('Not authenticated')
  }
  return { userId: session.userId, phone: session.phone }
}

// Cache the test user id in-process so demo flows do not re-query on every request.
let testUserId: string | null = null

export async function getAuthUserId(): Promise<string> {
  try {
    const { userId } = await requireAuth()
    return userId
  } catch {
    if (testUserId) return testUserId

    const { db } = await import('@/lib/db')
    const testUser = await db.user.upsert({
      where: { phone: '13800138000' },
      update: {},
      create: { phone: '13800138000', name: 'Demo User' },
    })

    testUserId = testUser.id
    return testUser.id
  }
}
