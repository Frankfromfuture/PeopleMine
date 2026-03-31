import { ScoredContact, CandidatePath } from './types'
import { ContactRelation } from '@prisma/client'
import { RelationRole } from '@/types'

/**
 * 构建邻接表用于图遍历
 */
function buildAdjacencyMap(
  relations: ContactRelation[],
): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>()

  for (const rel of relations) {
    if (!adj.has(rel.contactIdA)) adj.set(rel.contactIdA, new Set())
    if (!adj.has(rel.contactIdB)) adj.set(rel.contactIdB, new Set())
    adj.get(rel.contactIdA)!.add(rel.contactIdB)
    adj.get(rel.contactIdB)!.add(rel.contactIdA)
  }

  return adj
}


/**
 * 获取联系人的关系角色
 */
function getContactRole(
  scoredContacts: Map<string, ScoredContact>,
  contactId: string,
): string {
  return scoredContacts.get(contactId)?.relationRole || 'UNKNOWN'
}

/**
 * 路径评分函数 - 综合评估路径的质量
 */
function scorePathRoute(
  path: string[],
  scoredContacts: Map<string, ScoredContact>,
): number {
  // 基础：节点分数的平均值
  const baseScore = path.reduce((sum, id) => {
    return sum + (scoredContacts.get(id)?.journeyScore ?? 0)
  }, 0) / Math.max(1, path.length)

  // 跳数衰减：2 跳时衰减至 75%
  const hopDecay = path.length === 1 ? 1.0 : 0.75

  // 角色序列奖励：检测「暖身→引荐→目标」的最优序列
  const roleSequence = path.map((id) => getContactRole(scoredContacts, id))
  const optimalSequence = ['THERMOMETER', 'GATEWAY', 'BIG_INVESTOR']
  let sequenceBonus = 0

  // 检查是否匹配或包含最优序列的子序列
  for (let i = 0; i <= roleSequence.length - optimalSequence.length; i++) {
    let matchCount = 0
    for (let j = 0; j < optimalSequence.length; j++) {
      if (roleSequence[i + j] === optimalSequence[j]) {
        matchCount++
      }
    }
    if (matchCount === optimalSequence.length) {
      sequenceBonus = 0.1
      break
    }
  }

  return baseScore * hopDecay + sequenceBonus
}

/**
 * 主函数：生成候选路径
 * 返回多条路径（按分数排序）
 */
export function buildCandidatePaths(
  scoredContacts: ScoredContact[],
  relations: ContactRelation[],
): CandidatePath[] {
  const contactMap = new Map(scoredContacts.map((c) => [c.id, c]))
  const adj = buildAdjacencyMap(relations)
  const paths: CandidatePath[] = []

  // 1 跳路径：用户 → 每个联系人
  for (const contact of scoredContacts) {
    const roleSequence = [contact.relationRole]
    paths.push({
      path: [contact.id],
      score: scorePathRoute([contact.id], contactMap),
      roleSequence,
    })
  }

  // 2 跳路径：用户 → A → B
  for (const contactA of scoredContacts) {
    const neighbors = adj.get(contactA.id) || new Set()
    for (const contactBId of neighbors) {
      // 只选择评分在中等以上的目标节点
      const contactB = contactMap.get(contactBId)
      if (contactB && contactB.journeyScore >= 0.3) {
        const roleSequence = [contactA.relationRole, contactB.relationRole]
        paths.push({
          path: [contactA.id, contactBId],
          score: scorePathRoute([contactA.id, contactBId], contactMap),
          roleSequence,
        })
      }
    }
  }

  // 按分数降序排序
  paths.sort((a, b) => b.score - a.score)

  return paths
}

/**
 * 从候选路径中选出主路径和备选路径
 */
export function selectPaths(
  candidatePaths: CandidatePath[],
  numAlternatives: number = 2,
): {
  primaryPath: string[]
  alternativePaths: { path: string[]; score: number }[]
} {
  if (candidatePaths.length === 0) {
    return { primaryPath: [], alternativePaths: [] }
  }

  const primaryPath = candidatePaths[0].path
  const alternativePaths = candidatePaths
    .slice(1, numAlternatives + 1)
    .map((p) => ({ path: p.path, score: p.score }))

  return { primaryPath, alternativePaths }
}

/**
 * 检测缺失的关键角色
 * 如果某个角色对目标很重要（亲和度 > 0.7）但网络中无此角色或评分很低，则标记为缺失
 */
export function detectMissingRoles(
  _goal: string,
  scoredContacts: ScoredContact[],
): { role: RelationRole; roleName: string; importance: number }[] {
  // 从 types/index.ts 导入的角色标签（这里简化处理）
  const RELATION_ROLES: RelationRole[] = [
    'BIG_INVESTOR',
    'GATEWAY',
    'ADVISOR',
    'THERMOMETER',
    'LIGHTHOUSE',
    'COMRADE',
  ]

  const ROLE_NAMES: Record<RelationRole, string> = {
    BIG_INVESTOR: '大金主',
    GATEWAY: '传送门',
    ADVISOR: '智囊',
    THERMOMETER: '温度计',
    LIGHTHOUSE: '灯塔',
    COMRADE: '战友',
  }

  // 简单的亲和度查询（应与 scoring.ts 的矩阵一致）
  const roleAffinityMap: Record<RelationRole, number> = {
    BIG_INVESTOR: 0.5,
    GATEWAY: 0.5,
    ADVISOR: 0.5,
    THERMOMETER: 0.5,
    LIGHTHOUSE: 0.5,
    COMRADE: 0.5,
  }

  // 这里应该根据 goalCategory 查询真实亲和度
  // 为简化，直接返回空列表或基于分数查询
  const missingRoles: {
    role: RelationRole
    roleName: string
    importance: number
  }[] = []

  for (const role of RELATION_ROLES) {
    const maxScoreForRole = scoredContacts
      .filter((c) => c.relationRole === role)
      .reduce((max, c) => Math.max(max, c.journeyScore), 0)

    // 如果此角色在网络中评分过低，标记为缺失
    if (maxScoreForRole < 0.4) {
      missingRoles.push({
        role,
        roleName: ROLE_NAMES[role],
        importance: roleAffinityMap[role],
      })
    }
  }

  return missingRoles.sort((a, b) => b.importance - a.importance).slice(0, 3)
}
