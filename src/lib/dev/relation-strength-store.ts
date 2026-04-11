/**
 * 人脉关系强度计算引擎
 *
 * 综合所有人物标签，计算任意两个联系人之间的关系强弱，
 * 并将结果映射至企业宇宙中公司节点的边权重。
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type RoleArchetype = 'BREAKER' | 'EVANGELIST' | 'ANALYST' | 'BINDER'
export type SpiritAnimalNew = 'TIGER' | 'PEACOCK' | 'OWL' | 'KOALA'
export type Temperature = 'COLD' | 'WARM' | 'HOT'
export type JobPosition = 'FOUNDER' | 'PARTNER' | 'GENERAL_MANAGER' | 'VP' | 'DIRECTOR' | 'MANAGER' | 'OTHER'
export type JobFunction = 'MANAGEMENT' | 'INVESTMENT' | 'SALES' | 'ENGINEER' | 'MARKETING' | 'BUSINESS_DEV' | 'ADMIN' | 'OTHER'

export interface RelationStrengthWeights {
  /** 角色互补性 — 角色在目标达成上是否互补 */
  roleComplement: number
  /** 行业重叠度 — 同行业、同细分更容易产生共鸣 */
  industryOverlap: number
  /** 温度匹配 — 双方互动热度的组合效应 */
  temperatureMatch: number
  /** 层级协调 — 职级差异对关系可及性的影响 */
  positionLevel: number
  /** 职能相关性 — 工作职能之间的天然协作倾向 */
  functionAffinity: number
  /** 气场相性 — 气场动物人格之间的化学反应 */
  spiritAnimalAffinity: number
  /** 契合度加成 — trustLevel/chemistryScore 均值提升系数 */
  trustBonus: number
  /** 时效性衰减 — 联系时间越久、关系越淡化 */
  recencyDecay: number
}

export interface RelationStrengthConfig {
  /** 各维度权重（总和应接近 1） */
  weights: RelationStrengthWeights

  /**
   * 角色互补矩阵 4×4
   * roleComplementMatrix[roleA][roleB] = 0–1
   */
  roleComplementMatrix: Record<RoleArchetype, Record<RoleArchetype, number>>

  /**
   * 气场动物相性矩阵 4×4
   * animalAffinityMatrix[animalA][animalB] = 0–1
   */
  animalAffinityMatrix: Record<SpiritAnimalNew, Record<SpiritAnimalNew, number>>

  /**
   * 温度匹配矩阵 3×3
   * temperatureMatrix[tempA][tempB] = 0–1
   */
  temperatureMatrix: Record<Temperature, Record<Temperature, number>>

  /**
   * 职能相关性矩阵 8×8
   * functionAffinityMatrix[funcA][funcB] = 0–1
   */
  functionAffinityMatrix: Record<JobFunction, Record<JobFunction, number>>

  /** 层级排序权重（用于层级差计算，值越高意味着位越高） */
  positionOrdinals: Record<JobPosition, number>

  /** 行业配置 */
  industryConfig: {
    /** 同 L1 行业匹配分 */
    sameL1Score: number
    /** 同 L2 细分匹配分（需 L1 也相同） */
    sameL2Bonus: number
    /** 跨行业桥梁加成（不同行业但关系强时额外奖励） */
    crossIndustryBridgeBonus: number
  }

  /** 时效性衰减配置 */
  recencyConfig: {
    /** 联系后多少天内视为"近期" */
    freshDays: number
    /** 多少天后关系视为完全衰减 */
    staleDays: number
    /** 衰减最小分（floor） */
    minScore: number
  }

  /** 企业宇宙联动配置 */
  universeConfig: {
    /** 是否在企业宇宙中显示基于关系强度的动态边 */
    enableDynamicEdges: boolean
    /** 边强度阈值（低于此值不显示边） */
    edgeThreshold: number
    /** 公司间关系聚合方式 */
    aggregationMode: 'max' | 'avg' | 'sum_normalized'
    /** 同公司人脉关系对公司能量的加成系数 */
    intraCompanyBoost: number
  }
}

// ─── Default config ────────────────────────────────────────────────────────

export const DEFAULT_RELATION_STRENGTH_CONFIG: RelationStrengthConfig = {
  weights: {
    roleComplement:     0.22,
    industryOverlap:    0.16,
    temperatureMatch:   0.14,
    positionLevel:      0.10,
    functionAffinity:   0.12,
    spiritAnimalAffinity: 0.10,
    trustBonus:         0.10,
    recencyDecay:       0.06,
  },

  roleComplementMatrix: {
    //                BREAKER  EVANGELIST  ANALYST  BINDER
    BREAKER:    { BREAKER: 0.40, EVANGELIST: 0.85, ANALYST: 0.65, BINDER: 0.45 },
    EVANGELIST: { BREAKER: 0.85, EVANGELIST: 0.45, ANALYST: 0.55, BINDER: 0.75 },
    ANALYST:    { BREAKER: 0.65, EVANGELIST: 0.55, ANALYST: 0.40, BINDER: 0.60 },
    BINDER:     { BREAKER: 0.45, EVANGELIST: 0.75, ANALYST: 0.60, BINDER: 0.55 },
  },

  animalAffinityMatrix: {
    //             TIGER  PEACOCK  OWL   KOALA
    TIGER:   { TIGER: 0.35, PEACOCK: 0.80, OWL: 0.55, KOALA: 0.50 },
    PEACOCK: { TIGER: 0.80, PEACOCK: 0.45, OWL: 0.40, KOALA: 0.70 },
    OWL:     { TIGER: 0.55, PEACOCK: 0.40, OWL: 0.50, KOALA: 0.75 },
    KOALA:   { TIGER: 0.50, PEACOCK: 0.70, OWL: 0.75, KOALA: 0.60 },
  },

  temperatureMatrix: {
    //          HOT   WARM  COLD
    HOT:  { HOT: 1.00, WARM: 0.80, COLD: 0.35 },
    WARM: { HOT: 0.80, WARM: 0.65, COLD: 0.45 },
    COLD: { HOT: 0.35, WARM: 0.45, COLD: 0.30 },
  },

  functionAffinityMatrix: {
    //                  MGMT   INVEST  SALES  ENGR   MKT    BD     ADMIN  OTHER
    MANAGEMENT:   { MANAGEMENT:0.50, INVESTMENT:0.70, SALES:0.65, ENGINEER:0.50, MARKETING:0.60, BUSINESS_DEV:0.70, ADMIN:0.40, OTHER:0.45 },
    INVESTMENT:   { MANAGEMENT:0.70, INVESTMENT:0.45, SALES:0.55, ENGINEER:0.50, MARKETING:0.50, BUSINESS_DEV:0.65, ADMIN:0.30, OTHER:0.45 },
    SALES:        { MANAGEMENT:0.65, INVESTMENT:0.55, SALES:0.50, ENGINEER:0.40, MARKETING:0.80, BUSINESS_DEV:0.85, ADMIN:0.35, OTHER:0.45 },
    ENGINEER:     { MANAGEMENT:0.50, INVESTMENT:0.50, SALES:0.40, ENGINEER:0.55, MARKETING:0.40, BUSINESS_DEV:0.45, ADMIN:0.35, OTHER:0.45 },
    MARKETING:    { MANAGEMENT:0.60, INVESTMENT:0.50, SALES:0.80, ENGINEER:0.40, MARKETING:0.50, BUSINESS_DEV:0.75, ADMIN:0.35, OTHER:0.45 },
    BUSINESS_DEV: { MANAGEMENT:0.70, INVESTMENT:0.65, SALES:0.85, ENGINEER:0.45, MARKETING:0.75, BUSINESS_DEV:0.55, ADMIN:0.40, OTHER:0.50 },
    ADMIN:        { MANAGEMENT:0.40, INVESTMENT:0.30, SALES:0.35, ENGINEER:0.35, MARKETING:0.35, BUSINESS_DEV:0.40, ADMIN:0.45, OTHER:0.40 },
    OTHER:        { MANAGEMENT:0.45, INVESTMENT:0.45, SALES:0.45, ENGINEER:0.45, MARKETING:0.45, BUSINESS_DEV:0.50, ADMIN:0.40, OTHER:0.45 },
  },

  positionOrdinals: {
    FOUNDER: 7, PARTNER: 6, GENERAL_MANAGER: 5, VP: 4, DIRECTOR: 3, MANAGER: 2, OTHER: 1,
  },

  industryConfig: {
    sameL1Score: 0.60,
    sameL2Bonus: 0.35,
    crossIndustryBridgeBonus: 0.15,
  },

  recencyConfig: {
    freshDays: 30,
    staleDays: 180,
    minScore: 0.20,
  },

  universeConfig: {
    enableDynamicEdges: true,
    edgeThreshold: 0.30,
    aggregationMode: 'avg',
    intraCompanyBoost: 0.15,
  },
}

// ─── Computation helpers ───────────────────────────────────────────────────

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function getRoleScore(a: string | null | undefined, b: string | null | undefined, matrix: RelationStrengthConfig['roleComplementMatrix']): number {
  if (!a || !b) return 0.50
  const row = matrix[a as RoleArchetype]
  if (!row) return 0.50
  return row[b as RoleArchetype] ?? 0.50
}

function getAnimalScore(a: string | null | undefined, b: string | null | undefined, matrix: RelationStrengthConfig['animalAffinityMatrix']): number {
  if (!a || !b) return 0.55
  const row = matrix[a as SpiritAnimalNew]
  if (!row) return 0.55
  return row[b as SpiritAnimalNew] ?? 0.55
}

function getTempScore(a: string | null | undefined, b: string | null | undefined, matrix: RelationStrengthConfig['temperatureMatrix']): number {
  if (!a || !b) return 0.50
  const row = matrix[a as Temperature]
  if (!row) return 0.50
  return row[b as Temperature] ?? 0.50
}

function getFunctionScore(a: string | null | undefined, b: string | null | undefined, matrix: RelationStrengthConfig['functionAffinityMatrix']): number {
  if (!a || !b) return 0.45
  const row = matrix[a as JobFunction]
  if (!row) return 0.45
  return row[b as JobFunction] ?? 0.45
}

function getPositionScore(a: string | null | undefined, b: string | null | undefined, ordinals: RelationStrengthConfig['positionOrdinals']): number {
  if (!a || !b) return 0.60
  const oa = ordinals[a as JobPosition] ?? 3
  const ob = ordinals[b as JobPosition] ?? 3
  const diff = Math.abs(oa - ob)
  // 差值 0 = 同级 0.6，差 1 = 0.85（最互补），差 2 = 0.65，差 3+ 递减
  if (diff === 0) return 0.60
  if (diff === 1) return 0.85
  if (diff === 2) return 0.65
  return Math.max(0.25, 0.65 - (diff - 2) * 0.12)
}

function getIndustryScore(
  l1a: string | null | undefined, l2a: string | null | undefined,
  l1b: string | null | undefined, l2b: string | null | undefined,
  cfg: RelationStrengthConfig['industryConfig'],
): number {
  if (!l1a || !l1b) return 0.40
  if (l1a === l1b) {
    const base = cfg.sameL1Score
    if (l2a && l2b && l2a === l2b) return clamp01(base + cfg.sameL2Bonus)
    return base
  }
  return cfg.crossIndustryBridgeBonus
}

function getRecencyScore(lastContactedAt: Date | string | null, cfg: RelationStrengthConfig['recencyConfig']): number {
  if (!lastContactedAt) return cfg.minScore
  const days = (Date.now() - new Date(lastContactedAt).getTime()) / 86_400_000
  if (days <= cfg.freshDays) return 1.0
  if (days >= cfg.staleDays) return cfg.minScore
  return clamp01(1.0 - (1.0 - cfg.minScore) * ((days - cfg.freshDays) / (cfg.staleDays - cfg.freshDays)))
}

function getTrustScore(trust: number | null | undefined): number {
  if (trust == null) return 0.50
  return clamp01(trust / 5)
}

// ─── Main computation ──────────────────────────────────────────────────────

export interface ContactForStrength {
  id: string
  name: string
  roleArchetype?: string | null
  spiritAnimal?: string | null
  temperature?: string | null
  jobPosition?: string | null
  jobFunction?: string | null
  industryL1?: string | null
  industryL2?: string | null
  industry?: string | null
  trustLevel?: number | null
  chemistryScore?: number | null
  companyName?: string | null
  company?: string | null
  lastContactedAt?: Date | string | null
}

export interface StrengthBreakdown {
  score: number
  factors: {
    roleComplement: number
    industryOverlap: number
    temperatureMatch: number
    positionLevel: number
    functionAffinity: number
    spiritAnimalAffinity: number
    trustBonus: number
    recencyDecay: number
  }
}

/**
 * Computes the relationship strength between two contacts.
 * Returns a score [0,1] with per-factor breakdown.
 */
export function computePairStrength(
  a: ContactForStrength,
  b: ContactForStrength,
  cfg: RelationStrengthConfig,
): StrengthBreakdown {
  const w = cfg.weights

  const roleScore      = getRoleScore(a.roleArchetype, b.roleArchetype, cfg.roleComplementMatrix)
  const industryScore  = getIndustryScore(a.industryL1 ?? a.industry, a.industryL2, b.industryL1 ?? b.industry, b.industryL2, cfg.industryConfig)
  const tempScore      = getTempScore(a.temperature, b.temperature, cfg.temperatureMatrix)
  const posScore       = getPositionScore(a.jobPosition, b.jobPosition, cfg.positionOrdinals)
  const funcScore      = getFunctionScore(a.jobFunction, b.jobFunction, cfg.functionAffinityMatrix)
  const animalScore    = getAnimalScore(a.spiritAnimal, b.spiritAnimal, cfg.animalAffinityMatrix)
  const trustScore     = (getTrustScore(a.chemistryScore ?? a.trustLevel) + getTrustScore(b.chemistryScore ?? b.trustLevel)) / 2
  const recencyScore   = Math.min(
    getRecencyScore(a.lastContactedAt ?? null, cfg.recencyConfig),
    getRecencyScore(b.lastContactedAt ?? null, cfg.recencyConfig),
  )

  const rawScore =
    w.roleComplement     * roleScore +
    w.industryOverlap    * industryScore +
    w.temperatureMatch   * tempScore +
    w.positionLevel      * posScore +
    w.functionAffinity   * funcScore +
    w.spiritAnimalAffinity * animalScore +
    w.trustBonus         * trustScore +
    w.recencyDecay       * recencyScore

  const totalW = Object.values(w).reduce((s, v) => s + v, 0)

  return {
    score: clamp01(rawScore / Math.max(totalW, 1e-6)),
    factors: {
      roleComplement:      roleScore,
      industryOverlap:     industryScore,
      temperatureMatch:    tempScore,
      positionLevel:       posScore,
      functionAffinity:    funcScore,
      spiritAnimalAffinity: animalScore,
      trustBonus:          trustScore,
      recencyDecay:        recencyScore,
    },
  }
}

export interface CompanyEdgeStrength {
  companyIdA: string
  companyIdB: string
  score: number        // 0–1
  pairCount: number    // number of contact pairs considered
}

/**
 * For each pair of companies, aggregate the pairwise contact strengths.
 * contactCompanyMap: contactId → companyName
 */
export function computeCompanyEdgeStrengths(
  contacts: ContactForStrength[],
  contactCompanyMap: Record<string, string>,
  cfg: RelationStrengthConfig,
): CompanyEdgeStrength[] {
  const byCompany = new Map<string, ContactForStrength[]>()

  for (const c of contacts) {
    const cname = contactCompanyMap[c.id] ?? c.companyName ?? c.company ?? null
    if (!cname) continue
    if (!byCompany.has(cname)) byCompany.set(cname, [])
    byCompany.get(cname)!.push(c)
  }

  const companies = Array.from(byCompany.keys())
  const edges: CompanyEdgeStrength[] = []

  for (let i = 0; i < companies.length; i++) {
    for (let j = i + 1; j < companies.length; j++) {
      const groupA = byCompany.get(companies[i])!
      const groupB = byCompany.get(companies[j])!

      const scores: number[] = []
      for (const a of groupA) {
        for (const b of groupB) {
          const s = computePairStrength(a, b, cfg)
          scores.push(s.score)
        }
      }
      if (scores.length === 0) continue

      let agg: number
      const mode = cfg.universeConfig.aggregationMode
      if (mode === 'max') {
        agg = Math.max(...scores)
      } else if (mode === 'sum_normalized') {
        agg = clamp01(scores.reduce((s, v) => s + v, 0) / Math.max(scores.length, 1))
      } else {
        agg = scores.reduce((s, v) => s + v, 0) / scores.length
      }

      edges.push({ companyIdA: companies[i], companyIdB: companies[j], score: agg, pairCount: scores.length })
    }
  }

  return edges.filter(e => e.score >= cfg.universeConfig.edgeThreshold)
}

// ─── Persistence ───────────────────────────────────────────────────────────
// loadRelationStrengthConfig / saveRelationStrengthConfig 已移至
// src/lib/dev/relation-strength-persistence.ts（服务端专用，使用 fs/path）
