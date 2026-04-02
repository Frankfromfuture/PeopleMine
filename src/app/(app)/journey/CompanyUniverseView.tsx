'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { COMPANY_SCALE_LABELS } from '@/types'
import type { CompanyScale } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompanyNode {
  id: string
  name: string
  industry: string | null
  scale: string | null
  tags: string[]
  energyScore: number
  familiarityLevel: number | null
  temperature: string | null
  mainBusiness: string | null
  contacts: { id: string; name: string }[]
}

interface CompanyRelationEdge {
  companyIdA: string
  companyIdB: string
  relationDesc: string | null
  strength?: 'STRONG' | 'MEDIUM' | 'WEAK'
}

type CompanyLayoutMode = 'orbit' | 'industry'

// ─── Constants ───────────────────────────────────────────────────────────────

const SCALE_COLOR: Record<string, { bg: string; border: string; hex: string; glow: string }> = {
  STARTUP: { bg: '#faf5ff', border: '#7c3aed', hex: '#7c3aed', glow: 'rgba(124,58,237,0.25)' },
  SME:     { bg: '#eff6ff', border: '#3b82f6', hex: '#3b82f6', glow: 'rgba(59,130,246,0.25)' },
  MID:     { bg: '#ecfeff', border: '#06b6d4', hex: '#06b6d4', glow: 'rgba(6,182,212,0.25)' },
  LARGE:   { bg: '#fffbeb', border: '#f59e0b', hex: '#f59e0b', glow: 'rgba(245,158,11,0.25)' },
  LISTED:  { bg: '#f0fdf4', border: '#22c55e', hex: '#22c55e', glow: 'rgba(34,197,94,0.25)' },
}
const DEFAULT_COLOR = SCALE_COLOR.STARTUP

const TEMP_HEX: Record<string, string> = { COLD: '#38bdf8', WARM: '#f59e0b', HOT: '#f43f5e' }

const SCALE_SIZE: Record<string, number> = {
  STARTUP: 40, SME: 46, MID: 52, LARGE: 60, LISTED: 68,
}

const RINGS = [
  { r: 110, spd: 0.0000110, max: 3 },
  { r: 205, spd: 0.0000078, max: 5 },
  { r: 310, spd: 0.0000053, max: 8 },
  { r: 430, spd: 0.0000033, max: Infinity },
]

const LAYOUT_OPTIONS: Array<{ id: CompanyLayoutMode; icon: string; label: string }> = [
  { id: 'orbit',    icon: '🌌', label: '星系轨道' },
  { id: 'industry', icon: '🏭', label: '按行业' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseArr(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[]
  if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return [] } }
  return []
}

interface OrbitParam { r: number; spd: number; initAngle: number; size: number }

function buildOrbits(companies: CompanyNode[]): Record<string, OrbitParam> {
  const sorted = [...companies].sort((a, b) => b.energyScore - a.energyScore)
  const groups: CompanyNode[][] = RINGS.map(() => [])
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
        r: RINGS[ri].r,
        spd: RINGS[ri].spd,
        initAngle: (2 * Math.PI * j) / Math.max(1, grp.length) + ri * 0.9,
        size: SCALE_SIZE[c.scale ?? ''] ?? 44,
      }
    })
  })
  return out
}

function computeGroupLayout(
  companies: CompanyNode[],
  grouper: (c: CompanyNode) => string,
  cx: number, cy: number,
): { positions: Record<string, { x: number; y: number }>; groupCenters: Array<{ label: string; x: number; y: number }> } {
  const groups = new Map<string, CompanyNode[]>()
  companies.forEach(c => {
    const g = grouper(c)
    if (!groups.has(g)) groups.set(g, [])
    groups.get(g)!.push(c)
  })
  const list = [...groups.entries()]
  const n = list.length
  const groupR = Math.max(150, n * 55)
  const positions: Record<string, { x: number; y: number }> = {}
  const groupCenters: Array<{ label: string; x: number; y: number }> = []

  list.forEach(([label, members], gi) => {
    const ga = (2 * Math.PI * gi / n) - Math.PI / 2
    const gcx = cx + groupR * Math.cos(ga)
    const gcy = cy + groupR * Math.sin(ga)
    groupCenters.push({ label, x: gcx, y: gcy })
    const nr = members.length <= 1 ? 0 : Math.min(80, 24 + members.length * 10)
    members.forEach((c, mi) => {
      const na = (2 * Math.PI * mi) / Math.max(1, members.length)
      positions[c.id] = { x: gcx + nr * Math.cos(na), y: gcy + nr * Math.sin(na) }
    })
  })
  return { positions, groupCenters }
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function floatSeed(id: string, salt: number): number {
  let h = 0x811c9dc5
  for (let i = 0; i < id.length; i++) h = (h ^ id.charCodeAt(i)) * 0x01000193
  return ((h >>> 0) * 1.6180339887 + salt) % (Math.PI * 2)
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function CompanyTooltip({ c, x, y }: { c: CompanyNode; x: number; y: number }) {
  const col = SCALE_COLOR[c.scale ?? ''] ?? DEFAULT_COLOR
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
        <div className="font-bold text-sm text-gray-900">{c.name}</div>
        {c.scale && (
          <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium border"
            style={{ background: col.bg, color: col.hex, borderColor: col.border }}>
            {COMPANY_SCALE_LABELS[c.scale as CompanyScale]?.name}
          </span>
        )}
        {c.industry && <div className="text-xs text-gray-500">{c.industry}</div>}
        {c.mainBusiness && <div className="text-xs text-gray-600 line-clamp-2">{c.mainBusiness}</div>}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>⚡ {c.energyScore}</span>
          {c.temperature === 'HOT' && <span>🔥热</span>}
          {c.temperature === 'WARM' && <span>☀️温</span>}
          {c.temperature === 'COLD' && <span>❄️冷</span>}
          {c.contacts.length > 0 && <span>👥 {c.contacts.length}</span>}
        </div>
        {c.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {c.tags.slice(0, 3).map(t => (
              <span key={t} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-xs">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CompanyUniverseView() {
  // ── Data state ──
  const [companies, setCompanies] = useState<CompanyNode[]>([])
  const [relations, setRelations] = useState<CompanyRelationEdge[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CompanyNode | null>(null)
  const [layoutMode, setLayoutModeState] = useState<CompanyLayoutMode>('orbit')
  const [activeIndustry, setActiveIndustry] = useState<string>('ALL')

  // ── Animation refs ──
  const wrapRef    = useRef<HTMLDivElement>(null)
  const rafRef     = useRef(0)
  const hovIdRef   = useRef<string | null>(null)
  const layoutRef  = useRef<CompanyLayoutMode>('orbit')
  const anglesRef  = useRef<Record<string, number>>({})
  const orbitRef   = useRef<Record<string, OrbitParam>>({})
  const curPosRef  = useRef<Record<string, { x: number; y: number }>>({})
  const tgtPosRef  = useRef<Record<string, { x: number; y: number }>>({})
  const sizeRef    = useRef({ w: 900, h: 600 })
  const nodeElRef  = useRef<Record<string, HTMLDivElement | null>>({})
  const lineElRef  = useRef<Map<string, SVGLineElement>>(new Map())
  const allEdgesRef = useRef<Array<{ id: string; srcId: string; tgtId: string }>>([])

  const [scale, setScale]               = useState(0.88)
  const [hovered, setHovered]           = useState<CompanyNode | null>(null)
  const [tipPos, setTipPos]             = useState({ x: 0, y: 0 })
  const [groupLabels, setGroupLabels]   = useState<Array<{ label: string; x: number; y: number }>>([])
  const [containerSize, setContainerSize] = useState({ w: 900, h: 600 })

  const setLayoutMode = useCallback((m: CompanyLayoutMode) => {
    layoutRef.current = m
    setLayoutModeState(m)
  }, [])

  // ── Load data ──
  useEffect(() => {
    Promise.all([
      fetch('/api/companies').then(r => r.json()),
      fetch('/api/company-relations').then(r => r.json()).catch(() => ({ relations: [] })),
    ]).then(([compData, relData]) => {
      const raw = (compData.companies || []) as Record<string, unknown>[]
      const parsed: CompanyNode[] = raw.map(c => ({
        id: c.id as string,
        name: c.name as string,
        industry: c.industry as string | null,
        scale: c.scale as string | null,
        tags: parseArr(c.tags),
        energyScore: (c.energyScore as number) || 50,
        familiarityLevel: c.familiarityLevel as number | null,
        temperature: c.temperature as string | null,
        mainBusiness: c.mainBusiness as string | null,
        contacts: (c.contacts as { id: string; name: string }[]) || [],
      }))
      setCompanies(parsed)
      setRelations(relData.relations || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  // ── Container size ──
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

  // ── Init orbits ──
  useEffect(() => {
    const params = buildOrbits(companies)
    const angles: Record<string, number> = {}
    Object.entries(params).forEach(([id, p]) => { angles[id] = p.initAngle })
    anglesRef.current = angles
    orbitRef.current = params
  }, [companies])

  // ── Layout target positions ──
  useEffect(() => {
    const { w, h } = sizeRef.current
    const cx = w / 2, cy = h / 2
    if (layoutMode === 'orbit') { setGroupLabels([]); return }
    const { positions, groupCenters } = computeGroupLayout(companies, c => c.industry || '其他', cx, cy)
    tgtPosRef.current = positions
    setGroupLabels(groupCenters)
  }, [layoutMode, companies, containerSize])

  // ── Build edges ──
  const edges = useMemo(() =>
    relations.map((r, i) => ({ id: `e-${i}`, srcId: r.companyIdA, tgtId: r.companyIdB, strength: r.strength ?? 'MEDIUM' })),
  [relations])

  useEffect(() => {
    allEdgesRef.current = edges.map(e => ({ id: e.id, srcId: e.srcId, tgtId: e.tgtId }))
  }, [edges])

  // ── Animation loop ──
  useEffect(() => {
    let last: number | null = null
    const getPos = (id: string) => curPosRef.current[id] ?? { x: sizeRef.current.w / 2, y: sizeRef.current.h / 2 }

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
            if (!isHov) anglesRef.current[id] += p.spd * dt
            const a = anglesRef.current[id]
            curPosRef.current[id] = { x: cx + p.r * Math.cos(a), y: cy + p.r * Math.sin(a) }
          } else {
            anglesRef.current[id] += p.spd * dt
            const tgt = tgtPosRef.current[id] ?? { x: cx, y: cy }
            const fx = isHov ? 0 : Math.sin(ts * 0.0008 + floatSeed(id, 0)) * 4
            const fy = isHov ? 0 : Math.cos(ts * 0.0008 + floatSeed(id, 1)) * 4
            const cur = curPosRef.current[id] ?? tgt
            curPosRef.current[id] = { x: lerp(cur.x, tgt.x + fx, 0.04), y: lerp(cur.y, tgt.y + fy, 0.04) }
          }

          const { x, y } = curPosRef.current[id]
          const el = nodeElRef.current[id]
          if (el) { el.style.left = `${x - p.size / 2}px`; el.style.top = `${y - p.size / 2}px` }
        })

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
  }, [])

  // ── Zoom ──
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setScale(s => Math.min(2.5, Math.max(0.3, s - e.deltaY * 0.001)))
  }, [])

  const companyMap = useMemo(() => {
    const m: Record<string, CompanyNode> = {}
    companies.forEach(c => { m[c.id] = c })
    return m
  }, [companies])

  // ── Right panel stats ──
  const strongLinks = relations.filter(r => (r.strength ?? 'MEDIUM') === 'STRONG').length
  const mediumLinks = relations.filter(r => (r.strength ?? 'MEDIUM') === 'MEDIUM').length
  const weakLinks   = relations.filter(r => (r.strength ?? 'MEDIUM') === 'WEAK').length
  const industryBuckets = Object.entries(
    companies.reduce<Record<string, number>>((acc, c) => {
      const key = c.industry || '其他'; acc[key] = (acc[key] || 0) + 1; return acc
    }, {}),
  ).sort((a, b) => b[1] - a[1])

  const { w, h } = containerSize
  const cx = w / 2, cy = h / 2

  // ── Loading / empty states ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm">加载企业宇宙…</p>
        </div>
      </div>
    )
  }

  if (companies.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="text-5xl mb-3">🏢</div>
          <p className="text-sm font-medium text-gray-600">还没有企业</p>
          <p className="text-xs text-gray-400 mt-1">先去「资源数据库」添加几家企业吧</p>
          <a href="/resources?type=companies"
            className="mt-3 inline-block px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
            新增企业
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 min-w-0 h-full overflow-hidden">

      {/* ── Left: JourneyGraph-style orbital canvas ── */}
      <div ref={wrapRef} className="relative flex-1 h-full overflow-hidden bg-white" onWheel={onWheel}>

        {/* Dot grid bg */}
        <div className="absolute inset-0 pointer-events-none opacity-30" style={{
          backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        {/* Scalable content */}
        <div className="absolute inset-0" style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>

          {/* SVG lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Orbital rings */}
            {layoutMode === 'orbit' && RINGS.map((ring, i) => (
              <circle key={i} cx="50%" cy="50%" r={ring.r}
                fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="1" strokeDasharray="4 10" />
            ))}
            {/* Relation edges */}
            {edges.map(e => {
              const isStrong = e.strength === 'STRONG'
              const isWeak   = e.strength === 'WEAK'
              const srcComp  = companyMap[e.srcId]
              const tgtComp  = companyMap[e.tgtId]
              const inActive = activeIndustry === 'ALL'
                || srcComp?.industry === activeIndustry
                || tgtComp?.industry === activeIndustry
              return (
                <line key={e.id}
                  ref={el => { if (el) lineElRef.current.set(e.id, el) }}
                  x1={cx} y1={cy} x2={cx} y2={cy}
                  stroke={isStrong ? 'rgba(185,32,69,0.65)' : isWeak ? 'rgba(148,163,184,0.3)' : 'rgba(185,32,69,0.38)'}
                  strokeWidth={isStrong ? 2.5 : isWeak ? 1 : 1.6}
                  strokeDasharray={isWeak ? '5 5' : undefined}
                  opacity={inActive ? 1 : 0.15}
                />
              )
            })}
          </svg>

          {/* Group labels */}
          {groupLabels.map(({ label, x, y }) => (
            <div key={label} className="absolute pointer-events-none"
              style={{ left: x, top: y - 56, transform: 'translateX(-50%)' }}>
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-gray-500 bg-white/80 border border-gray-200 whitespace-nowrap shadow-sm">
                {label}
              </span>
            </div>
          ))}

          {/* Company nodes */}
          {companies.map(c => {
            const p = orbitRef.current[c.id]
            const a = anglesRef.current[c.id] ?? 0
            const size = p?.size ?? 44
            const initX = cx + (p?.r ?? 200) * Math.cos(a) - size / 2
            const initY = cy + (p?.r ?? 200) * Math.sin(a) - size / 2
            const col = SCALE_COLOR[c.scale ?? ''] ?? DEFAULT_COLOR
            const isSel = selected?.id === c.id
            const inActive = activeIndustry === 'ALL' || (c.industry || '其他') === activeIndustry
            // strokeColor reserved for future border use
            void (c.temperature ? TEMP_HEX[c.temperature] : col.border)

            return (
              <div key={c.id}
                ref={el => { nodeElRef.current[c.id] = el }}
                className={`journey-node${isSel ? ' selected' : ''} absolute flex items-center justify-center rounded-full font-semibold cursor-pointer`}
                style={{
                  width: size, height: size, left: initX, top: initY,
                  background: col.bg,
                  color: col.hex,
                  fontSize: size > 56 ? 12 : 10,
                  opacity: inActive ? 1 : 0.2,
                  zIndex: isSel ? 5 : 2,
                  boxShadow: isSel
                    ? `0 0 0 1.5px rgba(255,255,255,0.9), 0 0 22px rgba(255,255,255,0.5), 0 4px 12px ${col.glow}`
                    : `0 2px 8px ${col.glow}`,
                  transition: 'opacity 0.3s, box-shadow 0.2s',
                }}
                onClick={() => setSelected(prev => prev?.id === c.id ? null : companyMap[c.id])}
                onMouseEnter={e => {
                  hovIdRef.current = c.id
                  setHovered(companyMap[c.id])
                  setTipPos({ x: e.clientX, y: e.clientY })
                }}
                onMouseLeave={() => { hovIdRef.current = null; setHovered(null) }}
              >
                <span className="truncate px-1 leading-tight text-center">
                  {c.name.length > 3 ? c.name.slice(0, 3) : c.name}
                </span>
                {/* Contact count badge */}
                {c.contacts.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center"
                    style={{ fontSize: 8, color: 'white', fontWeight: 700 }}>
                    {c.contacts.length}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Tooltip */}
        {hovered && <CompanyTooltip c={hovered} x={tipPos.x} y={tipPos.y} />}

        {/* Layout buttons (right overlay, JG style) */}
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

        {/* Zoom buttons */}
        <div className="absolute right-3 bottom-3 z-20 flex flex-col gap-1">
          {(['+', '−'] as const).map((s, i) => (
            <button key={s}
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-gray-500 transition hover:bg-gray-100"
              style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid #e2e8f0', fontSize: 18 }}
              onClick={() => setScale(v => i === 0 ? Math.min(2.5, v + 0.15) : Math.max(0.3, v - 0.15))}
            >{s}</button>
          ))}
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 rounded-xl p-2.5 z-20 bg-white/90 border border-gray-200 shadow-sm text-xs">
          <div className="text-gray-400 font-medium mb-1.5">规模图例</div>
          <div className="space-y-1 mb-2">
            {(Object.entries(COMPANY_SCALE_LABELS) as [CompanyScale, { name: string; desc: string }][]).map(([k, v]) => {
              const col = SCALE_COLOR[k] ?? DEFAULT_COLOR
              return (
                <div key={k} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full border"
                    style={{ background: col.bg, borderColor: col.border }} />
                  <span className="text-gray-500">{v.name}</span>
                </div>
              )
            })}
          </div>
          <div className="pt-2 space-y-1 border-t border-gray-100">
            {[
              { color: 'rgba(185,32,69,0.65)', dash: false, label: '强关系' },
              { color: 'rgba(185,32,69,0.38)', dash: false, label: '中关系' },
              { color: 'rgba(148,163,184,0.5)', dash: true, label: '弱关系' },
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

        {/* Stats overlay */}
        <div className="absolute top-3 left-3 text-xs text-gray-400 bg-white/70 rounded px-2 py-1">
          {companies.length} 家企业 · {relations.length} 条关系 · 点击节点查看详情
        </div>
      </div>

      {/* ── Right panel: UNCHANGED ── */}
      <div className="w-[360px] shrink-0 border-l border-gray-200 bg-white overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm">🏢 企业航程控制台</h3>
          <p className="text-xs text-gray-500 mt-1">AI 按产业链协同判断关系强弱，强协同用粗实线。</p>

          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5">
              <div className="text-rose-700 font-semibold">强链接</div>
              <div className="text-rose-900 text-sm">{strongLinks}</div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5">
              <div className="text-amber-700 font-semibold">中链接</div>
              <div className="text-amber-900 text-sm">{mediumLinks}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
              <div className="text-slate-600 font-semibold">弱链接</div>
              <div className="text-slate-800 text-sm">{weakLinks}</div>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-600">行业堆叠</p>
              <button
                onClick={() => setActiveIndustry('ALL')}
                className={`text-[11px] px-2 py-0.5 rounded border ${activeIndustry === 'ALL' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-gray-500 border-gray-300'}`}
              >
                全部
              </button>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {industryBuckets.map(([industry, count]) => (
                <button
                  key={industry}
                  onClick={() => {
                    setActiveIndustry(industry)
                    setLayoutMode('industry')
                  }}
                  className={`w-full flex items-center justify-between rounded-md border px-2 py-1 text-left ${activeIndustry === industry ? 'border-rose-300 bg-rose-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}
                >
                  <span className="text-xs text-gray-700 truncate">{industry}</span>
                  <span className="text-xs text-gray-500">{count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {selected ? (
          <div className="p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{selected.name}</h3>
                {selected.industry && <p className="text-xs text-gray-500 mt-0.5">{selected.industry}</p>}
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {selected.scale && (
              <div className={`inline-flex items-center px-2 py-0.5 text-xs rounded border font-medium ${COMPANY_SCALE_LABELS[selected.scale as CompanyScale]?.color}`}>
                {COMPANY_SCALE_LABELS[selected.scale as CompanyScale]?.name}
                <span className="ml-1 opacity-70">{COMPANY_SCALE_LABELS[selected.scale as CompanyScale]?.desc}</span>
              </div>
            )}

            {selected.mainBusiness && (
              <p className="text-sm text-gray-600">{selected.mainBusiness}</p>
            )}

            {selected.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selected.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">{t}</span>
                ))}
              </div>
            )}

            <div>
              <p className="text-xs text-gray-400 mb-1">能量值</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-400 rounded-full" style={{ width: `${selected.energyScore}%` }} />
                </div>
                <span className="text-xs text-gray-500">{selected.energyScore}</span>
              </div>
            </div>

            {selected.contacts.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">关联人脉 ({selected.contacts.length})</p>
                <div className="space-y-1">
                  {selected.contacts.map(c => (
                    <a key={c.id} href={`/contacts/${c.id}`}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
                        {c.name.slice(0, 1)}
                      </div>
                      <span className="text-sm text-gray-700">{c.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <a href={`/companies/${selected.id}`}
              className="block w-full text-center px-3 py-2 text-sm bg-violet-50 text-violet-700 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors">
              查看完整档案 →
            </a>
          </div>
        ) : (
          <div className="p-6 text-center text-sm text-gray-400">点击企业节点查看企业详情</div>
        )}
      </div>
    </div>
  )
}
