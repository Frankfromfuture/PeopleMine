import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'

type RelationStrength = 'STRONG' | 'MEDIUM' | 'WEAK'

/** Dev mode: 按优先级找到合适的 userId */
async function resolveDevUserId(): Promise<string> {
  const withContacts = await db.contact.findFirst({
    select: { userId: true },
    orderBy: { createdAt: 'desc' },
  })
  if (withContacts) return withContacts.userId

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

async function loadContactsWithArcFallback(userId: string) {
  try {
    return await db.contact.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        company: true,
        title: true,
        jobPosition: true,
        jobFunction: true,
        relationRole: true,
        roleArchetype: true,
        spiritAnimal: true,
        industryL1: true,
        industryL2: true,
        companyScale: true,
        valueScore: true,
        gender: true,
        personalRelation: true,
        influence: true,
        tags: true,
        energyScore: true,
        trustLevel: true,
        chemistryScore: true,
        temperature: true,
        notes: true,
        lastContactedAt: true,
        archetype: true,
        quickContext: true,
        relationVector: true,
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message.toLowerCase() : ''
    const arcColumnMissing =
      msg.includes('does not exist') &&
      (msg.includes('contact.relationvector') ||
        msg.includes('contact.quickcontext') ||
        msg.includes('contact.archetype'))

    if (!arcColumnMissing) throw error

    const legacy = await db.contact.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        company: true,
        title: true,
        jobPosition: true,
        jobFunction: true,
        relationRole: true,
        roleArchetype: true,
        spiritAnimal: true,
        industryL1: true,
        industryL2: true,
        companyScale: true,
        valueScore: true,
        gender: true,
        personalRelation: true,
        influence: true,
        tags: true,
        energyScore: true,
        trustLevel: true,
        chemistryScore: true,
        temperature: true,
        notes: true,
        lastContactedAt: true,
      },
    })

    return legacy.map((c) => ({
      ...c,
      archetype: null,
      quickContext: null,
      relationVector: null,
      chemistryScore: null,
      lastContactedAt: null,
    }))
  }
}

type ContactRow = Awaited<ReturnType<typeof loadContactsWithArcFallback>>[number]

function normalizeKey(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

function clamp(v: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v))
}

/** 根据两人共享属性计算隐式关联强度 */
function scoreImplicit(a: ContactRow, b: ContactRow): number {
  let score = 0

  // 同公司（强信号）
  if (a.company && b.company && a.company.trim() === b.company.trim()) {
    score += 0.50
  }

  // 同一级行业
  if (a.industryL1 && b.industryL1 && a.industryL1 === b.industryL1) {
    score += 0.22
    // 同二级行业
    if (a.industryL2 && b.industryL2 && a.industryL2 === b.industryL2) {
      score += 0.12
    }
  }

  // 标签重叠
  const tagsA: string[] = Array.isArray(a.tags) ? (a.tags as string[]) : []
  const tagsB: string[] = Array.isArray(b.tags) ? (b.tags as string[]) : []
  const tagOverlap = tagsA.filter((t) => tagsB.includes(t)).length
  if (tagOverlap > 0) {
    score += Math.min(0.20, tagOverlap * 0.07)
  }

  // 同角色类型（战友/传送门类）
  if (a.roleArchetype && b.roleArchetype && a.roleArchetype === b.roleArchetype) {
    score += 0.08
  }

  // 能量均值调整（高能量 = 关系更活跃）
  const avgEnergy = ((a.energyScore ?? 50) + (b.energyScore ?? 50)) / 2
  score += ((avgEnergy - 50) / 100) * 0.10

  return clamp(score)
}

/** 根据显式关系描述 + 个人属性计算关系强度 */
function scoreExplicit(
  a: ContactRow,
  b: ContactRow,
  desc: string | null,
): RelationStrength {
  let score = 0.40
  if (desc) score += 0.30
  const avgEnergy = ((a.energyScore ?? 50) + (b.energyScore ?? 50)) / 2
  score += ((avgEnergy - 50) / 100) * 0.20
  const tempA = a.temperature as string | null
  const tempB = b.temperature as string | null
  if (tempA === 'HOT' || tempB === 'HOT') score += 0.15
  else if (tempA === 'WARM' || tempB === 'WARM') score += 0.07
  const trustA = (a.trustLevel as number | null) ?? 3
  const trustB = (b.trustLevel as number | null) ?? 3
  score += (((trustA + trustB) / 2) - 3) / 2 * 0.10
  return clamp(score) >= 0.70 ? 'STRONG' : clamp(score) >= 0.45 ? 'MEDIUM' : 'WEAK'
}

/** 构建关系边列表（显式 + 隐式） */
function buildRelations(
  contacts: ContactRow[],
  rawRelations: { contactIdA: string; contactIdB: string; relationDesc: string | null }[],
) {
  const contactMap = new Map(contacts.map((c) => [c.id, c]))

  // 显式关系优先
  const explicitKeys = new Set<string>()
  const result: { contactIdA: string; contactIdB: string; relationDesc: string | null; strength: RelationStrength }[] = []

  for (const r of rawRelations) {
    const a = contactMap.get(r.contactIdA)
    const b = contactMap.get(r.contactIdB)
    if (!a || !b) continue
    const key = normalizeKey(r.contactIdA, r.contactIdB)
    explicitKeys.add(key)
    result.push({
      contactIdA: r.contactIdA,
      contactIdB: r.contactIdB,
      relationDesc: r.relationDesc,
      strength: scoreExplicit(a, b, r.relationDesc),
    })
  }

  // 隐式推算（O(n²)，限制在 150 人以下）
  if (contacts.length >= 2 && contacts.length <= 150) {
    // 收集所有候选对的分数，只保留 score >= 0.22（至少共享一个维度）
    const candidates: { key: string; idA: string; idB: string; score: number }[] = []

    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        const a = contacts[i], b = contacts[j]
        const key = normalizeKey(a.id, b.id)
        if (explicitKeys.has(key)) continue
        const score = scoreImplicit(a, b)
        if (score >= 0.22) {
          candidates.push({ key, idA: a.id, idB: b.id, score })
        }
      }
    }

    // 按分数降序，最多取 min(200, candidates.length) 条，避免线条过密
    candidates.sort((a, b) => b.score - a.score)
    const limit = Math.min(200, candidates.length)
    for (let i = 0; i < limit; i++) {
      const { idA, idB, score } = candidates[i]
      result.push({
        contactIdA: idA,
        contactIdB: idB,
        relationDesc: null,
        strength: score >= 0.65 ? 'STRONG' : score >= 0.40 ? 'MEDIUM' : 'WEAK',
      })
    }
  }

  return result
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
    const [contacts, rawRelations] = await Promise.all([
      loadContactsWithArcFallback(userId),
      db.contactRelation.findMany({
        where: {
          OR: [{ contactA: { userId } }, { contactB: { userId } }],
        },
        select: {
          contactIdA: true,
          contactIdB: true,
          relationDesc: true,
        },
      }),
    ])

    const relations = buildRelations(contacts, rawRelations)

    return NextResponse.json({ contacts, relations })
  } catch (err) {
    console.error('[network] DB error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
