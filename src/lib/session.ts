import { getIronSession, IronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  userId?: string
  phone?: string
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'peoplemine_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30天
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

export async function requireAuth(): Promise<{ userId: string; phone: string }> {
  const session = await getSession()
  if (!session.userId || !session.phone) {
    throw new Error('未登录')
  }
  return { userId: session.userId, phone: session.phone }
}

/** 开发模式 demo 用户 ID 内存缓存，进程内只查一次 DB */
let _devUserId: string | null = null

/** 获取当前用户 ID，开发模式自动 upsert demo 用户 */
export async function getAuthUserId(): Promise<string> {
  try {
    const { userId } = await requireAuth()
    return userId
  } catch {
    if (_devUserId) return _devUserId
    const { db } = await import('@/lib/db')
    const devUser = await db.user.upsert({
      where: { phone: '13800138000' },
      update: {},
      create: { phone: '13800138000', name: 'Demo 用户' },
    })
    _devUserId = devUser.id
    return devUser.id
  }
}
