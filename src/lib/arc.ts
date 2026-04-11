import type {
  QuickContext,
  QuickFrequency,
  QuickScene,
  RelationVector,
  RoleArchetype,
  Temperature,
} from '@/types'

type JourneyGoalType = 'GET_INTRO' | 'CLOSE_COOPERATION' | 'REPAIR_RELATION' | 'LONG_TERM_ALLIANCE'

type ArcWeights = {
  trust: number
  power: number
  align: number
  reciprocity: number
  boundary: number
  volatility: number
}

export const ARC_GOAL_WEIGHTS: Record<JourneyGoalType, ArcWeights> = {
  GET_INTRO: {
    trust: 0.22,
    power: 0.28,
    align: 0.2,
    reciprocity: 0.14,
    boundary: 0.08,
    volatility: 0.08,
  },
  CLOSE_COOPERATION: {
    trust: 0.24,
    power: 0.16,
    align: 0.26,
    reciprocity: 0.18,
    boundary: 0.1,
    volatility: 0.06,
  },
  REPAIR_RELATION: {
    trust: 0.2,
    power: 0.05,
    align: 0.16,
    reciprocity: 0.18,
    boundary: 0.2,
    volatility: 0.21,
  },
  LONG_TERM_ALLIANCE: {
    trust: 0.27,
    power: 0.1,
    align: 0.23,
    reciprocity: 0.2,
    boundary: 0.16,
    volatility: 0.04,
  },
}

export const DEFAULT_QUICK_CONTEXT: QuickContext = {
  scene: 'WORK',
  frequency: 'MEDIUM',
  temperature: 'WARM',
}

export const DEFAULT_RELATION_VECTOR: RelationVector = {
  trust: 50,
  powerDelta: 0,
  goalAlignment: 50,
  emotionalVolatility: 40,
  reciprocity: 50,
  boundaryStability: 55,
  confidence: 0.35,
  updatedAt: '',
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function normalizePower(powerDelta: number): number {
  return clamp((powerDelta + 100) / 2, 0, 100)
}

export function parseQuickContext(raw: unknown): QuickContext | null {
  if (!raw || typeof raw !== 'object') return null
  const src = raw as Record<string, unknown>
  const scene = src.scene as QuickScene
  const frequency = src.frequency as QuickFrequency
  const temperature = src.temperature as Temperature
  if (!scene || !frequency || !temperature) return null
  return { scene, frequency, temperature }
}

export function parseRelationVector(raw: unknown): RelationVector | null {
  if (!raw || typeof raw !== 'object') return null
  const src = raw as Record<string, unknown>
  if (
    typeof src.trust !== 'number' ||
    typeof src.powerDelta !== 'number' ||
    typeof src.goalAlignment !== 'number' ||
    typeof src.emotionalVolatility !== 'number' ||
    typeof src.reciprocity !== 'number' ||
    typeof src.boundaryStability !== 'number'
  ) {
    return null
  }

  return {
    trust: clamp(src.trust, 0, 100),
    powerDelta: clamp(src.powerDelta, -100, 100),
    goalAlignment: clamp(src.goalAlignment, 0, 100),
    emotionalVolatility: clamp(src.emotionalVolatility, 0, 100),
    reciprocity: clamp(src.reciprocity, 0, 100),
    boundaryStability: clamp(src.boundaryStability, 0, 100),
    confidence: typeof src.confidence === 'number' ? clamp(src.confidence, 0, 1) : 0.35,
    updatedAt: typeof src.updatedAt === 'string' ? src.updatedAt : new Date().toISOString(),
  }
}

function applyArchetypeBias(archetype: RoleArchetype, vector: RelationVector) {
  if (archetype === 'BREAKER') {
    vector.powerDelta += 40
    vector.goalAlignment += 10
    vector.trust -= 3
  }
  if (archetype === 'EVANGELIST') {
    vector.powerDelta += 20
    vector.goalAlignment += 5
    vector.reciprocity -= 5
  }
  if (archetype === 'ANALYST') {
    vector.trust += 10
    vector.boundaryStability += 10
  }
  if (archetype === 'BINDER') {
    vector.trust += 8
    vector.emotionalVolatility -= 8
    vector.goalAlignment += 20
    vector.reciprocity += 15
    vector.powerDelta -= 5
  }
}

function applyContextBias(context: QuickContext, vector: RelationVector) {
  if (context.frequency === 'HIGH') {
    vector.trust += 8
    vector.goalAlignment += 5
  }
  if (context.temperature === 'COLD') {
    vector.trust -= 8
    vector.emotionalVolatility += 8
  }
  if (context.scene === 'WORK') {
    vector.boundaryStability += 6
  }
  if (context.scene === 'PARTNER') {
    vector.emotionalVolatility += 10
    vector.trust += 6
  }
}

export function inferArchetype(vector: RelationVector): string {
  if (vector.trust >= 70 && vector.goalAlignment >= 70 && vector.emotionalVolatility <= 35) {
    return '稳舵同航型'
  }
  if (vector.powerDelta >= 40 && vector.trust < 50) {
    return '高位观察型'
  }
  if (vector.emotionalVolatility >= 70 && vector.boundaryStability < 45) {
    return '湍流牵引型'
  }
  if (vector.reciprocity >= 70 && vector.goalAlignment >= 60) {
    return '互惠共振型'
  }
  return '渐进协作型'
}

export function buildArcForContact(input: {
  roleArchetype: RoleArchetype
  quickContext?: Partial<QuickContext> | null
  temperature?: Temperature | null
  relationVector?: RelationVector | null
}): {
  quickContext: QuickContext
  relationVector: RelationVector
  archetype: string
} {
  const mergedContext: QuickContext = {
    scene: input.quickContext?.scene ?? DEFAULT_QUICK_CONTEXT.scene,
    frequency: input.quickContext?.frequency ?? DEFAULT_QUICK_CONTEXT.frequency,
    temperature: input.quickContext?.temperature ?? input.temperature ?? DEFAULT_QUICK_CONTEXT.temperature,
  }

  const vector: RelationVector = {
    ...DEFAULT_RELATION_VECTOR,
    ...(input.relationVector ?? {}),
    updatedAt: new Date().toISOString(),
  }

  applyArchetypeBias(input.roleArchetype, vector)
  applyContextBias(mergedContext, vector)

  vector.trust = clamp(vector.trust, 0, 100)
  vector.powerDelta = clamp(vector.powerDelta, -100, 100)
  vector.goalAlignment = clamp(vector.goalAlignment, 0, 100)
  vector.emotionalVolatility = clamp(vector.emotionalVolatility, 0, 100)
  vector.reciprocity = clamp(vector.reciprocity, 0, 100)
  vector.boundaryStability = clamp(vector.boundaryStability, 0, 100)
  vector.confidence = clamp(vector.confidence, 0, 1)

  return {
    quickContext: mergedContext,
    relationVector: vector,
    archetype: inferArchetype(vector),
  }
}

export function detectJourneyGoalType(goal: string): JourneyGoalType {
  if (/认识|介绍|引荐|链接|连接/.test(goal)) return 'GET_INTRO'
  if (/合作|签约|项目|推进|成交/.test(goal)) return 'CLOSE_COOPERATION'
  if (/修复|挽回|缓和|破冰/.test(goal)) return 'REPAIR_RELATION'
  return 'LONG_TERM_ALLIANCE'
}

export function scoreArcVector(vector: RelationVector, goalType: JourneyGoalType): number {
  const w = ARC_GOAL_WEIGHTS[goalType]
  const score =
    w.trust * vector.trust +
    w.power * normalizePower(vector.powerDelta) +
    w.align * vector.goalAlignment +
    w.reciprocity * vector.reciprocity +
    w.boundary * vector.boundaryStability -
    w.volatility * vector.emotionalVolatility

  return clamp(score / 100, 0, 1)
}
