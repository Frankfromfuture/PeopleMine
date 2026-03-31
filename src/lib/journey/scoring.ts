import { ScoredContact } from './types'
import { Contact, ContactRelation } from '@prisma/client'
import { RelationRole, Temperature } from '@/types'

/**
 * 航程评分权重配置（可调整）
 */
export const JOURNEY_WEIGHTS = {
  relevance: 0.45,
  accessibility: 0.35,
  centrality: 0.2,
}

/**
 * 目标类型到角色亲和度的映射矩阵
 * 行 = 检测到的目标类型，列 = RelationRole
 */
const ROLE_AFFINITY_MATRIX: Record<
  string,
  Record<string, number>
> = {
  introduction: {
    // 认识/介绍/引荐类目标
    BIG_INVESTOR: 0.4,
    GATEWAY: 1.0,
    ADVISOR: 0.3,
    THERMOMETER: 0.6,
    LIGHTHOUSE: 0.5,
    COMRADE: 0.4,
  },
  resource: {
    // 资源/投资/融资类
    BIG_INVESTOR: 1.0,
    GATEWAY: 0.7,
    ADVISOR: 0.5,
    THERMOMETER: 0.3,
    LIGHTHOUSE: 0.6,
    COMRADE: 0.3,
  },
  advice: {
    // 建议/方向/策略类
    BIG_INVESTOR: 0.3,
    GATEWAY: 0.4,
    ADVISOR: 1.0,
    THERMOMETER: 0.5,
    LIGHTHOUSE: 0.7,
    COMRADE: 0.4,
  },
  collaboration: {
    // 合作/项目/并肩类
    BIG_INVESTOR: 0.4,
    GATEWAY: 0.5,
    ADVISOR: 0.4,
    THERMOMETER: 0.6,
    LIGHTHOUSE: 0.3,
    COMRADE: 1.0,
  },
  information: {
    // 行业/信息/洞察类
    BIG_INVESTOR: 0.5,
    GATEWAY: 0.6,
    ADVISOR: 0.9,
    THERMOMETER: 0.4,
    LIGHTHOUSE: 0.8,
    COMRADE: 0.5,
  },
}

/**
 * 关键词到目标类型的映射
 */
const GOAL_KEYWORDS: Record<string, string[]> = {
  introduction: [
    '认识',
    '介绍',
    '引荐',
    '认识一下',
    '连接',
    '拓展',
    '新认识',
  ],
  resource: ['资源', '投资', '融资', '资金', '钱', '募资', '融资', '天使'],
  advice: [
    '建议',
    '方向',
    '策略',
    '规划',
    '怎么做',
    '如何',
    '请教',
    '指点',
    '指导',
  ],
  collaboration: ['合作', '项目', '一起', '团队', '并肩', '共事', '携手'],
  information: [
    '行业',
    '信息',
    '洞察',
    '了解',
    '市场',
    '动态',
    '趋势',
    '资讯',
  ],
}

/**
 * 从目标文本中提取关键词（支持中文）
 */
function extractGoalTokens(goal: string): Set<string> {
  const tokens = new Set<string>()

  // 方法 1：按标点符号分割
  const punctuation = /[\s，。！？、：；\n\r]/
  const segments = goal.split(punctuation).filter((s) => s.length > 0)
  segments.forEach((seg) => tokens.add(seg))

  // 方法 2：字符级 n-gram（2-4 字符滑窗，用于抓住复合词）
  for (let len = 2; len <= 4; len++) {
    for (let i = 0; i <= goal.length - len; i++) {
      const ngram = goal.substring(i, i + len)
      if (!/^[\s，。！？、：；\n\r]+$/.test(ngram)) {
        tokens.add(ngram)
      }
    }
  }

  return tokens
}

/**
 * 检测目标类别（可能多个）
 */
function detectGoalCategory(goal: string): string[] {
  const detected: string[] = []
  const lowerGoal = goal.toLowerCase()

  for (const [category, keywords] of Object.entries(GOAL_KEYWORDS)) {
    if (keywords.some((kw) => goal.includes(kw) || lowerGoal.includes(kw))) {
      detected.push(category)
    }
  }

  return detected.length > 0 ? detected : ['other']
}

/**
 * 计算关键词匹配分数（0-1）
 */
function computeKeywordMatchScore(goal: string, contact: Contact): number {
  const goalTokens = extractGoalTokens(goal)
  if (goalTokens.size === 0) return 0.5 // 无法提取则给中等分

  // 解析tags（从JSON字符串转为数组）
  let tagsArray: string[] = []
  if (contact.tags) {
    try {
      tagsArray = JSON.parse(contact.tags)
      if (!Array.isArray(tagsArray)) tagsArray = []
    } catch {
      tagsArray = []
    }
  }

  // 构建联系人的可搜索文本
  const searchableText = [
    tagsArray.join(' '),
    contact.industry || '',
    contact.company || '',
    contact.title || '',
    (contact.notes || '').substring(0, 100), // 只看前 100 字
  ]
    .filter(Boolean)
    .join(' ')

  // 计算匹配数
  let matches = 0
  for (const token of goalTokens) {
    if (searchableText.includes(token)) {
      matches++
    }
  }

  return Math.min(1.0, matches / Math.max(1, goalTokens.size))
}

/**
 * 计算角色亲和度分数（0-1）
 */
function computeRoleAffinityScore(goal: string, role: string): number {
  const categories = detectGoalCategory(goal)
  if (!role || !ROLE_AFFINITY_MATRIX) return 0.5

  // 对每个检测到的类别，取该角色的亲和度，然后取最大值
  let maxAffinity = 0
  for (const category of categories) {
    const affinities = ROLE_AFFINITY_MATRIX[category]
    if (affinities && affinities[role] !== undefined) {
      maxAffinity = Math.max(maxAffinity, affinities[role])
    }
  }

  // 如果未检测到任何类别，使用默认值
  if (maxAffinity === 0) {
    return 0.5
  }

  return maxAffinity
}

/**
 * 计算相关性分数（0-1）
 */
export function computeRelevanceScore(
  goal: string,
  contact: Contact,
): number {
  const keywordMatch = computeKeywordMatchScore(goal, contact)
  const roleAffinity = computeRoleAffinityScore(goal, contact.relationRole)

  return 0.6 * keywordMatch + 0.4 * roleAffinity
}

/**
 * 计算可达性分数（0-1）
 */
export function computeAccessibilityScore(contact: Contact): number {
  // Base: energyScore
  const baseEnergy = contact.energyScore / 100

  // Temperature multiplier
  const tempMultiplier =
    contact.temperature === 'HOT'
      ? 1.2
      : contact.temperature === 'WARM'
        ? 1.0
        : contact.temperature === 'COLD'
          ? 0.6
          : 0.8

  // Trust level multiplier
  const trustMultiplier =
    contact.trustLevel != null ? contact.trustLevel / 5 : 0.5

  // Recency decay
  const now = Date.now()
  const daysSinceContact = contact.lastContactedAt
    ? (now - contact.lastContactedAt.getTime()) / 86_400_000
    : 180 // 默认 6 个月前

  let recencyDecay = 1.0
  if (daysSinceContact > 30) {
    if (daysSinceContact >= 180) {
      recencyDecay = 0.5
    } else {
      // 线性插值：30天时 1.0，180 天时 0.5
      recencyDecay = 1.0 - 0.5 * ((daysSinceContact - 30) / 150)
    }
  }

  const raw = baseEnergy * tempMultiplier * trustMultiplier * recencyDecay
  return Math.min(1.0, raw)
}

/**
 * 计算网络中心度分数（0-1）
 */
export function computeNetworkCentrality(
  contactId: string,
  relations: ContactRelation[],
): number {
  // 计算此联系人的边数
  const degree = relations.filter(
    (r) => r.contactIdA === contactId || r.contactIdB === contactId,
  ).length

  // 计算网络中的最大度数
  const degreeMap = new Map<string, number>()
  for (const rel of relations) {
    degreeMap.set(rel.contactIdA, (degreeMap.get(rel.contactIdA) ?? 0) + 1)
    degreeMap.set(rel.contactIdB, (degreeMap.get(rel.contactIdB) ?? 0) + 1)
  }
  const maxDegree = Math.max(...Array.from(degreeMap.values()), 1)

  return Math.min(1.0, degree / maxDegree)
}

/**
 * 计算综合航程分数（0-1）- 这是最重要的排序指标
 */
export function computeJourneyScore(
  relevance: number,
  accessibility: number,
  centrality: number,
): number {
  return (
    JOURNEY_WEIGHTS.relevance * relevance +
    JOURNEY_WEIGHTS.accessibility * accessibility +
    JOURNEY_WEIGHTS.centrality * centrality
  )
}

/**
 * 为所有联系人计算多维评分
 */
export function scoreAllContacts(
  contacts: Contact[],
  relations: ContactRelation[],
  goal: string,
): ScoredContact[] {
  return contacts.map((contact) => {
    const relevanceScore = computeRelevanceScore(goal, contact)
    const accessibilityScore = computeAccessibilityScore(contact)
    const centralityScore = computeNetworkCentrality(contact.id, relations)
    const journeyScore = computeJourneyScore(
      relevanceScore,
      accessibilityScore,
      centralityScore,
    )

    // 解析tags（从JSON字符串转为数组）
    let parsedTags: string[] = []
    if (contact.tags) {
      try {
        parsedTags = JSON.parse(contact.tags)
        if (!Array.isArray(parsedTags)) parsedTags = []
      } catch {
        parsedTags = []
      }
    }

    return {
      id: contact.id,
      name: contact.name,
      company: contact.company || null,
      title: contact.title || null,
      relationRole: contact.relationRole as RelationRole,
      tags: parsedTags,
      temperature: contact.temperature as Temperature | null,
      energyScore: contact.energyScore,
      trustLevel: contact.trustLevel || null,
      lastContactedAt: contact.lastContactedAt,
      notes: contact.notes || null,
      relevanceScore,
      accessibilityScore,
      centralityScore,
      journeyScore,
    } as ScoredContact
  })
}

/**
 * 选择 Top-K 联系人用于 Claude 分析
 */
export function selectTopContacts(
  scoredContacts: ScoredContact[],
  topK: number = 15,
): ScoredContact[] {
  return scoredContacts.sort((a, b) => b.journeyScore - a.journeyScore).slice(0, topK)
}
