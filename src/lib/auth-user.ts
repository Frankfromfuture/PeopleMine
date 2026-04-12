import { db } from '@/lib/db'

type UserRecord = Awaited<ReturnType<typeof db.user.findFirst>>

export async function findOrCreateUserByPhone(phone: string, name?: string): Promise<NonNullable<UserRecord>> {
  const existing = await db.user.findFirst({
    where: { phone },
    orderBy: { createdAt: 'asc' },
  })
  if (existing) return existing

  try {
    return await db.user.create({
      data: {
        phone,
        ...(name ? { name } : {}),
      },
    })
  } catch (error) {
    const fallback = await db.user.findFirst({
      where: { phone },
      orderBy: { createdAt: 'asc' },
    })
    if (fallback) return fallback
    throw error
  }
}
