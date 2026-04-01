/**
 * inferLinks.ts
 * 基于人物属性自动推断联系人之间的连接强度
 *
 * 权重设计原则（AI 视角）：
 *  1. 角色互补性 — 某些角色天然协同（传送门×灯塔、智囊×大金主…）
 *  2. 标签重叠度 — 共同行业/技能标签越多，关系越近
 *  3. 能量衰减   — 低能量联系人的边强度整体下调
 *  4. 温度加成   — 热/温联系人的边略微加权
 */

import { RelationRole } from '@/types'

export interface ContactForLink {
  id: string
  relationRole: string
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

// ─── 角色互补矩阵 ─────────────────────────────────────────────────────────────
// 设计原则：
//  GATEWAY 是「桥接者」，与所有人都有一定连接
//  BIG_INVESTOR 是目标节点，与 GATEWAY/ADVISOR 关系最密
//  LIGHTHOUSE 是远端大佬，通过 GATEWAY 触达
//  COMRADE 是协作者，与 ADVISOR/THERMOMETER 紧密
//  THERMOMETER 是社交润滑剂，与所有人都有弱连接
//  ADVISOR 是智囊，与 BIG_INVESTOR/LIGHTHOUSE 强连接

const ROLE_COMPLEMENT: Partial<Record<RelationRole, Partial<Record<RelationRole, number>>>> = {
  GATEWAY: {
    BIG_INVESTOR: 0.85,
    LIGHTHOUSE:   0.80,
    ADVISOR:      0.70,
    COMRADE:      0.60,
    THERMOMETER:  0.55,
    GATEWAY:      0.50,
  },
  BIG_INVESTOR: {
    GATEWAY:      0.85,
    ADVISOR:      0.75,
    LIGHTHOUSE:   0.65,
    THERMOMETER:  0.45,
    COMRADE:      0.40,
    BIG_INVESTOR: 0.35,
  },
  ADVISOR: {
    BIG_INVESTOR: 0.75,
    GATEWAY:      0.70,
    LIGHTHOUSE:   0.65,
    COMRADE:      0.55,
    THERMOMETER:  0.50,
    ADVISOR:      0.40,
  },
  LIGHTHOUSE: {
    GATEWAY:      0.80,
    ADVISOR:      0.65,
    BIG_INVESTOR: 0.65,
    THERMOMETER:  0.40,
    COMRADE:      0.35,
    LIGHTHOUSE:   0.30,
  },
  COMRADE: {
    COMRADE:      0.70,
    ADVISOR:      0.55,
    THERMOMETER:  0.55,
    GATEWAY:      0.60,
    BIG_INVESTOR: 0.40,
    LIGHTHOUSE:   0.35,
  },
  THERMOMETER: {
    COMRADE:      0.55,
    ADVISOR:      0.50,
    GATEWAY:      0.55,
    BIG_INVESTOR: 0.45,
    LIGHTHOUSE:   0.40,
    THERMOMETER:  0.60,
  },
}

function getRoleComplement(roleA: string, roleB: string): number {
  const matrix = ROLE_COMPLEMENT[roleA as RelationRole]
  return matrix?.[roleB as RelationRole] ?? 0.3
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

      const roleSim = getRoleComplement(a.relationRole, b.relationRole)
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
