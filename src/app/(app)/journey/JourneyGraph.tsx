'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { JourneyPathData } from '@/lib/journey/types'
import { inferAllLinks } from '@/lib/journey/inferLinks'
import {
  DEFAULT_RELATION_STRENGTH_CONFIG,
  computePairStrength,
  type RelationStrengthConfig,
  type ContactForStrength,
} from '@/lib/dev/relation-strength-store'

// ─── 导出类型 ──────────────────────────────────────────────────────────────────

export interface NetworkContact {
  id: string
  name: string
  company: string | null
  title: string | null
  jobPosition: string | null
  jobFunction?: string | null
  roleArchetype: string
  spiritAnimal: string | null
  industryL1?: string | null
  industryL2?: string | null
  tags: string | null
  energyScore: number
  trustLevel: number | null
  chemistryScore?: number | null
  temperature: string | null
  lastContactedAt?: string | Date | null
  notes: string | null
  archetype: string | null
  quickContext: {
    scene: string
    frequency: string
    temperature: string
  } | null
  relationVector: {
    trust: number
    powerDelta: number
    goalAlignment: number
    emotionalVolatility: number
    reciprocity: number
    boundaryStability: number
    confidence: number
    updatedAt: string
  } | null
}

export interface NetworkRelation {
  contactIdA: string
  contactIdB: string
  relationDesc: string | null
  strength?: 'STRONG' | 'MEDIUM' | 'WEAK'
}

interface JourneyGraphProps {
  contacts: NetworkContact[]
  relations: NetworkRelation[]
  pathData?: JourneyPathData | null
  activeRouteIndex?: number
  onNodeClick?: (nodeId: string) => void
  selectedNodeId?: string | null
}

// ─── 常量 ──────────────────────────────────────────────────────────────────────

export const ROLE_LABEL: Record<string, string> = {
  BREAKER: '破局者', EVANGELIST: '布道者', ANALYST: '分析师', BINDER: '粘合剂',
}

export const ROLE_COLOR: Record<string, {
  bg: string; border: string; text: string; hex: string; glow: string
}> = {
  BREAKER:    { bg: '#f5f5f5', border: '#6b7280', text: '#1f2937', hex: '#6b7280', glow: 'rgba(107,114,128,0.3)' },
  EVANGELIST: { bg: '#f3f4f6', border: '#4b5563', text: '#111827', hex: '#4b5563', glow: 'rgba(75,85,99,0.3)'   },
  ANALYST:    { bg: '#f9fafb', border: '#374151', text: '#111827', hex: '#374151', glow: 'rgba(55,65,81,0.3)'   },
  BINDER:     { bg: '#f0f0f0', border: '#9ca3af', text: '#374151', hex: '#9ca3af', glow: 'rgba(156,163,175,0.3)'},
}

export const CHANNEL_ICON: Record<string, string> = {
  wechat: '💬', call: '📞', meeting: '🤝', email: '📧', event: '🎪',
}

const ANIMAL_LABEL: Record<string, string> = {
  TIGER: '🐯 老虎', PEACOCK: '🦚 孔雀', OWL: '🦉 猫头鹰', KOALA: '🐨 考拉',
}

// 轨道：1/20 of original speeds
const RINGS = [
  { r: 110, spd: 0.0000110, max: 3 },
  { r: 205, spd: 0.0000078, max: 5 },
  { r: 310, spd: 0.0000053, max: 8 },
  { r: 430, spd: 0.0000033, max: Infinity },
]

// ─── 布局模式 ──────────────────────────────────────────────────────────────────

type LayoutMode = 'orbit' | 'role' | 'animal' | 'industry' | 'job'

const LAYOUT_OPTIONS: Array<{
  id: LayoutMode
  icon: string
  label: string
  grouper?: (c: NetworkContact) => string
}> = [
  { id: 'orbit',    icon: '🌌', label: '星系轨道' },
  { id: 'role',     icon: '🏷️', label: '按角色',   grouper: c => ROLE_LABEL[c.roleArchetype] || c.roleArchetype },
  { id: 'animal',   icon: '🦁', label: '按气场动物', grouper: c => ANIMAL_LABEL[c.spiritAnimal || ''] || '未设置' },
  { id: 'industry', icon: '🏭', label: '按行业标签', grouper: c => parseTags(c.tags)[0] || '未标注' },
  { id: 'job',      icon: '💼', label: '按岗位',    grouper: c => c.jobPosition || '未设置' },
]

// ─── 辅助函数 ──────────────────────────────────────────────────────────────────

function parseTags(raw: string | null): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

interface OrbitParam { r: number; spd: number; initAngle: number; size: number }

function buildOrbits(contacts: NetworkContact[]): Record<string, OrbitParam> {
  const sorted = [...contacts].sort((a, b) => b.energyScore - a.energyScore)
  const groups: NetworkContact[][] = RINGS.map(() => [])
  const cnts = RINGS.map(() => 0)
  for (const c of sorted) {
    let i = 0
    while (i < RINGS.length - 1 && cnts[i] >= RINGS[i].max) i++
    groups[i].push(c); cnts[i]++
  }
  const out: Record<string, OrbitParam> = {}
  groups.forEach((grp, ri) => {
    grp.forEach((c, j) => {
      out[c.id] = {
        r: RINGS[ri].r, spd: RINGS[ri].spd,
        initAngle: (2 * Math.PI * j) / Math.max(1, grp.length) + ri * 0.9,
        size: Math.min(58, Math.max(36, 36 + (c.energyScore / 100) * 22)),
      }
    })
  })
  return out
}

function computeGroupLayout(
  contacts: NetworkContact[],
  grouper: (c: NetworkContact) => string,
  cx: number, cy: number,
): { positions: Record<string, { x: number; y: number }>; groupCenters: Array<{ label: string; x: number; y: number }> } {
  const groups = new Map<string, NetworkContact[]>()
  contacts.forEach(c => {
    const g = grouper(c)
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g)!.push(c)
  })
  const list = [...groups.entries()]
  const n = list.length
  const groupR = Math.max(150, n * 50)
  const positions: Record<string, { x: number; y: number }> = {}
  const groupCenters: Array<{ label: string; x: number; y: number }> = []

  list.forEach(([label, members], gi) => {
    const ga = (2 * Math.PI * gi / n) - Math.PI / 2
    const gcx = cx + groupR * Math.cos(ga)
    const gcy = cy + groupR * Math.sin(ga)
    groupCenters.push({ label, x: gcx, y: gcy })
    const nr = members.length <= 1 ? 0 : Math.min(75, 22 + members.length * 9)
    members.forEach((c, mi) => {
      const na = (2 * Math.PI * mi) / Math.max(1, members.length)
      positions[c.id] = { x: gcx + nr * Math.cos(na), y: gcy + nr * Math.sin(na) }
    })
  })
  return { positions, groupCenters }
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

// float seed from id hash
function floatSeed(id: string, salt: number): number {
  let h = 0x811c9dc5
  for (let i = 0; i < id.length; i++) { h = (h ^ id.charCodeAt(i)) * 0x01000193 }
  return ((h >>> 0) * 1.6180339887 + salt) % (Math.PI * 2)
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function getTrustScore(c: NetworkContact): number {
  if (c.relationVector?.trust != null) return clamp01(c.relationVector.trust / 100)
  if (c.trustLevel != null) return clamp01(c.trustLevel / 5)
  return 0.45
}

function getAlignScore(c: NetworkContact): number {
  if (c.relationVector?.goalAlignment != null) return clamp01(c.relationVector.goalAlignment / 100)
  return 0.5
}

function getTrustBorderStyle(c: NetworkContact): { width: number; color: string } {
  const trust = getTrustScore(c)
  const width = 1 + trust * 2.4
  const color = `rgba(79, 70, 229, ${0.22 + trust * 0.6})`
  return { width, color }
}

function getAlignmentGlow(c: NetworkContact): string {
  const align = getAlignScore(c)
  return `rgba(16, 185, 129, ${0.12 + align * 0.45})`
}

// ─── Tooltip ───────────────────────────────────────────────────────────────────

function Tooltip({ c, x, y }: { c: NetworkContact; x: number; y: number }) {
  const col = ROLE_COLOR[c.roleArchetype] ?? ROLE_COLOR.BINDER
  const tags = parseTags(c.tags)
  const isAutoGenerated = c.notes?.includes('自动生成的测试数据') ?? false

  return (
    <div className="fixed z-50 w-56 rounded-xl shadow-xl pointer-events-none"
      style={{
        left: Math.min(x + 14, window.innerWidth - 240),
        top: Math.max(y - 8, 8),
        background: 'white',
        border: `1.5px solid ${col.border}`,
        boxShadow: `0 4px 20px ${col.glow}, 0 1px 4px rgba(0,0,0,0.08)`,
      }}>
      <div className="p-3 space-y-1.5">
        <div className="font-bold text-sm text-text-primary">
          {c.name}
          {isAutoGenerated && <span className="text-gray-500 ml-1">*</span>}
        </div>
        <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium border"
          style={{ background: col.bg, color: col.hex, borderColor: col.border }}>
          {ROLE_LABEL[c.roleArchetype] ?? c.roleArchetype}
        </span>
        {c.spiritAnimal && (
          <div className="text-xs text-text-subtle">{ANIMAL_LABEL[c.spiritAnimal] ?? c.spiritAnimal}</div>
        )}
        {c.relationVector && (
          <div className="text-[11px] text-text-subtle">
            ARC T{c.relationVector.trust} · A{c.relationVector.goalAlignment} · R{c.relationVector.reciprocity}
          </div>
        )}
        {(c.title || c.company || c.jobPosition) && (
          <div className="text-xs text-text-secondary">
            {[c.jobPosition, c.title, c.company].filter(Boolean).join(' · ')}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>⚡ {c.energyScore}</span>
          {c.trustLevel ? <span>{'⭐'.repeat(c.trustLevel)}</span> : null}
          {c.temperature === 'HOT' ? <span>🔥热</span>
            : c.temperature === 'WARM' ? <span>☀️温</span>
            : c.temperature === 'COLD' ? <span>❄️冷</span> : null}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map(t => (
              <span key={t} className="px-1.5 py-0.5 rounded bg-gray-100 text-text-subtle text-xs">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 主组件 ────────────────────────────────────────────────────────────────────

export default function JourneyGraph({
  contacts, relations, pathData, activeRouteIndex = 0, onNodeClick, selectedNodeId,
}: JourneyGraphProps) {
  const wrapRef   = useRef<HTMLDivElement>(null)
  const rafRef    = useRef(0)
  const hovIdRef  = useRef<string | null>(null)   // 当前悬停节点（per-node pause）
  const layoutRef = useRef<LayoutMode>('orbit')
  const anglesRef = useRef<Record<string, number>>({})
  const orbitRef  = useRef<Record<string, OrbitParam>>({})
  const curPosRef = useRef<Record<string, { x: number; y: number }>>({})
  const tgtPosRef = useRef<Record<string, { x: number; y: number }>>({})
  const sizeRef   = useRef({ w: 900, h: 600 })
  const nodeElRef = useRef<Record<string, HTMLDivElement | null>>({})
  const lineElRef = useRef<Map<string, SVGLineElement>>(new Map())
  const allEdgesRef = useRef<Array<{ id: string; srcId: string; tgtId: string }>>([])

  const [layoutMode, setLayoutModeState] = useState<LayoutMode>('orbit')
  const [userScale, setUserScale] = useState(1)
  const [fitScale, setFitScale] = useState(1)
  const scale = Math.min(userScale, fitScale)
  const [hovered, setHovered] = useState<NetworkContact | null>(null)
  const [tipPos, setTipPos]   = useState({ x: 0, y: 0 })
  const [groupLabels, setGroupLabels] = useState<Array<{ label: string; x: number; y: number }>>([])
  const [containerSize, setContainerSize] = useState({ w: 900, h: 600 })
  const [rsConfig, setRsConfig] = useState<RelationStrengthConfig>(DEFAULT_RELATION_STRENGTH_CONFIG)

  // 加载关系强度配置
  useEffect(() => {
    fetch('/api/dev/relation-strength')
      .then(r => r.json())
      .then(d => { if (d.config) setRsConfig(d.config) })
      .catch(() => {})
  }, [])

  // 预计算所有联系人两两之间的关系强度分
  const pairStrengthMap = useMemo<Record<string, number>>(() => {
    if (contacts.length < 2) return {}
    const map: Record<string, number> = {}
    const boost = rsConfig.universeConfig.intraCompanyBoost
    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        const a = contacts[i] as unknown as ContactForStrength
        const b = contacts[j] as unknown as ContactForStrength
        const { score } = computePairStrength(a, b, rsConfig)
        // 同公司额外加成
        const compA = (a.companyName ?? a.company ?? '').trim()
        const compB = (b.companyName ?? b.company ?? '').trim()
        const sameCompany = compA && compB && compA === compB
        const finalScore = Math.min(1, score + (sameCompany ? boost : 0))
        const key = `${a.id}|${b.id}`, keyR = `${b.id}|${a.id}`
        map[key] = finalScore
        map[keyR] = finalScore
      }
    }
    return map
  }, [contacts, rsConfig])

  const setLayoutMode = useCallback((m: LayoutMode) => {
    layoutRef.current = m
    setLayoutModeState(m)
  }, [])

  // ── 容器尺寸 ──
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => {
      const w = e.contentRect.width, h = e.contentRect.height
      sizeRef.current = { w, h }
      setContainerSize({ w, h })
    })
    if (wrapRef.current) {
      const { width: w, height: h } = wrapRef.current.getBoundingClientRect()
      sizeRef.current = { w, h }
      setContainerSize({ w, h })
      ro.observe(wrapRef.current)
    }
    return () => ro.disconnect()
  }, [])

  // ── 初始化轨道 ──
  useEffect(() => {
    const params = buildOrbits(contacts)
    const angles: Record<string, number> = {}
    Object.entries(params).forEach(([id, p]) => { angles[id] = p.initAngle })
    anglesRef.current = angles
    orbitRef.current = params
  }, [contacts])

  // ── 布局目标位置 ──
  useEffect(() => {
    const { w, h } = sizeRef.current
    const cx = w / 2, cy = h / 2
    if (layoutMode === 'orbit') { setGroupLabels([]); return }
    const opt = LAYOUT_OPTIONS.find(o => o.id === layoutMode)
    if (!opt?.grouper) return
    const { positions, groupCenters } = computeGroupLayout(contacts, opt.grouper, cx, cy)
    tgtPosRef.current = positions
    setGroupLabels(groupCenters)
  }, [layoutMode, contacts, containerSize])

  // ── 自动缩放：确保星球尽量在可视范围内 ──
  useEffect(() => {
    const { w, h } = sizeRef.current
    if (!w || !h || contacts.length === 0) {
      setFitScale(1)
      return
    }

    const padding = 56
    let requiredHalfW = 120
    let requiredHalfH = 120

    if (layoutMode === 'orbit') {
      contacts.forEach((c) => {
        const p = orbitRef.current[c.id]
        if (!p) return
        const half = p.size / 2
        requiredHalfW = Math.max(requiredHalfW, p.r + half + padding)
        requiredHalfH = Math.max(requiredHalfH, p.r + half + padding)
      })
      requiredHalfW = Math.max(requiredHalfW, 26 + padding)
      requiredHalfH = Math.max(requiredHalfH, 26 + padding)
    } else {
      contacts.forEach((c) => {
        const p = orbitRef.current[c.id]
        const t = tgtPosRef.current[c.id]
        if (!p || !t) return
        const half = p.size / 2
        const dx = Math.abs(t.x - w / 2) + half + 6 + padding
        const dy = Math.abs(t.y - h / 2) + half + 6 + padding
        requiredHalfW = Math.max(requiredHalfW, dx)
        requiredHalfH = Math.max(requiredHalfH, dy)
      })
      requiredHalfW = Math.max(requiredHalfW, 26 + padding)
      requiredHalfH = Math.max(requiredHalfH, 26 + padding)
    }

    const nextFit = Math.min(1, w / (requiredHalfW * 2), h / (requiredHalfH * 2))
    setFitScale(Math.max(0.3, nextFit))
  }, [contacts, layoutMode, containerSize])

  const inferredLinks = useMemo(() =>
    inferAllLinks(contacts.map(c => ({
      id: c.id, roleArchetype: c.roleArchetype, tags: parseTags(c.tags),
      energyScore: c.energyScore, temperature: c.temperature, trustLevel: c.trustLevel,
    }))),
  [contacts])

  const bgEdges = useMemo(() => {
    const threshold = rsConfig.universeConfig.edgeThreshold
    const enabled   = rsConfig.universeConfig.enableDynamicEdges
    const known = new Set<string>()
    const edges: Array<{ id: string; srcId: string; tgtId: string; strong: boolean; isKnown: boolean }> = []
    relations.forEach(r => {
      edges.push({ id: `k-${r.contactIdA}-${r.contactIdB}`, srcId: r.contactIdA, tgtId: r.contactIdB, strong: true, isKnown: true })
      known.add(`${r.contactIdA}|${r.contactIdB}`); known.add(`${r.contactIdB}|${r.contactIdA}`)
    })
    inferredLinks.forEach(l => {
      if (known.has(`${l.sourceId}|${l.targetId}`)) return
      // 如果启用强度过滤，推断边低于阈值则隐藏
      if (enabled) {
        const s = pairStrengthMap[`${l.sourceId}|${l.targetId}`] ?? 0
        if (s < threshold) return
      }
      edges.push({ id: `i-${l.sourceId}-${l.targetId}`, srcId: l.sourceId, tgtId: l.targetId, strong: l.strong, isKnown: false })
    })
    return edges
  }, [relations, inferredLinks, pairStrengthMap, rsConfig.universeConfig])

  const activePath = useMemo(() => {
    if (!pathData) return null
    if (activeRouteIndex === 0) return pathData.primaryPath
    return pathData.alternativePaths[activeRouteIndex - 1]?.steps ?? pathData.primaryPath
  }, [pathData, activeRouteIndex])

  const activeIds = useMemo(() => new Set(activePath?.map(s => s.contactId) ?? []), [activePath])

  const pathEdges = useMemo(() => {
    if (!activePath || activePath.length === 0) return []
    const e: Array<{ id: string; srcId: string; tgtId: string }> = [
      { id: 'p-user-0', srcId: 'user', tgtId: activePath[0].contactId }
    ]
    for (let i = 0; i < activePath.length - 1; i++) {
      e.push({ id: `p-${i}-${i + 1}`, srcId: activePath[i].contactId, tgtId: activePath[i + 1].contactId })
    }
    return e
  }, [activePath])

  // 同步 allEdgesRef
  useEffect(() => {
    allEdgesRef.current = [
      ...bgEdges.map(e => ({ id: e.id, srcId: e.srcId, tgtId: e.tgtId })),
      ...pathEdges.map(e => ({ id: e.id, srcId: e.srcId, tgtId: e.tgtId })),
    ]
  }, [bgEdges, pathEdges])

  // ── 动画循环 ──
  useEffect(() => {
    let last: number | null = null

    const getPos = (id: string) => {
      if (id === 'user') return { x: sizeRef.current.w / 2, y: sizeRef.current.h / 2 }
      return curPosRef.current[id] ?? { x: sizeRef.current.w / 2, y: sizeRef.current.h / 2 }
    }

    const tick = (ts: number) => {
      if (last !== null) {
        const dt = Math.min(ts - last, 50)
        const { w, h } = sizeRef.current
        const cx = w / 2, cy = h / 2
        const mode = layoutRef.current

        Object.keys(anglesRef.current).forEach(id => {
          const p = orbitRef.current[id]
          if (!p) return

          const isHov = hovIdRef.current === id

          if (mode === 'orbit') {
            // 悬停节点：暂停旋转
            if (!isHov) anglesRef.current[id] += p.spd * dt
            const a = anglesRef.current[id]
            curPosRef.current[id] = { x: cx + p.r * Math.cos(a), y: cy + p.r * Math.sin(a) }
          } else {
            // 持续更新角度（切回轨道时平滑）
            anglesRef.current[id] += p.spd * dt
            const tgt = tgtPosRef.current[id] ?? { x: cx, y: cy }
            // 悬停节点：浮动停止
            const fx = isHov ? 0 : Math.sin(ts * 0.0008 + floatSeed(id, 0)) * 5
            const fy = isHov ? 0 : Math.cos(ts * 0.0008 + floatSeed(id, 1)) * 5
            const cur = curPosRef.current[id] ?? tgt
            curPosRef.current[id] = {
              x: lerp(cur.x, tgt.x + fx, 0.04),
              y: lerp(cur.y, tgt.y + fy, 0.04),
            }
          }

          const { x, y } = curPosRef.current[id]
          const el = nodeElRef.current[id]
          if (el) { el.style.left = `${x - p.size / 2}px`; el.style.top = `${y - p.size / 2}px` }
        })

        // 更新连接线
        allEdgesRef.current.forEach(({ id, srcId, tgtId }) => {
          const el = lineElRef.current.get(id)
          if (!el) return
          const s = getPos(srcId), t = getPos(tgtId)
          el.setAttribute('x1', String(s.x)); el.setAttribute('y1', String(s.y))
          el.setAttribute('x2', String(t.x)); el.setAttribute('y2', String(t.y))
        })
      }
      last = ts
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, []) // 空依赖，纯 ref 操作

  // ── 事件 ──
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setUserScale(s => Math.min(2.5, Math.max(0.3, s - e.deltaY * 0.001)))
  }, [])

  const contactMap = useMemo(() => {
    const m: Record<string, NetworkContact> = {}
    contacts.forEach(c => { m[c.id] = c })
    return m
  }, [contacts])

  const { w, h } = containerSize
  const cx = w / 2, cy = h / 2

  return (
    <div ref={wrapRef} className="relative w-full h-full overflow-hidden bg-app-bg" onWheel={onWheel}>

      <style>{`
        @keyframes pmPlanetPulse {
          0%, 100% { transform: scale(0.96); opacity: 0.32; }
          50% { transform: scale(1.06); opacity: 0.55; }
        }
      `}</style>

      {/* 淡灰网点背景 */}
      <div className="absolute inset-0 pointer-events-none opacity-30" style={{
        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      {/* ── 可缩放内容 ── */}
      <div
        className="absolute inset-0"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: 'transform 200ms ease-out',
        }}
      >

        {/* SVG 连接线 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <filter id="pmTrailGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* 轨道圆（仅 orbit 模式） */}
          {layoutMode === 'orbit' && RINGS.map((ring, i) => (
            <circle key={i} cx="50%" cy="50%" r={ring.r}
              fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="1" strokeDasharray="4 10" />
          ))}
          {/* 背景边 — 颜色/粗细由关系强度驱动 */}
          {bgEdges.map(e => {
            const dimmed = !!activePath
            const strength = pairStrengthMap[`${e.srcId}|${e.tgtId}`] ?? 0
            const isStrong   = strength >= 0.65
            const isMedium   = strength >= 0.38 && strength < 0.65
            // 已知关系：强度驱动实线；推断关系：虚线+动效
            const strokeColor = e.isKnown
              ? isStrong  ? `rgba(31,41,55,${0.55 + strength * 0.25})`
              : isMedium  ? `rgba(71,85,105,${0.35 + strength * 0.25})`
              :              `rgba(100,116,139,${0.20 + strength * 0.20})`
              : isStrong  ? `rgba(79,70,229,${0.50 + strength * 0.25})`
              : isMedium  ? `rgba(124,58,237,${0.28 + strength * 0.20})`
              :              `rgba(167,139,250,${0.12 + strength * 0.15})`
            const strokeW = e.isKnown
              ? 0.8 + strength * 2.2
              : 0.6 + strength * 1.8
            const dashArr = e.isKnown
              ? undefined
              : isStrong ? '10 5' : isMedium ? '7 5' : '4 6'
            return (
              <line key={e.id}
                ref={el => { if (el) lineElRef.current.set(e.id, el) }}
                x1={cx} y1={cy} x2={cx} y2={cy}
                stroke={strokeColor}
                strokeWidth={strokeW}
                strokeDasharray={dashArr}
                opacity={dimmed ? 0.35 : 1}
              >
                {!e.isKnown && isStrong && (
                  <>
                    <animate attributeName="stroke-dashoffset" values="0;-28" dur="1.6s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" values="0.45;0.95;0.45" dur="1.8s" repeatCount="indefinite" />
                  </>
                )}
              </line>
            )
          })}
          {/* 路径高亮边 */}
          {pathEdges.map((e, idx) => (
            <g key={e.id}>
              <line
                id={e.id}
                ref={el => { if (el) lineElRef.current.set(e.id, el) }}
                x1={cx} y1={cy} x2={cx} y2={cy}
                stroke="#4b5563"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeDasharray="10 8"
                opacity="0.85"
              >
                <animate attributeName="stroke-dashoffset" values="0;-36" dur="1.05s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.55;1;0.55" dur="1.7s" repeatCount="indefinite" />
              </line>

              {/* 航路端点流光（微型光点拖尾） */}
              <circle r="2.4" fill="#9ca3af" opacity="0.95" filter="url(#pmTrailGlow)">
                <animateMotion dur="1.05s" repeatCount="indefinite" rotate="auto" begin={`${idx * 0.08}s`}>
                  <mpath href={`#${e.id}`} />
                </animateMotion>
                <animate attributeName="opacity" values="0.3;1;0.35" dur="1.05s" repeatCount="indefinite" />
              </circle>
              <circle r="4.8" fill="rgba(156,163,175,0.28)">
                <animateMotion dur="1.05s" repeatCount="indefinite" rotate="auto" begin={`${idx * 0.08}s`}>
                  <mpath href={`#${e.id}`} />
                </animateMotion>
              </circle>
            </g>
          ))}
        </svg>

        {/* 分组标签 */}
        {groupLabels.map(({ label, x, y }) => (
          <div key={label} className="absolute pointer-events-none"
            style={{ left: x, top: y - 52, transform: 'translateX(-50%)' }}>
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-text-subtle bg-app-bg/80 border border-gray-200 whitespace-nowrap shadow-sm">
              {label}
            </span>
          </div>
        ))}

        {/* 用户中心节点 */}
        <div className="absolute flex items-center justify-center rounded-full font-bold text-white z-10"
          style={{
            width: 52, height: 52, left: cx - 26, top: cy - 26,
            background: 'linear-gradient(135deg, #1f2937, #374151)',
            boxShadow: '0 0 0 3px rgba(55,65,81,0.2), 0 4px 16px rgba(31,41,55,0.4)',
            fontSize: 15,
          }}>你</div>

        {/* 联系人节点 */}
        {contacts.map(c => {
          const p = orbitRef.current[c.id]
          const a = anglesRef.current[c.id] ?? 0
          const size = p?.size ?? 44
          const initX = cx + (p?.r ?? 200) * Math.cos(a) - size / 2
          const initY = cy + (p?.r ?? 200) * Math.sin(a) - size / 2
          const col = ROLE_COLOR[c.roleArchetype] ?? ROLE_COLOR.BINDER
          const onPath = activeIds.has(c.id)
          const dimmed = !!activePath && !onPath
          const trustBorder = getTrustBorderStyle(c)
          const alignGlow = getAlignmentGlow(c)
          const isSel = selectedNodeId === c.id
          const isAutoGenerated = c.notes?.includes('自动生成的测试数据') ?? false
          const isHover = hovered?.id === c.id

          return (
            <div key={c.id}
              ref={el => { nodeElRef.current[c.id] = el }}
              className={`journey-node${isSel ? ' selected' : ''} absolute flex items-center justify-center rounded-full font-semibold cursor-pointer overflow-hidden`}
              style={{
                width: size, height: size, left: initX, top: initY,
                background: `radial-gradient(circle at 28% 26%, rgba(255,255,255,0.82), rgba(255,255,255,0.25) 36%, transparent 64%), linear-gradient(145deg, ${col.bg}, rgba(255,255,255,0.55))`,
                border: `${trustBorder.width}px solid ${trustBorder.color}`,
                color: col.hex,
                fontSize: size > 50 ? 12 : 10,
                opacity: dimmed ? 0.25 : 1,
                zIndex: onPath ? 5 : 2,
                transform: isHover ? 'scale(1.06)' : 'scale(1)',
                boxShadow: isSel
                  ? `0 0 0 1.5px rgba(255,255,255,0.9), 0 0 22px rgba(255,255,255,0.5), 0 4px 12px ${col.glow}, 0 0 22px ${alignGlow}`
                  : isHover
                  ? `0 0 0 1px rgba(255,255,255,0.85), 0 0 26px ${alignGlow}, 0 0 18px ${col.glow}, inset 0 1px 2px rgba(255,255,255,0.7)`
                  : `0 2px 8px ${col.glow}, 0 0 16px ${alignGlow}, inset 0 1px 1px rgba(255,255,255,0.6)`,
                transition: 'opacity 0.4s, box-shadow 0.2s, border-color 0.2s, transform 0.2s',
              }}
              onClick={() => onNodeClick?.(c.id)}
              onMouseEnter={e => {
                hovIdRef.current = c.id
                setHovered(contactMap[c.id])
                setTipPos({ x: e.clientX, y: e.clientY })
              }}
              onMouseLeave={() => {
                hovIdRef.current = null
                setHovered(null)
              }}
            >
              <span className="absolute inset-[8%] rounded-full pointer-events-none"
                style={{
                  border: `1px solid rgba(255,255,255,0.45)`,
                  opacity: 0.85,
                }}
              />
              {isHover && (
                <span
                  className="absolute -inset-2 rounded-full pointer-events-none"
                  style={{
                    border: `1px solid ${col.border}`,
                    boxShadow: `0 0 20px ${col.glow}, 0 0 26px ${alignGlow}`,
                    opacity: 0.45,
                    animation: 'pmPlanetPulse 1.6s ease-in-out infinite',
                  }}
                />
              )}
              <span className="truncate px-1 leading-tight text-center relative">
                {c.name.length > 3 ? c.name.slice(0, 3) : c.name}
                {isAutoGenerated && <span className="text-gray-500 text-xs absolute -top-2 -right-1">*</span>}
              </span>
            </div>
          )
        })}
      </div>

      {/* Tooltip（在缩放层外） */}
      {hovered && <Tooltip c={hovered} x={tipPos.x} y={tipPos.y} />}

      {/* ── 右侧布局面板 ── */}
      <div className="absolute right-3 top-3 z-20 flex flex-col gap-1">
        <div className="text-xs font-medium text-gray-400 px-1 mb-0.5">排列方式</div>
        {LAYOUT_OPTIONS.map(opt => (
          <button key={opt.id}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all whitespace-nowrap"
            style={{
              background: layoutMode === opt.id ? '#1f2937' : 'rgba(255,255,255,0.9)',
              color: layoutMode === opt.id ? '#ffffff' : '#64748b',
              border: layoutMode === opt.id ? '1px solid #374151' : '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
            onClick={() => setLayoutMode(opt.id)}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {/* ── 缩放按钮 ── */}
      <div className="absolute right-3 bottom-3 z-20 flex flex-col gap-1">
        {(['+', '−'] as const).map((s, i) => (
          <button key={s}
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-text-subtle transition hover:bg-gray-100"
            style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #e2e8f0', fontSize: 18 }}
            onClick={() => setUserScale(v => i === 0 ? Math.min(2.5, v + 0.15) : Math.max(0.3, v - 0.15))}
          >{s}</button>
        ))}
        <button
          className="px-2 py-1 rounded-lg text-[10px] font-medium text-text-subtle border border-gray-200 bg-app-bg/90 hover:bg-gray-50"
          onClick={() => setUserScale(1)}
        >
          适配全部
        </button>
        <div className="text-[10px] text-gray-400 text-center">缩放 {Math.round(scale * 100)}%</div>
      </div>

      {/* ── 图例 ── */}
      <div className="absolute bottom-3 left-3 rounded-xl p-2.5 z-20 bg-app-bg/90 border border-gray-200 shadow-sm text-xs">
        <div className="text-gray-400 font-medium mb-1.5">角色图例</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2">
          {Object.entries(ROLE_COLOR).map(([role, c]) => (
            <div key={role} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full border" style={{ background: c.bg, borderColor: c.border }} />
              <span className="text-text-subtle">{ROLE_LABEL[role]}</span>
            </div>
          ))}
        </div>
        <div className="pt-2 space-y-1 border-t border-gray-100">
          {[
            { color: 'rgba(100,116,139,0.6)',  dash: false, label: '已知关系' },
            { color: 'rgba(55,65,81,0.55)',    dash: false, label: 'AI推断强连接（流光）' },
            { color: 'rgba(55,65,81,0.2)',     dash: true,  label: 'AI推断弱连接' },
            { color: '#4b5563',                dash: false, label: '当前航路' },
          ].map(({ color, dash, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <svg width="20" height="8">
                <line x1="0" y1="4" x2="20" y2="4" stroke={color} strokeWidth="1.5"
                  strokeDasharray={dash ? '4 3' : undefined} />
              </svg>
              <span className="text-gray-400">{label}</span>
            </div>
          ))}
        </div>
        <div className="pt-2 mt-2 border-t border-gray-100 space-y-1 text-[11px] text-gray-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-gray-500/70 bg-transparent" />
            <span>描边粗细 = 信任强度（Trust）</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-gray-200/60" style={{ boxShadow: '0 0 10px rgba(16,185,129,0.5)' }} />
            <span>外圈光晕 = 目标一致（Alignment）</span>
          </div>
        </div>
      </div>
    </div>
  )
}
