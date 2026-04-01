import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'

/**
 * Dev mode: 按优先级找到合适的 userId
 * 1. 有联系人数据的第一个用户
 * 2. id='dev-user' 的用户
 * 3. phone='13800138000' 的用户
 * 4. 创建一个新的 dev-user
 */
async function resolveDevUserId(): Promise<string> {
  // 找有联系人的用户（最可能是实际使用的那个）
  const withContacts = await db.contact.findFirst({
    select: { userId: true },
    orderBy: { createdAt: 'desc' },
  })
  if (withContacts) return withContacts.userId

  // 无联系人，保证有一个 dev 用户存在
  const existing = await db.user.findFirst({
    where: { OR: [{ id: 'dev-user' }, { phone: '13800138000' }] },
    select: { id: true },
  })
  if (existing) return existing.id

  const created = await db.user.create({
    data: { id: 'dev-user', phone: '13800138000', name: 'Demo 用户' },
    select: { id: true },
  })
  return created.id
}

export async function GET() {
  let userId: string
  try {
    const { userId: authUserId } = await requireAuth()
    userId = authUserId
  } catch {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }
    userId = await resolveDevUserId()
  }

  try {
    const [contacts, relations] = await Promise.all([
      db.contact.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          company: true,
          title: true,
          jobPosition: true,
          relationRole: true,
          spiritAnimal: true,
          tags: true,
          energyScore: true,
          trustLevel: true,
          temperature: true,
          notes: true,
        },
      }),
      db.contactRelation.findMany({
        where: {
          OR: [
            { contactA: { userId } },
            { contactB: { userId } },
          ],
        },
        select: {
          contactIdA: true,
          contactIdB: true,
          relationDesc: true,
        },
      }),
    ])

    console.log(`[network] userId=${userId}, contacts=${contacts.length}`)
    return NextResponse.json({ contacts, relations })
  } catch (err) {
    console.error('[network] DB error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
