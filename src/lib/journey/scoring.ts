import { Contact, ContactRelation } from '@prisma/client'
import { RoleArchetype, Temperature } from '@/types'
import { detectJourneyGoalType, parseRelationVector, scoreArcVector } from '@/lib/arc'
import { ScoredContact } from './types'

/**
 * 航程评分权重配置（ARC + 网络）
 */
export const JOURNEY_WEIGHTS = {
  arc: 0.62,
  relevance: 0.18,
  accessibility: 0.12,
  centrality: 0.08,
}

const ARCHETYPE_KEYWORDS: Record<RoleArchetype, string[]> = {
  BREAKER: ['投资', '融资', '资源', '预算', '商务', '行业', '影响力', '标杆', '品牌'],
  EVANGELIST: ['介绍', '引荐', '连接', '拓展', '认识'],
  ANALYST: ['建议', '策略', '方向', '决策', '规划'],
  BINDER: ['关系', '维护', '支持', '破冰', '修复', '合作', '项目', '执行', '落地', '一起'],
}

function parseTagArray(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

/**
 * 计算关键词相关性（0-1）
 */
export function computeRelevanceScore(goal: string, contact: Contact): number {
  const goalText = goal.toLowerCase()
  const tags = parseTagArray(contact.tags)
  const roleKeywords = ARCHETYPE_KEYWORDS[contact.roleArchetype as RoleArchetype] ?? []

  const searchSpace = [
    ...tags,
    contact.industry ?? '',
    contact.company ?? '',
    contact.title ?? '',
    contact.notes ?? '',
  ]
    .join(' ')
    .toLowerCase()

  const keywordHit = roleKeywords.filter((kw) => goalText.includes(kw) || searchSpace.includes(kw)).length
  const keywordScore = roleKeywords.length > 0 ? keywordHit / roleKeywords.length : 0.4

  const tagHit = tags.filter((tag) => goalText.includes(tag.toLowerCase())).length
  const tagScore = tags.length > 0 ? Math.min(1, tagHit / Math.max(tags.length, 2)) : 0.35

  return Math.min(1, keywordScore * 0.55 + tagScore * 0.45)
}

/**
 * 计算可达性分数（0-1）
 */
export function computeAccessibilityScore(contact: Contact): number {
  const baseEnergy = contact.energyScore / 100

  const tempMultiplier =
    contact.temperature === 'HOT'
      ? 1.2
      : contact.temperature === 'WARM'
      ? 1.0
      : contact.temperature === 'COLD'
      ? 0.62
      : 0.82

  const trustMultiplier = contact.trustLevel != null ? contact.trustLevel / 5 : 0.5

  const now = Date.now()
  const daysSinceContact = contact.lastContactedAt
    ? (now - contact.lastContactedAt.getTime()) / 86_400_000
    : 180

  let recencyDecay = 1
  if (daysSinceContact > 30) {
    recencyDecay = daysSinceContact >= 180 ? 0.5 : 1 - 0.5 * ((daysSinceContact - 30) / 150)
  }

  return Math.min(1, baseEnergy * tempMultiplier * trustMultiplier * recencyDecay)
}

/**
 * 计算网络中心度分数（0-1）
 */
export function computeNetworkCentrality(contactId: string, relations: ContactRelation[]): number {
  const degree = relations.filter((r) => r.contactIdA === contactId || r.contactIdB === contactId).length

  const degreeMap = new Map<string, number>()
  for (const rel of relations) {
    degreeMap.set(rel.contactIdA, (degreeMap.get(rel.contactIdA) ?? 0) + 1)
    degreeMap.set(rel.contactIdB, (degreeMap.get(rel.contactIdB) ?? 0) + 1)
  }
  const maxDegree = Math.max(...Array.from(degreeMap.values()), 1)

  return Math.min(1, degree / maxDegree)
}

/**
 * 综合航程分（0-1）
 */
export function computeJourneyScore(
  arcScore: number,
  relevance: number,
  accessibility: number,
  centrality: number,
): number {
  return (
    JOURNEY_WEIGHTS.arc * arcScore +
    JOURNEY_WEIGHTS.relevance * relevance +
    JOURNEY_WEIGHTS.accessibility * accessibility +
    JOURNEY_WEIGHTS.centrality * centrality
  )
}

export function scoreAllContacts(
  contacts: Contact[],
  relations: ContactRelation[],
  goal: string,
): ScoredContact[] {
  const goalType = detectJourneyGoalType(goal)

  return contacts
    .map((contact) => {
      const relationVector = parseRelationVector(contact.relationVector)
      const arcScore = relationVector ? scoreArcVector(relationVector, goalType) : 0.45
      const relevanceScore = computeRelevanceScore(goal, contact)
      const accessibilityScore = computeAccessibilityScore(contact)
      const centralityScore = computeNetworkCentrality(contact.id, relations)
      const journeyScore = computeJourneyScore(arcScore, relevanceScore, accessibilityScore, centralityScore)

      return {
        id: contact.id,
        name: contact.name,
        company: contact.company || null,
        title: contact.title || null,
        roleArchetype: contact.roleArchetype as RoleArchetype,
        tags: parseTagArray(contact.tags),
        temperature: contact.temperature as Temperature | null,
        energyScore: contact.energyScore,
        trustLevel: contact.trustLevel || null,
        lastContactedAt: contact.lastContactedAt,
        notes: contact.notes || null,
        archetype: contact.archetype || null,
        relationVector,
        arcScore,
        relevanceScore,
        accessibilityScore,
        centralityScore,
        journeyScore,
      } as ScoredContact
    })
    .sort((a, b) => b.journeyScore - a.journeyScore)
}

export function selectTopContacts(scoredContacts: ScoredContact[], topK = 15): ScoredContact[] {
  return scoredContacts.slice(0, topK)
}
