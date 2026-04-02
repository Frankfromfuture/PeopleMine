'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { JourneyPathData } from '@/lib/journey/types'
import { inferAllLinks } from '@/lib/journey/inferLinks'

// ─── 导出类型 ──────────────────────────────────────────────────────────────────

export interface NetworkContact {
  id: string
  name: string
  company: string | null
  title: string | null
  jobPosition: string | null
  relationRole: string
  spiritAnimal: string | null
  tags: string | null
  energyScore: number
  trustLevel: number | null
  temperature: string | null
  notes: string | null
}

export interface NetworkRelation {
  contactIdA: string
  contactIdB: string
  relationDesc: string | null
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
  BIG_INVESTOR: '大金主', GATEWAY: '传送门', ADVISOR: '智囊',
  THERMOMETER: '温度计', LIGHTHOUSE: '灯塔', COMRADE: '战友',
}

export const ROLE_COLOR: Record<string, {
  bg: string; border: string; text: string; hex: string; glow: string
}> = {
  BIG_INVESTOR: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', hex: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
  GATEWAY:      { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', hex: '#3b82f6', glow: 'rgba(59,130,246,0.3)' },
  ADVISOR:      { bg: '#faf5ff', border: '#7c3aed', text: '#4c1d95', hex: '#7c3aed', glow: 'rgba(124,58,237,0.3)' },
  THERMOMETER:  { bg: '#fdf2f8', border: '#ec4899', text: '#831843', hex: '#ec4899', glow: 'rgba(236,72,153,0.3)' },
  LIGHTHOUSE:   { bg: '#fff7ed', border: '#f97316', text: '#7c2d12', hex: '#f97316', glow: 'rgba(249,115,22,0.3)' },
  COMRADE:      { bg: '#f0fdf4', border: '#22c55e', text: '#14532d', hex: '#22c55e', glow: 'rgba(34,197,94,0.3)' },
}

export const CHANNEL_ICON: Record<string, string> = {
  wechat: '💬', call: '📞', meeting: '🤝', email: '📧', event: '🎪',
}

const ANIMAL_LABEL: Record<string, string> = {
  LION: '🦁 狮子', FOX: '🦊 狐狸', BEAR: '🐻 熊', CHAMELEON: '🦎 变色龙',
  EAGLE: '🦅 鹰', DOLPHIN: '🐬 海豚', OWL: '🦉 猫头鹰', SKUNK: '🦨 臭鼬',
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
  { id: 'role',     icon: '🏷️', label: '按角色',   grouper: c => ROLE_LABEL[c.relationRole] || c.relationRole },
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

// ─── Tooltip ───────────────────────────────────────────────────────────────────

function Tooltip({ c, x, y }: { c: NetworkContact; x: number; y: number }) {
  const col = ROLE_COLOR[c.relationRole] ?? ROLE_COLOR.COMRADE
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
        <div className="font-bold text-sm text-gray-900">
          {c.name}
          {isAutoGenerated && <span className="text-red-500 ml-1">*</span>}
        </div>
        <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium border"
          style={{ background: col.bg, color: col.hex, borderColor: col.border }}>
          {ROLE_LABEL[c.relationRole] ?? c.relationRole}
        </span>
        {c.spiritAnimal && (
          <div className="text-xs text-gray-500">{ANIMAL_LABEL[c.spiritAnimal] ?? c.spiritAnimal}</div>
        )}
        {(c.title || c.company || c.jobPosition) && (
          <div className="text-xs text-gray-600">
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
              <span key={t} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-xs">{t}</span>
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
  const [scale, setScale]   = useState(0.88)
  const [hovered, setHovered] = useState<NetworkContact | null>(null)
  const [tipPos, setTipPos]   = useState({ x: 0, y: 0 })
  const [groupLabels, setGroupLabels] = useState<Array<{ label: string; x: number; y: number }>>([])
  const [containerSize, setContainerSize] = useState({ w: 900, h: 600 })

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

  // ── 推断边 ──
  const inferredLinks = useMemo(() =>
    inferAllLinks(contacts.map(c => ({
      id: c.id, relationRole: c.relationRole, tags: parseTags(c.tags),
      energyScore: c.energyScore, temperature: c.temperature, trustLevel: c.trustLevel,
    }))),
  [contacts])

  const bgEdges = useMemo(() => {
    const known = new Set<string>()
    const edges: Array<{ id: string; srcId: string; tgtId: string; strong: boolean; isKnown: boolean }> = []
    relations.forEach(r => {
      edges.push({ id: `k-${r.contactIdA}-${r.contactIdB}`, srcId: r.contactIdA, tgtId: r.contactIdB, strong: true, isKnown: true })
      known.add(`${r.contactIdA}|${r.contactIdB}`); known.add(`${r.contactIdB}|${r.contactIdA}`)
    })
    inferredLinks.forEach(l => {
      if (known.has(`${l.sourceId}|${l.targetId}`)) return
      edges.push({ id: `i-${l.sourceId}-${l.targetId}`, srcId: l.sourceId, tgtId: l.targetId, strong: l.strong, isKnown: false })
    })
    return edges
  }, [relations, inferredLinks])

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
    setScale(s => Math.min(2.5, Math.max(0.3, s - e.deltaY * 0.001)))
  }, [])

  const contactMap = useMemo(() => {
    const m: Record<string, NetworkContact> = {}
    contacts.forEach(c => { m[c.id] = c })
    return m
  }, [contacts])

  const { w, h } = containerSize
  const cx = w / 2, cy = h / 2

  return (
    <div ref={wrapRef} className="relative w-full h-full overflow-hidden bg-white" onWheel={onWheel}>

      {/* 淡灰网点背景 */}
      <div className="absolute inset-0 pointer-events-none opacity-30" style={{
        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      {/* ── 可缩放内容 ── */}
      <div className="absolute inset-0" style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>

        {/* SVG 连接线 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* 轨道圆（仅 orbit 模式） */}
          {layoutMode === 'orbit' && RINGS.map((ring, i) => (
            <circle key={i} cx="50%" cy="50%" r={ring.r}
              fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="1" strokeDasharray="4 10" />
          ))}
          {/* 背景边 */}
          {bgEdges.map(e => {
            const dimmed = !!activePath
            return (
              <line key={e.id}
                ref={el => { if (el) lineElRef.current.set(e.id, el) }}
                x1={cx} y1={cy} x2={cx} y2={cy}
                stroke={e.isKnown ? 'rgba(100,116,139,0.55)' : e.strong ? 'rgba(124,58,237,0.35)' : 'rgba(124,58,237,0.15)'}
                strokeWidth={e.isKnown ? 1.5 : e.strong ? 1.5 : 1}
                strokeDasharray={(!e.isKnown && !e.strong) ? '5 5' : undefined}
                opacity={dimmed ? 0.4 : 1}
              />
            )
          })}
          {/* 路径高亮边 */}
          {pathEdges.map(e => (
            <line key={e.id}
              ref={el => { if (el) lineElRef.current.set(e.id, el) }}
              x1={cx} y1={cy} x2={cx} y2={cy}
              stroke="#f59e0b" strokeWidth="2.5" opacity="0.9"
            >
              <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
            </line>
          ))}
        </svg>

        {/* 分组标签 */}
        {groupLabels.map(({ label, x, y }) => (
          <div key={label} className="absolute pointer-events-none"
            style={{ left: x, top: y - 52, transform: 'translateX(-50%)' }}>
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-gray-500 bg-white/80 border border-gray-200 whitespace-nowrap shadow-sm">
              {label}
            </span>
          </div>
        ))}

        {/* 用户中心节点 */}
        <div className="absolute flex items-center justify-center rounded-full font-bold text-white z-10"
          style={{
            width: 52, height: 52, left: cx - 26, top: cy - 26,
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            boxShadow: '0 0 0 3px rgba(124,58,237,0.2), 0 4px 16px rgba(124,58,237,0.4)',
            fontSize: 15,
          }}>你</div>

        {/* 联系人节点 */}
        {contacts.map(c => {
          const p = orbitRef.current[c.id]
          const a = anglesRef.current[c.id] ?? 0
          const size = p?.size ?? 44
          const initX = cx + (p?.r ?? 200) * Math.cos(a) - size / 2
          const initY = cy + (p?.r ?? 200) * Math.sin(a) - size / 2
          const col = ROLE_COLOR[c.relationRole] ?? ROLE_COLOR.COMRADE
          const onPath = activeIds.has(c.id)
          const dimmed = !!activePath && !onPath
          const isSel = selectedNodeId === c.id
          const isAutoGenerated = c.notes?.includes('自动生成的测试数据') ?? false

          return (
            <div key={c.id}
              ref={el => { nodeElRef.current[c.id] = el }}
              className={`journey-node${isSel ? ' selected' : ''} absolute flex items-center justify-center rounded-full font-semibold cursor-pointer`}
              style={{
                width: size, height: size, left: initX, top: initY,
                background: col.bg,
                color: col.hex,
                fontSize: size > 50 ? 12 : 10,
                opacity: dimmed ? 0.25 : 1,
                zIndex: onPath ? 5 : 2,
                boxShadow: isSel
                  ? `0 0 0 1.5px rgba(255,255,255,0.9), 0 0 22px rgba(255,255,255,0.5), 0 4px 12px ${col.glow}`
                  : `0 2px 8px ${col.glow}`,
                transition: 'opacity 0.4s, box-shadow 0.2s',
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
              <span className="truncate px-1 leading-tight text-center relative">
                {c.name.length > 3 ? c.name.slice(0, 3) : c.name}
                {isAutoGenerated && <span className="text-red-500 text-xs absolute -top-2 -right-1">*</span>}
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
              background: layoutMode === opt.id ? '#ede9fe' : 'rgba(255,255,255,0.9)',
              color: layoutMode === opt.id ? '#5b21b6' : '#64748b',
              border: layoutMode === opt.id ? '1px solid #a78bfa' : '1px solid #e2e8f0',
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
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-gray-500 transition hover:bg-gray-100"
            style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #e2e8f0', fontSize: 18 }}
            onClick={() => setScale(v => i === 0 ? Math.min(2.5, v + 0.15) : Math.max(0.3, v - 0.15))}
          >{s}</button>
        ))}
      </div>

      {/* ── 图例 ── */}
      <div className="absolute bottom-3 left-3 rounded-xl p-2.5 z-20 bg-white/90 border border-gray-200 shadow-sm text-xs">
        <div className="text-gray-400 font-medium mb-1.5">角色图例</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2">
          {Object.entries(ROLE_COLOR).map(([role, c]) => (
            <div key={role} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full border" style={{ background: c.bg, borderColor: c.border }} />
              <span className="text-gray-500">{ROLE_LABEL[role]}</span>
            </div>
          ))}
        </div>
        <div className="pt-2 space-y-1 border-t border-gray-100">
          {[
            { color: 'rgba(100,116,139,0.6)',  dash: false, label: '已知关系' },
            { color: 'rgba(124,58,237,0.45)',  dash: false, label: 'AI推断强连接' },
            { color: 'rgba(124,58,237,0.2)',   dash: true,  label: 'AI推断弱连接' },
            { color: '#f59e0b',                dash: false, label: '当前航路' },
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
      </div>
    </div>
  )
}
