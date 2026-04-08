import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId, requireAuth } from '@/lib/session'
import { scoreAllContacts, selectTopContacts } from '@/lib/journey/scoring'
import { buildCandidatePaths } from '@/lib/journey/pathfinding'
import { analyzeJourneyWithClaude, CompanyContext } from '@/lib/journey/prompt'
import { JourneyAnalysisResponse } from '@/lib/journey/types'

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

async function resolveJourneyUserId(): Promise<string> {
  try {
    const { userId } = await requireAuth()
    return userId
  } catch {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('UNAUTHORIZED')
    }
    return resolveDevUserId()
  }
}

function summarizeArchetypes(scoredContacts: ReturnType<typeof scoreAllContacts>) {
  const counter = new Map<string, number>()
  for (const c of scoredContacts) {
    if (!c.archetype) continue
    counter.set(c.archetype, (counter.get(c.archetype) ?? 0) + 1)
  }
  return Array.from(counter.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }))
}

async function loadContactsWithArcFallback(userId: string) {
  try {
    return await db.contact.findMany({ where: { userId } })
  } catch (error) {
    const msg = error instanceof Error ? error.message.toLowerCase() : ''
    const arcColumnMissing =
      msg.includes('does not exist') &&
      (msg.includes('contact.relationvector') || msg.includes('contact.quickcontext') || msg.includes('contact.archetype'))

    if (!arcColumnMissing) throw error

    const legacy = await db.contact.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        name: true,
        wechat: true,
        phone: true,
        email: true,
        spiritAnimal: true,
        relationRole: true,
        tags: true,
        industry: true,
        company: true,
        title: true,
        jobPosition: true,
        trustLevel: true,
        temperature: true,
        energyScore: true,
        notes: true,
        lastContactedAt: true,
        companyId: true,
      },
    })

    return legacy.map((c) => ({
      ...c,
      quickContext: null,
      relationVector: null,
      archetype: null,
    }))
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await resolveJourneyUserId()
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '10'), 50)
    const offset = Math.max(parseInt(request.nextUrl.searchParams.get('offset') || '0'), 0)

    const journeys = await db.journey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    return NextResponse.json({
      journeys: journeys.map((j) => ({
        id: j.id,
        goal: j.goal,
        aiAnalysis: j.aiAnalysis,
        pathData: j.pathData,
        createdAt: j.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }
    console.error('GET /api/journey 错误:', error)
    return NextResponse.json({ error: '获取历史失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { goal } = body

    if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
      return NextResponse.json({ error: '目标不能为空' }, { status: 400 })
    }

    const userId = await resolveJourneyUserId()

    const [selfProfile, contacts, rawCompanies] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          goal: true,
          selfTags: true,
          selfCompany: true,
          selfTitle: true,
          selfJobPosition: true,
          selfSpiritAnimal: true,
          selfBio: true,
        },
      }),
      loadContactsWithArcFallback(userId),
      db.company.findMany({
        where: { userId },
        include: { contacts: { select: { id: true } } },
      }).catch(() => [] as never[]),
    ])

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: '请先添加联系人后再进行航程分析', code: 'NO_CONTACTS' },
        { status: 400 },
      )
    }

    const companies: CompanyContext[] = rawCompanies.map((c) => {
      function parseArr(raw: string | null | undefined): string[] {
        if (!raw) return []
        try { return JSON.parse(raw) } catch { return [] }
      }
      return {
        id: c.id,
        name: c.name,
        industry: c.industry,
        scale: c.scale,
        mainBusiness: c.mainBusiness,
        tags: parseArr(c.tags),
        familiarityLevel: c.familiarityLevel,
        temperature: c.temperature,
        energyScore: c.energyScore,
        founderName: c.founderName,
        investors: parseArr(c.investors),
        linkedContactIds: (c as never as { contacts: { id: string }[] }).contacts.map((x: { id: string }) => x.id),
      }
    })

    const nintyDaysAgo = new Date(Date.now() - 90 * 86_400_000)
    const [relations, recentInteractions] = await Promise.all([
      db.contactRelation.findMany({
        where: {
          OR: [
            { contactIdA: { in: contacts.map((c) => c.id) } },
            { contactIdB: { in: contacts.map((c) => c.id) } },
          ],
        },
      }),
      db.interaction.groupBy({
        by: ['contactId'],
        where: {
          contactId: { in: contacts.map((c) => c.id) },
          date: { gte: nintyDaysAgo },
        },
        _count: { id: true },
      }),
    ])

    const interactionMap = new Map(recentInteractions.map(r => [r.contactId, r._count.id]))

    const scoredContacts = scoreAllContacts(contacts as never, relations, goal, interactionMap)
    const averageArcScore = scoredContacts.length > 0
      ? scoredContacts.reduce((sum, item) => sum + item.arcScore, 0) / scoredContacts.length
      : 0
    const arcCoverage = scoredContacts.length > 0
      ? scoredContacts.filter((c) => c.relationVector != null).length / scoredContacts.length
      : 0
    const topArcArchetypes = summarizeArchetypes(scoredContacts)

    const topContacts = selectTopContacts(scoredContacts, 15)
    const candidatePaths = buildCandidatePaths(topContacts, relations)

    if (candidatePaths.length === 0) {
      return NextResponse.json({ error: '无法分析路径，请检查人脉数据' }, { status: 400 })
    }

    if (!process.env.QWEN_API_KEY) {
      return NextResponse.json({ error: 'AI 服务未配置' }, { status: 503 })
    }

    let pathData
    try {
      pathData = await analyzeJourneyWithClaude(
        goal,
        topContacts,
        relations,
        candidatePaths,
        selfProfile ?? undefined,
        companies.length > 0 ? companies : undefined,
      )
    } catch (claudeError) {
      console.error('Qwen 分析失败:', claudeError)
      return NextResponse.json({ error: 'AI 分析失败: ' + String(claudeError) }, { status: 503 })
    }

    pathData.meta.averageArcScore = Number(averageArcScore.toFixed(3))
    pathData.meta.arcCoverage = Number(arcCoverage.toFixed(3))
    pathData.meta.topArcArchetypes = topArcArchetypes

    const journey = await db.journey.create({
      data: {
        userId,
        goal,
        aiAnalysis: pathData.overallStrategy,
        pathData: JSON.parse(JSON.stringify(pathData)),
      },
    })

    const response: JourneyAnalysisResponse = {
      journey: {
        id: journey.id,
        goal: journey.goal,
        aiAnalysis: journey.aiAnalysis,
        pathData,
        createdAt: journey.createdAt.toISOString(),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }
    console.error('POST /api/journey 错误:', error)
    return NextResponse.json({ error: '分析失败: ' + String(error) }, { status: 500 })
  }
}
