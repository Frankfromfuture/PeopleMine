import fs from 'fs'
import path from 'path'

export interface JourneyWeights {
  relevance: number
  accessibility: number
  centrality: number
}

export interface TempMultipliers {
  HOT: number
  WARM: number
  COLD: number
  DEFAULT: number
}

export interface RecencyDecay {
  warmupDays: number
  maxDays: number
  minDecay: number
}

export interface FormulaCondition {
  id: string
  enabled: boolean
  label: string
  variable: string
  operator: '==' | '!=' | '>' | '<' | '>=' | '<='
  value: string
  adjustment: 'multiply' | 'add' | 'subtract'
  amount: number
  target: 'journeyScore' | 'relevanceScore' | 'accessibilityScore'
}

export interface FormulaConfig {
  journeyWeights: JourneyWeights
  relevanceWeights: { keyword: number; roleAffinity: number }
  tempMultipliers: TempMultipliers
  recencyDecay: RecencyDecay
  journeyExpr: string
  relevanceExpr: string
  accessibilityExpr: string
  roleAffinityMatrix: Record<string, Record<string, number>>
  inferLinksWeights: {
    roleComplement: number
    tagOverlap: number
    temperatureBonus: number
    energyFactorMin: number
    strengthThreshold: number
    maxDegree: number
  }
  conditions: FormulaCondition[]
}

const CONFIG_PATH = path.join(process.cwd(), 'src/data/dev/formula-config.json')

export const DEFAULT_FORMULA_CONFIG: FormulaConfig = {
  journeyWeights: { relevance: 0.45, accessibility: 0.35, centrality: 0.20 },
  relevanceWeights: { keyword: 0.60, roleAffinity: 0.40 },
  tempMultipliers: { HOT: 1.2, WARM: 1.0, COLD: 0.6, DEFAULT: 0.8 },
  recencyDecay: { warmupDays: 30, maxDays: 180, minDecay: 0.5 },
  journeyExpr: 'relevance * w_relevance + accessibility * w_accessibility + centrality * w_centrality',
  relevanceExpr: 'keyword * w_keyword + roleAffinity * w_role',
  accessibilityExpr: 'Math.min(1, (energy / 100) * tempMult * trustMult * recencyDecay)',
  roleAffinityMatrix: {
    introduction: { BREAKER: 0.4, EVANGELIST: 1.0, ANALYST: 0.3, BINDER: 0.5 },
    resource: { BREAKER: 1.0, EVANGELIST: 0.7, ANALYST: 0.5, BINDER: 0.3 },
    advice: { BREAKER: 0.3, EVANGELIST: 0.4, ANALYST: 1.0, BINDER: 0.5 },
    collaboration: { BREAKER: 0.4, EVANGELIST: 0.5, ANALYST: 0.4, BINDER: 1.0 },
    information: { BREAKER: 0.5, EVANGELIST: 0.6, ANALYST: 0.9, BINDER: 0.5 },
  },
  inferLinksWeights: {
    roleComplement: 0.6, tagOverlap: 0.3, temperatureBonus: 0.1,
    energyFactorMin: 0.6, strengthThreshold: 0.25, maxDegree: 5,
  },
  conditions: [],
}

export function loadFormulaConfig(): FormulaConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<FormulaConfig>
    return { ...DEFAULT_FORMULA_CONFIG, ...parsed }
  } catch {
    return DEFAULT_FORMULA_CONFIG
  }
}

export function saveFormulaConfig(config: FormulaConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
}

export interface ContactInput {
  id: string
  name: string
  roleArchetype: string
  energyScore: number
  trustLevel: number | null
  temperature: string | null
  lastContactedAt: Date | null
  tags: string[]
  company: string | null
  title: string | null
}

export interface ScoreResult {
  contactId: string
  name: string
  company: string | null
  title: string | null
  roleArchetype: string
  energyScore: number
  journeyScore: number
  relevanceScore: number
  accessibilityScore: number
  centralityScore: number
}

/**
 * Evaluates a formula expression in a sandboxed context.
 * Returns 0 on error.
 */
function evalExpr(expr: string, vars: Record<string, number | string>): number {
  try {
    const keys = Object.keys(vars)
    const values = Object.values(vars)
    // eslint-disable-next-line no-new-func
    const fn = new Function('Math', ...keys, `return (${expr})`)
    const result = fn(Math, ...values)
    if (typeof result !== 'number' || !isFinite(result)) return 0
    return Math.max(0, Math.min(1, result))
  } catch {
    return 0
  }
}

function detectGoalCategories(goal: string): string[] {
  const keywords: Record<string, string[]> = {
    introduction: ['认识', '介绍', '引荐', '连接', '拓展'],
    resource: ['资源', '投资', '融资', '资金', '天使'],
    advice: ['建议', '方向', '策略', '请教', '指点'],
    collaboration: ['合作', '项目', '一起', '并肩', '携手'],
    information: ['行业', '信息', '洞察', '了解', '动态'],
  }
  const detected: string[] = []
  for (const [cat, kws] of Object.entries(keywords)) {
    if (kws.some((kw) => goal.includes(kw))) detected.push(cat)
  }
  return detected.length > 0 ? detected : ['other']
}

function computeKeywordMatch(goal: string, contact: ContactInput): number {
  if (!goal) return 0.5
  const searchable = [contact.tags.join(' '), contact.company || '', contact.title || '']
    .filter(Boolean).join(' ')
  const ngrams = new Set<string>()
  for (let len = 2; len <= 4; len++) {
    for (let i = 0; i <= goal.length - len; i++) {
      ngrams.add(goal.substring(i, i + len))
    }
  }
  let matches = 0
  for (const ng of ngrams) {
    if (searchable.includes(ng)) matches++
  }
  return Math.min(1, matches / Math.max(1, ngrams.size))
}

function computeRoleAffinity(
  goal: string,
  role: string,
  matrix: Record<string, Record<string, number>>,
): number {
  const categories = detectGoalCategories(goal)
  let max = 0
  for (const cat of categories) {
    const affinity = matrix[cat]?.[role] ?? 0.5
    if (affinity > max) max = affinity
  }
  return max || 0.5
}

function computeRecencyDecay(
  lastContactedAt: Date | null,
  cfg: RecencyDecay,
): number {
  const daysSince = lastContactedAt
    ? (Date.now() - lastContactedAt.getTime()) / 86_400_000
    : 180
  if (daysSince <= cfg.warmupDays) return 1.0
  if (daysSince >= cfg.maxDays) return cfg.minDecay
  return 1.0 - (1.0 - cfg.minDecay) * ((daysSince - cfg.warmupDays) / (cfg.maxDays - cfg.warmupDays))
}

/**
 * Computes scores for a list of contacts using the given formula config.
 */
export function computeScores(
  contacts: ContactInput[],
  relations: { contactIdA: string; contactIdB: string }[],
  goal: string,
  cfg: FormulaConfig,
): ScoreResult[] {
  // Precompute centrality
  const degreeMap = new Map<string, number>()
  for (const rel of relations) {
    degreeMap.set(rel.contactIdA, (degreeMap.get(rel.contactIdA) ?? 0) + 1)
    degreeMap.set(rel.contactIdB, (degreeMap.get(rel.contactIdB) ?? 0) + 1)
  }
  const maxDegree = Math.max(...Array.from(degreeMap.values()), 1)

  return contacts.map((contact) => {
    // --- relevance ---
    const keyword = computeKeywordMatch(goal, contact)
    const roleAffinity = computeRoleAffinity(goal, contact.roleArchetype, cfg.roleAffinityMatrix)
    const relevanceScore = evalExpr(cfg.relevanceExpr, {
      keyword,
      roleAffinity,
      w_keyword: cfg.relevanceWeights.keyword,
      w_role: cfg.relevanceWeights.roleAffinity,
    })

    // --- accessibility ---
    const energy = contact.energyScore
    const tempKey = contact.temperature ?? 'DEFAULT'
    const tempMult = cfg.tempMultipliers[tempKey as keyof TempMultipliers] ?? cfg.tempMultipliers.DEFAULT
    const trustMult = contact.trustLevel != null ? contact.trustLevel / 5 : 0.5
    const recencyDecay = computeRecencyDecay(contact.lastContactedAt, cfg.recencyDecay)
    const accessibilityScore = evalExpr(cfg.accessibilityExpr, {
      energy,
      tempMult,
      trustMult,
      recencyDecay,
    })

    // --- centrality ---
    const degree = degreeMap.get(contact.id) ?? 0
    const centralityScore = Math.min(1, degree / maxDegree)

    // --- journey score ---
    let journeyScore = evalExpr(cfg.journeyExpr, {
      relevance: relevanceScore,
      accessibility: accessibilityScore,
      centrality: centralityScore,
      w_relevance: cfg.journeyWeights.relevance,
      w_accessibility: cfg.journeyWeights.accessibility,
      w_centrality: cfg.journeyWeights.centrality,
    })

    // --- apply conditions ---
    for (const cond of cfg.conditions) {
      if (!cond.enabled) continue
      const contactVal = contact[cond.variable as keyof ContactInput]
      let passes = false
      const rawVal = String(contactVal ?? '')
      const condVal = cond.value
      switch (cond.operator) {
        case '==': passes = rawVal === condVal; break
        case '!=': passes = rawVal !== condVal; break
        case '>': passes = parseFloat(rawVal) > parseFloat(condVal); break
        case '<': passes = parseFloat(rawVal) < parseFloat(condVal); break
        case '>=': passes = parseFloat(rawVal) >= parseFloat(condVal); break
        case '<=': passes = parseFloat(rawVal) <= parseFloat(condVal); break
      }
      if (!passes) continue
      if (cond.target === 'journeyScore') {
        if (cond.adjustment === 'multiply') journeyScore = Math.min(1, journeyScore * cond.amount)
        else if (cond.adjustment === 'add') journeyScore = Math.min(1, journeyScore + cond.amount)
        else if (cond.adjustment === 'subtract') journeyScore = Math.max(0, journeyScore - cond.amount)
      }
    }

    return {
      contactId: contact.id,
      name: contact.name,
      company: contact.company,
      title: contact.title,
      roleArchetype: contact.roleArchetype,
      energyScore: contact.energyScore,
      journeyScore: Math.round(journeyScore * 1000) / 1000,
      relevanceScore: Math.round(relevanceScore * 1000) / 1000,
      accessibilityScore: Math.round(accessibilityScore * 1000) / 1000,
      centralityScore: Math.round(centralityScore * 1000) / 1000,
    }
  }).sort((a, b) => b.journeyScore - a.journeyScore)
}
