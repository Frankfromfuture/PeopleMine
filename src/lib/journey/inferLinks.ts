/**
 * inferLinks.ts
 * 基于人物属性自动推断联系人之间的连接强度
 *
 * 权重设计原则（AI 视角）：
 *  1. 角色互补性 — 某些角色原型天然协同（布道者×破局者、分析师×破局者…）
 *  2. 标签重叠度 — 共同行业/技能标签越多，关系越近
 *  3. 能量衰减   — 低能量联系人的边强度整体下调
 *  4. 温度加成   — 热/温联系人的边略微加权
 */

import { RoleArchetype } from '@/types'

export interface ContactForLink {
  id: string
  roleArchetype: string
  tags: string[]           // 已解析好的数组
  energyScore: number
  temperature: string | null
  trustLevel: number | null
}

export interface InferredLink {
  sourceId: string
  targetId: string
  strength: number         // 0 ~ 1
  reason: 'role_complement' | 'tag_overlap' | 'known'
  strong: boolean          // strength >= 0.5
}

// ─── 角色原型互补矩阵 ─────────────────────────────────────────────────────────
// 设计原则：
//  EVANGELIST 是「桥接者」，与所有人都有一定连接
//  BREAKER 是目标节点，与 EVANGELIST/ANALYST 关系最密
//  BINDER 是协作/维护者，与 ANALYST/EVANGELIST 紧密
//  ANALYST 是智囊，与 BREAKER/EVANGELIST 强连接

const ARCHETYPE_COMPLEMENT: Record<RoleArchetype, Record<RoleArchetype, number>> = {
  EVANGELIST: {
    BREAKER:    0.85,
    ANALYST:    0.70,
    BINDER:     0.58,
    EVANGELIST: 0.50,
  },
  BREAKER: {
    EVANGELIST: 0.85,
    ANALYST:    0.75,
    BINDER:     0.42,
    BREAKER:    0.33,
  },
  ANALYST: {
    BREAKER:    0.75,
    EVANGELIST: 0.70,
    BINDER:     0.53,
    ANALYST:    0.40,
  },
  BINDER: {
    BINDER:     0.63,
    EVANGELIST: 0.58,
    ANALYST:    0.53,
    BREAKER:    0.42,
  },
}

function getArchetypeComplement(roleA: string, roleB: string): number {
  const matrix = ARCHETYPE_COMPLEMENT[roleA as RoleArchetype]
  return matrix?.[roleB as RoleArchetype] ?? 0.3
}

// ─── 标签重叠度 ───────────────────────────────────────────────────────────────

function tagOverlapScore(tagsA: string[], tagsB: string[]): number {
  if (tagsA.length === 0 || tagsB.length === 0) return 0
  const setA = new Set(tagsA.map((t) => t.toLowerCase()))
  const setB = new Set(tagsB.map((t) => t.toLowerCase()))
  const intersection = [...setA].filter((t) => setB.has(t)).length
  const union = new Set([...setA, ...setB]).size
  return intersection / union  // Jaccard 相似度
}

// ─── 能量 & 温度调节 ──────────────────────────────────────────────────────────

function energyFactor(scoreA: number, scoreB: number): number {
  const avg = (scoreA + scoreB) / 200  // 0~1
  return 0.6 + avg * 0.4               // 范围 0.6~1.0，低能量削弱但不截断
}

function temperatureBonus(tempA: string | null, tempB: string | null): number {
  const hot = (t: string | null) => t === 'HOT' ? 0.08 : t === 'WARM' ? 0.04 : 0
  return hot(tempA) + hot(tempB)
}

// ─── 主函数 ──────────────────────────────────────────────────────────────────

/**
 * 从联系人列表推断所有边，只保留 strength >= 0.25 的连接
 * 限制每个节点最多 5 条边（取最强的），避免画布太乱
 */
export function inferAllLinks(contacts: ContactForLink[]): InferredLink[] {
  const links: InferredLink[] = []
  const degreeCount: Record<string, number> = {}
  const MAX_DEGREE = 5

  // 先计算全部候选边
  const candidates: InferredLink[] = []
  for (let i = 0; i < contacts.length; i++) {
    for (let j = i + 1; j < contacts.length; j++) {
      const a = contacts[i]
      const b = contacts[j]

      const roleSim = getArchetypeComplement(a.roleArchetype, b.roleArchetype)
      const tagSim  = tagOverlapScore(a.tags, b.tags)
      const eF      = energyFactor(a.energyScore, b.energyScore)
      const tB      = temperatureBonus(a.temperature, b.temperature)

      // 综合权重：角色互补（60%）+ 标签重叠（30%）+ 温度加成（10%）
      const raw = roleSim * 0.6 + tagSim * 0.3 + tB
      const strength = Math.min(1, raw * eF)

      if (strength >= 0.25) {
        candidates.push({
          sourceId: a.id,
          targetId: b.id,
          strength,
          reason: tagSim > roleSim * 0.3 ? 'tag_overlap' : 'role_complement',
          strong: strength >= 0.5,
        })
      }
    }
  }

  // 按强度降序排列
  candidates.sort((a, b) => b.strength - a.strength)

  // 每个节点限制最大度数，避免核心节点连线爆炸
  for (const link of candidates) {
    const da = degreeCount[link.sourceId] || 0
    const db = degreeCount[link.targetId] || 0
    if (da >= MAX_DEGREE || db >= MAX_DEGREE) continue
    links.push(link)
    degreeCount[link.sourceId] = da + 1
    degreeCount[link.targetId] = db + 1
  }

  return links
}
