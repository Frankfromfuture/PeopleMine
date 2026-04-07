"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { GripHorizontal } from "lucide-react"
import {
  StatCard,
  AIChatWidget,
  ContributionWidget,
  TraitsSummaryWidget,
  NetworkTrendWidget,
  NeedsMaintenanceWidget,
  TodayExpandWidget,
  Users,
  Zap,
  AlertTriangle,
  type DashboardStats,
} from "./DashboardWidgets"

/* ─── Grid constants ─────────────────────────────────────── */
const COLS = 12
const ROW_H = 55
const GAP = 16

/* ─── Types ──────────────────────────────────────────────── */
interface WP { id: string; x: number; y: number; w: number; h: number }

/* ─── Initial layout ─────────────────────────────────────── */
const INIT_LAYOUT: WP[] = [
  { id: "ai",       x: 0, y: 0,    w: 12, h: 3.9 },
  { id: "today",    x: 0, y: 3.9,  w: 4,  h: 2   },
  { id: "st1",      x: 0, y: 5.9,  w: 4,  h: 2   },
  { id: "st2",      x: 0, y: 7.9,  w: 4,  h: 2   },
  { id: "st3",      x: 4, y: 3.9,  w: 8,  h: 6   },
  { id: "contrib",  x: 0, y: 9.9,  w: 6,  h: 3.4 },
  { id: "traits",   x: 6, y: 9.9,  w: 6,  h: 6.8 },
  { id: "trend",    x: 0, y: 13.3, w: 6,  h: 3.4 },
]

/* ─── Layout utilities ───────────────────────────────────── */
const overlaps = (a: WP, b: WP) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

function compactLayout(layout: WP[]): WP[] {
  const sorted = [...layout].sort((a, b) => a.y - b.y || a.x - b.x)
  const result: WP[] = []
  for (const item of sorted) {
    let y = 0
    while (result.some((o) => overlaps({ ...item, y }, o))) y++
    result.push({ ...item, y })
  }
  return result
}

function pushDown(layout: WP[], movedId: string): WP[] {
  const items = layout.map((i) => ({ ...i }))
  const queue = [movedId]
  const done = new Set<string>()
  while (queue.length) {
    const id = queue.shift()!
    if (done.has(id)) continue
    done.add(id)
    const cur = items.find((i) => i.id === id)!
    for (const other of items) {
      if (other.id === id) continue
      if (overlaps(cur, other)) {
        other.y = cur.y + cur.h
        queue.push(other.id)
      }
    }
  }
  return items
}

/* ─── Widget renderer ────────────────────────────────────── */
function trendPct(current: number, prev: number): number {
  if (prev === 0) return 0
  return Math.abs(Math.round(((current - prev) / prev) * 100))
}
function trendDir(current: number, prev: number): "up" | "down" {
  return current >= prev ? "up" : "down"
}

function WidgetContent({ id, stats }: { id: string; stats: DashboardStats | null }) {
  switch (id) {
    case "ai":      return <AIChatWidget />
    case "st1":     return (
      <StatCard
        icon={Users}
        label="人脉数量"
        value={stats ? String(stats.total) : "—"}
        trend={stats && stats.prevWeekTotal > 0 ? {
          direction: trendDir(stats.total, stats.prevWeekTotal),
          percent:   trendPct(stats.total, stats.prevWeekTotal),
        } : undefined}
      />
    )
    case "st2":     return (
      <StatCard
        icon={Zap}
        label="高能量人脉"
        value={stats ? String(stats.highEnergy) : "—"}
        accent
        trend={stats && stats.prevWeekHighEnergy > 0 ? {
          direction: trendDir(stats.highEnergy, stats.prevWeekHighEnergy),
          percent:   trendPct(stats.highEnergy, stats.prevWeekHighEnergy),
        } : undefined}
      />
    )
    case "st3":     return <NeedsMaintenanceWidget stats={stats} />
    case "contrib": return <ContributionWidget stats={stats} />
    case "traits":  return <TraitsSummaryWidget stats={stats} />
    case "trend":   return <NetworkTrendWidget stats={stats} />
    case "today":   return <TodayExpandWidget />
    default:        return null
  }
}

/* ─── Pixel helpers ──────────────────────────────────────── */
function itemRect(item: WP, cw: number) {
  return {
    left:   item.x * (cw + GAP),
    top:    item.y * (ROW_H + GAP),
    width:  item.w * cw + (item.w - 1) * GAP,
    height: item.h * ROW_H + (item.h - 1) * GAP,
  }
}

function pxToGrid(px: number, py: number, w: number, h: number, cw: number) {
  return {
    x: Math.max(0, Math.min(COLS - w, Math.round(px / (cw + GAP)))),
    y: Math.max(0, Math.round(py / (ROW_H + GAP))),
  }
}

/* ─── Component ──────────────────────────────────────────── */
export function DraggableCanvas({
  autoAlign,
  onToggleAutoAlign,
}: {
  autoAlign: boolean
  onToggleAutoAlign: () => void
}) {
  const [layout, setLayout] = useState(INIT_LAYOUT)
  const [colWidth, setColWidth] = useState(0)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/stats')
      if (res.ok) setStats(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    fetchStats()
    const id = setInterval(fetchStats, 60_000)
    return () => clearInterval(id)
  }, [fetchStats])

  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragDelta, setDragDelta]   = useState({ dx: 0, dy: 0 })
  const [ghostPos, setGhostPos]     = useState<WP | null>(null)

  const containerRef  = useRef<HTMLDivElement>(null)
  const colWidthRef   = useRef(0)
  const layoutRef     = useRef(layout)
  const autoAlignRef  = useRef(autoAlign)
  const ghostRef      = useRef<WP | null>(null)
  const dragDataRef   = useRef<{
    id: string
    startMouseX: number; startMouseY: number
    startLeft:   number; startTop:   number
    w: number;   h: number
  } | null>(null)

  layoutRef.current    = layout
  autoAlignRef.current = autoAlign
  colWidthRef.current  = colWidth

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return
      const cw = (containerRef.current.clientWidth - (COLS - 1) * GAP) / COLS
      setColWidth(cw)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragDataRef.current
      if (!drag || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const dx = mx - drag.startMouseX
      const dy = my - drag.startMouseY
      const cw = colWidthRef.current
      const snap = pxToGrid(drag.startLeft + dx, drag.startTop + dy, drag.w, drag.h, cw)
      const ghost: WP = { id: drag.id, x: snap.x, y: snap.y, w: drag.w, h: drag.h }
      ghostRef.current = ghost
      setDragDelta({ dx, dy })
      setGhostPos(ghost)
    }

    const onUp = () => {
      const drag = dragDataRef.current
      if (!drag) return
      const ghost = ghostRef.current
      if (ghost) {
        let next = layoutRef.current.map((item) =>
          item.id === drag.id ? { ...item, x: ghost.x, y: ghost.y } : item
        )
        next = autoAlignRef.current ? compactLayout(next) : pushDown(next, drag.id)
        setLayout(next)
      }
      dragDataRef.current = null
      ghostRef.current    = null
      setDraggingId(null)
      setDragDelta({ dx: 0, dy: 0 })
      setGhostPos(null)
    }

    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup",   onUp)
    return () => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup",   onUp)
    }
  }, [])

  const handleDragStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const cw = colWidthRef.current
    if (!containerRef.current || cw === 0) return
    const item = layoutRef.current.find((i) => i.id === id)!
    const rect = containerRef.current.getBoundingClientRect()
    const { left, top } = itemRect(item, cw)
    dragDataRef.current = {
      id,
      startMouseX: e.clientX - rect.left,
      startMouseY: e.clientY - rect.top,
      startLeft:   left,
      startTop:    top,
      w:           item.w,
      h:           item.h,
    }
    setDraggingId(id)
    setDragDelta({ dx: 0, dy: 0 })
    setGhostPos({ id, x: item.x, y: item.y, w: item.w, h: item.h })
    ghostRef.current = { id, x: item.x, y: item.y, w: item.w, h: item.h }
  }

  const totalRows    = Math.max(...layout.map((i) => i.y + i.h))
  const canvasHeight = totalRows * ROW_H + (totalRows - 1) * GAP + GAP * 2

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: canvasHeight }}
    >
      {/* Ghost placeholder */}
      {ghostPos && colWidth > 0 && (() => {
        const r = itemRect(ghostPos, colWidth)
        return (
          <div
            className="absolute rounded-xl border-2 border-dashed border-[#FF7F27]/50 bg-[#FF7F27]/[0.04] pointer-events-none"
            style={{
              left: r.left, top: r.top, width: r.width, height: r.height,
              zIndex: 50,
              transition: "left 80ms ease, top 80ms ease",
            }}
          />
        )
      })()}

      {/* Widgets */}
      {colWidth > 0 && layout.map((item) => {
        const isDragging = item.id === draggingId
        const { left, top, width, height } = itemRect(item, colWidth)
        return (
          <div
            key={item.id}
            className="absolute group"
            style={{
              left, top, width, height,
              zIndex: isDragging ? 100 : 1,
              transform: isDragging
                ? `translate(${dragDelta.dx}px, ${dragDelta.dy}px)`
                : "none",
              transition: isDragging
                ? "none"
                : "left 200ms cubic-bezier(.4,0,.2,1), top 200ms cubic-bezier(.4,0,.2,1)",
              boxShadow: isDragging
                ? "0 16px 48px rgba(0,0,0,0.14)"
                : undefined,
            }}
          >
            {/* Drag handle */}
            <div
              onMouseDown={(e) => handleDragStart(e, item.id)}
              className="absolute top-2.5 right-3 z-20 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity select-none"
              title="拖动"
            >
              <GripHorizontal size={14} className="text-gray-300 hover:text-gray-500 transition-colors" />
            </div>

            {/* Content */}
            <div className="w-full h-full rounded-xl overflow-hidden">
              <WidgetContent id={item.id} stats={stats} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
