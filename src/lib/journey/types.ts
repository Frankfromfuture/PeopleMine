import { RelationRole, Temperature } from '@/types'

/**
 * 完整的航程路径数据结构 - 存储在 Journey.pathData Json 字段
 * 包含所有评分、路径、沟通建议和缺失分析
 */
export interface JourneyPathData {
  version: 1

  meta: {
    goalCategory:
      | 'introduction'
      | 'resource'
      | 'advice'
      | 'collaboration'
      | 'information'
      | 'other'
    totalContacts: number
    analyzedContacts: number
    computedAt: string // ISO timestamp
    modelUsed: string
  }

  // 所有评分节点（Top-15）
  nodes: ScoredNode[]

  // 主推荐路径（有序的联系人 ID 和详细沟通建议）
  primaryPath: PathStep[]

  // 1-2 条备选路径
  alternativePaths: AlternativePath[]

  // 缺失角色分析
  missingNodes: MissingNode[]

  // AI 生成的整体策略（2-3 句中文）
  overallStrategy: string

  // 整体置信度 0-1
  overallConfidence: number
}

/**
 * 单个评分节点 - 用于图谱显示和路径计算
 */
export interface ScoredNode {
  contactId: string
  name: string
  company: string | null
  title: string | null
  relationRole: RelationRole
  tags: string[]
  temperature: Temperature | null
  energyScore: number
  trustLevel: number | null

  // 多维评分结果（0-1）
  journeyScore: number // 加权综合分
  relevanceScore: number // 相关性
  accessibilityScore: number // 可达性
  centralityScore: number // 网络中心度

  // Claude 输出
  journeyRoleLabel: string // e.g. "关键路径中转站"
  isOnPrimaryPath: boolean
  isOnAnyPath: boolean
}

/**
 * 主路径上的单个步骤 - 含具体沟通建议
 */
export interface PathStep {
  contactId: string
  contactName: string
  hopIndex: number // 0 = 直连用户，1 = 需经由前一步介绍
  introductionVia: string | null // 介绍人的 contactId（如果是 2 跳）
  introductionViaName: string | null

  communicationAdvice: CommunicationAdvice

  confidenceAtThisStep: number // 路径在此步骤的可信度（随着跳数衰减）
}

/**
 * 具体的沟通策略建议
 */
export interface CommunicationAdvice {
  openingLine: string // 具体开场白建议（中文）
  keyMessage: string // 核心信息/诉求（中文）
  timing: string // 时机建议（什么时候联系最好）
  caution: string | null // 注意事项，可为空
  channelSuggestion: 'wechat' | 'call' | 'meeting' | 'email' | 'event'
}

/**
 * 备选路径
 */
export interface AlternativePath {
  pathId: string // e.g. "alt-1"
  steps: PathStep[]
  score: number
  rationale: string // 为什么这是备选（中文）
}

/**
 * 缺失的关键角色节点
 */
export interface MissingNode {
  missingRole: RelationRole
  roleName: string // 中文角色名
  whyNeeded: string // 为什么这个角色对目标很重要
  howToFind: string // 建议在哪儿/怎么找这类人脉
}

/**
 * 内部计算用的评分对象（不存储，用于 API 计算）
 */
export interface ScoredContact {
  id: string
  name: string
  company: string | null
  title: string | null
  relationRole: RelationRole
  tags: string[]
  temperature: Temperature | null
  energyScore: number
  trustLevel: number | null
  lastContactedAt: Date | null
  notes: string | null

  // 计算结果
  relevanceScore: number
  accessibilityScore: number
  centralityScore: number
  journeyScore: number // 加权综合
}

/**
 * 候选路径（用于排名和选择）
 */
export interface CandidatePath {
  path: string[] // 联系人 ID 序列
  score: number
  roleSequence: string[] // 对应的关系角色序列
}

/**
 * API 请求体
 */
export interface JourneyAnalysisRequest {
  goal: string
}

/**
 * API 响应体
 */
export interface JourneyAnalysisResponse {
  journey: {
    id: string
    goal: string
    aiAnalysis: string | null
    pathData: JourneyPathData
    createdAt: string
  }
}
