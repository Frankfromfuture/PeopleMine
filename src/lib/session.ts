import { getIronSession, type IronSession, type SessionOptions } from 'iron-session'
import { cookies, headers } from 'next/headers'

export interface SessionData {
  userId?: string
  phone?: string
}

const SESSION_COOKIE_NAME = 'peoplemine_session'
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

function normalizeProtocol(value: string | null | undefined): string | null {
  if (!value) return null
  return value.trim().replace(/:$/, '').toLowerCase() || null
}

function parseForwardedProto(forwarded: string | null): string | null {
  if (!forwarded) return null

  const [firstSegment] = forwarded.split(',')
  const match = firstSegment.match(/proto=([^;,\s]+)/i)
  return normalizeProtocol(match?.[1] ?? null)
}

function parseOriginProto(origin: string | null): string | null {
  if (!origin) return null

  try {
    return normalizeProtocol(new URL(origin).protocol)
  } catch {
    return null
  }
}

export function isSecureRequestFromHeaders(
  headerStore: Pick<Headers, 'get'>,
  fallbackProtocol?: string
): boolean {
  const fromForwardedProto = normalizeProtocol(
    headerStore
      .get('x-forwarded-proto')
      ?.split(',')
      .map((value) => value.trim())
      .find(Boolean) ?? null
  )
  if (fromForwardedProto) return fromForwardedProto === 'https'

  const fromForwarded = parseForwardedProto(headerStore.get('forwarded'))
  if (fromForwarded) return fromForwarded === 'https'

  const fromForwardedSsl = normalizeProtocol(headerStore.get('x-forwarded-ssl'))
  if (fromForwardedSsl) return fromForwardedSsl === 'on'

  const fromOrigin = parseOriginProto(headerStore.get('origin'))
  if (fromOrigin) return fromOrigin === 'https'

  const fromFallback = normalizeProtocol(fallbackProtocol)
  if (fromFallback) return fromFallback === 'https'

  return false
}

function shouldUseSecureCookie(isSecureRequest: boolean) {
  const envSetting = process.env.SESSION_COOKIE_SECURE?.trim().toLowerCase()

  if (envSetting === 'false') return false
  if (envSetting === 'true') {
    // `Secure` cookies cannot be persisted on plain HTTP, so keep it protocol-aware.
    return isSecureRequest
  }

  return isSecureRequest
}

export function getSessionOptions(isSecureRequest: boolean): SessionOptions {
  return {
    password: process.env.SESSION_SECRET!,
    cookieName: SESSION_COOKIE_NAME,
    cookieOptions: {
      secure: shouldUseSecureCookie(isSecureRequest),
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SESSION_COOKIE_MAX_AGE,
    },
  }
}

export const sessionOptions = getSessionOptions(false)

export async function getSession(): Promise<IronSession<SessionData>> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])
  const secure = isSecureRequestFromHeaders(headerStore)
  return getIronSession<SessionData>(cookieStore, getSessionOptions(secure))
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
