import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'

type RelationStrength = 'STRONG' | 'MEDIUM' | 'WEAK'

type CompanyLite = {
  id: string
  name: string
  industry: string | null
  mainBusiness: string | null
  tags: string | null
  investors: string | null
  upstreams: string | null
  downstreams: string | null
}

type RelationEdge = {
  companyIdA: string
  companyIdB: string
  relationDesc: string | null
  strength: RelationStrength
  score: number
  reason: string
  isInferred: boolean
}

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((v) => String(v).trim()).filter(Boolean)
  } catch {
    return []
  }
}

function normalizeKey(a: string, b: string) {
  return [a, b].sort().join('|')
}

function clamp(v: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v))
}

function scoreByIndustryChain(a: CompanyLite, b: CompanyLite, explicitDesc?: string | null) {
  const tagsA = parseJsonArray(a.tags)
  const tagsB = parseJsonArray(b.tags)
  const invA = parseJsonArray(a.investors)
  const invB = parseJsonArray(b.investors)
  const upA = parseJsonArray(a.upstreams)
  const upB = parseJsonArray(b.upstreams)
  const downA = parseJsonArray(a.downstreams)
  const downB = parseJsonArray(b.downstreams)

  let score = 0
  const reasons: string[] = []

  if (a.industry && b.industry && a.industry === b.industry) {
    score += 0.22
    reasons.push('同产业赛道')
  }

  const tagOverlap = tagsA.filter((t) => tagsB.includes(t)).length
  if (tagOverlap > 0) {
    score += Math.min(0.28, tagOverlap * 0.09)
    reasons.push(`标签重叠 ${tagOverlap} 项`)
  }

  const investorOverlap = invA.filter((t) => invB.includes(t)).length
  if (investorOverlap > 0) {
    score += Math.min(0.24, investorOverlap * 0.12)
    reasons.push('资本网络有重叠')
  }

  const aToB = upA.includes(b.name) || downB.includes(a.name)
  const bToA = upB.includes(a.name) || downA.includes(b.name)
  if (aToB || bToA) {
    score += 0.42
    reasons.push('存在上下游链路')
  }

  if (a.mainBusiness && b.mainBusiness) {
    const kwA = a.mainBusiness.split(/[、，,\s/]+/).filter(Boolean)
    const kwB = b.mainBusiness.split(/[、，,\s/]+/).filter(Boolean)
    const bizOverlap = kwA.filter((k) => kwB.includes(k)).length
    if (bizOverlap > 0) {
      score += Math.min(0.16, bizOverlap * 0.08)
      reasons.push('主营业务有协同')
    }
  }

  if (explicitDesc) {
    score += 0.36
    reasons.push('已存在手工关系')
  }

  const finalScore = clamp(score)
  const strength: RelationStrength = finalScore >= 0.7 ? 'STRONG' : finalScore >= 0.45 ? 'MEDIUM' : 'WEAK'

  return {
    score: finalScore,
    strength,
    reason: reasons.join('；') || '弱相关',
  }
}

async function refineWithAI(
  companies: CompanyLite[],
  edges: RelationEdge[],
): Promise<Map<string, { score: number; strength: RelationStrength; reason: string }>> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || edges.length === 0) return new Map()

  const companyMap = new Map(companies.map((c) => [c.id, c]))
  const payload = edges.slice(0, 60).map((e) => {
    const a = companyMap.get(e.companyIdA)
    const b = companyMap.get(e.companyIdB)
    return {
      pair: `${e.companyIdA}|${e.companyIdB}`,
      companyA: {
        name: a?.name,
        industry: a?.industry,
        mainBusiness: a?.mainBusiness,
        tags: parseJsonArray(a?.tags),
        upstreams: parseJsonArray(a?.upstreams),
        downstreams: parseJsonArray(a?.downstreams),
        investors: parseJsonArray(a?.investors),
      },
      companyB: {
        name: b?.name,
        industry: b?.industry,
        mainBusiness: b?.mainBusiness,
        tags: parseJsonArray(b?.tags),
        upstreams: parseJsonArray(b?.upstreams),
        downstreams: parseJsonArray(b?.downstreams),
        investors: parseJsonArray(b?.investors),
      },
      relationDesc: e.relationDesc,
      heuristicScore: e.score,
      heuristicStrength: e.strength,
    }
  })

  const prompt = `你是产业链分析顾问。请判断企业对之间的产业链合作可能性强弱。
输出严格 JSON：{"edges":[{"pair":"idA|idB","score":0-1,"strength":"STRONG|MEDIUM|WEAK","reason":"中文简述"}]}
判定要求：
- 上下游直接匹配/明显供需互补 => 倾向 STRONG
- 同行业但竞合不明确 => MEDIUM 或 WEAK
- 无明显协同 => WEAK
输入数据：${JSON.stringify(payload)}`

  try {
    const client = new Anthropic({ apiKey: key })
    const msg = await client.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 2800,
      temperature: 0.1,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = msg.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')

    const jsonText = (() => {
      const trimmed = rawText.trim()
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed
      const start = trimmed.indexOf('{')
      const end = trimmed.lastIndexOf('}')
      if (start >= 0 && end > start) return trimmed.slice(start, end + 1)
      return trimmed
    })()

    const parsed = JSON.parse(jsonText) as { edges?: Array<{ pair: string; score: number; strength: RelationStrength; reason?: string }> }
    const map = new Map<string, { score: number; strength: RelationStrength; reason: string }>()

    for (const edge of parsed.edges ?? []) {
      if (!edge?.pair) continue
      const strength = edge.strength === 'STRONG' || edge.strength === 'MEDIUM' || edge.strength === 'WEAK' ? edge.strength : 'WEAK'
      map.set(edge.pair, {
        score: clamp(Number(edge.score) || 0),
        strength,
        reason: edge.reason?.trim() || 'AI 分析结果',
      })
    }

    return map
  } catch (err) {
    console.error('[company-relations] AI refine failed:', err)
    return new Map()
  }
}

async function buildEdgesForUser(userId: string): Promise<RelationEdge[]> {
  const [companies, explicitRelations] = await Promise.all([
    db.company.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        industry: true,
        mainBusiness: true,
        tags: true,
        investors: true,
        upstreams: true,
        downstreams: true,
      },
    }),
    db.companyRelation.findMany({
      where: {
        OR: [
          { companyA: { userId } },
          { companyB: { userId } },
        ],
      },
      select: { companyIdA: true, companyIdB: true, relationDesc: true },
    }),
  ])

  if (companies.length <= 1) return []

  const explicitMap = new Map(explicitRelations.map((r) => [normalizeKey(r.companyIdA, r.companyIdB), r]))
  const edges: RelationEdge[] = []

  for (let i = 0; i < companies.length; i++) {
    for (let j = i + 1; j < companies.length; j++) {
      const a = companies[i]
      const b = companies[j]
      const key = normalizeKey(a.id, b.id)
      const explicit = explicitMap.get(key)
      const scored = scoreByIndustryChain(a, b, explicit?.relationDesc)

      if (scored.score < 0.38 && !explicit) continue

      edges.push({
        companyIdA: a.id,
        companyIdB: b.id,
        relationDesc: explicit?.relationDesc || null,
        strength: scored.strength,
        score: scored.score,
        reason: scored.reason,
        isInferred: !explicit,
      })
    }
  }

  const aiMap = await refineWithAI(companies, edges)

  return edges.map((e) => {
    const ai = aiMap.get(`${e.companyIdA}|${e.companyIdB}`)
    if (!ai) return e
    return {
      ...e,
      score: ai.score,
      strength: ai.strength,
      reason: ai.reason || e.reason,
    }
  })
}

// GET /api/company-relations — list relations for the user's companies
export async function GET() {
  const userId = await getAuthUserId()
  const relations = await buildEdgesForUser(userId)
  return NextResponse.json({ relations })
}

// POST /api/company-relations — create a relation
export async function POST(req: NextRequest) {
  const userId = await getAuthUserId()
  const body: { companyIdA: string; companyIdB: string; relationDesc?: string } = await req.json()
  const { companyIdA, companyIdB, relationDesc } = body

  if (!companyIdA || !companyIdB) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
  }

  // Verify both companies belong to user
  const count = await db.company.count({
    where: { id: { in: [companyIdA, companyIdB] }, userId },
  })
  if (count < 2) return NextResponse.json({ error: '公司不存在' }, { status: 404 })

  const relation = await db.companyRelation.upsert({
    where: { companyIdA_companyIdB: { companyIdA, companyIdB } },
    update: { relationDesc: relationDesc || null },
    create: { companyIdA, companyIdB, relationDesc: relationDesc || null },
  })

  return NextResponse.json({ relation })
}
