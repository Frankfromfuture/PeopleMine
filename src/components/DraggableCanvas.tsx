"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  AIChatWidget,
  ContributionWidget,
  NeedsMaintenanceWidget,
  NetworkTrendWidget,
  StatCard,
  TodayExpandWidget,
  TraitsSummaryWidget,
  Users,
  type DashboardStats,
} from "./DashboardWidgets"

const COLS = 12
const ROW_H = 55
const GAP = 16
const LAYOUT_STORAGE_KEY = "dashboard-layout-v3"
const INTERACTIVE_SELECTOR =
  'button, input, textarea, select, a, [role="button"], [role="link"], [contenteditable="true"], [data-no-drag="true"]'

type WidgetId = "ai" | "today" | "st1" | "st3" | "contrib" | "traits" | "trend"
type ResizeHandle = "n" | "e" | "s" | "w" | "ne" | "nw" | "se" | "sw"

interface WidgetPlacement {
  id: WidgetId
  x: number
  y: number
  w: number
  h: number
}

type DraftRect = {
  left: number
  top: number
  width: number
  height: number
}

type ActiveInteraction =
  | {
      type: "drag"
      id: WidgetId
      original: WidgetPlacement
      originRect: DraftRect
      offsetX: number
      offsetY: number
    }
  | {
      type: "resize"
      id: WidgetId
      handle: ResizeHandle
      original: WidgetPlacement
      originRect: DraftRect
      startMouseX: number
      startMouseY: number
    }

const MIN_SIZE: Record<WidgetId, { w: number; h: number }> = {
  ai: { w: 6, h: 3 },
  today: { w: 4, h: 4 },
  st1: { w: 3, h: 2 },
  st3: { w: 4, h: 4 },
  contrib: { w: 4, h: 3 },
  traits: { w: 4, h: 4 },
  trend: { w: 4, h: 3 },
}

const DEFAULT_LAYOUT: WidgetPlacement[] = [
  { id: "ai", x: 0, y: 0, w: 12, h: 3.9 },
  { id: "today", x: 0, y: 3.9, w: 4, h: 4 },
  { id: "st1", x: 0, y: 7.9, w: 4, h: 2 },
  { id: "st3", x: 4, y: 3.9, w: 8, h: 6 },
  { id: "contrib", x: 0, y: 9.9, w: 6, h: 3.4 },
  { id: "traits", x: 6, y: 9.9, w: 6, h: 6.8 },
  { id: "trend", x: 0, y: 13.3, w: 6, h: 3.4 },
]

function cloneLayout(layout: WidgetPlacement[]) {
  return layout.map((item) => ({ ...item }))
}

function isValidLayout(value: unknown): value is WidgetPlacement[] {
  if (!Array.isArray(value) || value.length !== DEFAULT_LAYOUT.length) return false

  const ids = new Set(DEFAULT_LAYOUT.map((item) => item.id))
  return value.every((item) => {
    if (!item || typeof item !== "object") return false
    const maybe = item as Partial<WidgetPlacement>
    return (
      typeof maybe.id === "string" &&
      ids.has(maybe.id as WidgetId) &&
      typeof maybe.x === "number" &&
      typeof maybe.y === "number" &&
      typeof maybe.w === "number" &&
      typeof maybe.h === "number"
    )
  })
}

const RESIZE_HANDLES: Array<{ handle: ResizeHandle; className: string }> = [
  { handle: "n", className: "left-4 right-4 top-[-6px] h-3 cursor-ns-resize" },
  { handle: "s", className: "bottom-[-6px] left-4 right-4 h-3 cursor-ns-resize" },
  { handle: "w", className: "bottom-4 left-[-6px] top-4 w-3 cursor-ew-resize" },
  { handle: "e", className: "bottom-4 right-[-6px] top-4 w-3 cursor-ew-resize" },
  { handle: "nw", className: "left-[-6px] top-[-6px] h-3 w-3 cursor-nwse-resize" },
  { handle: "ne", className: "right-[-6px] top-[-6px] h-3 w-3 cursor-nesw-resize" },
  { handle: "sw", className: "bottom-[-6px] left-[-6px] h-3 w-3 cursor-nesw-resize" },
  { handle: "se", className: "bottom-[-6px] right-[-6px] h-3 w-3 cursor-nwse-resize" },
]

function overlaps(a: WidgetPlacement, b: WidgetPlacement) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function itemRect(item: WidgetPlacement, colWidth: number): DraftRect {
  return {
    left: item.x * (colWidth + GAP),
    top: item.y * (ROW_H + GAP),
    width: item.w * colWidth + (item.w - 1) * GAP,
    height: item.h * ROW_H + (item.h - 1) * GAP,
  }
}

function rectToGrid(rect: DraftRect, original: WidgetPlacement, colWidth: number): WidgetPlacement {
  const min = MIN_SIZE[original.id]
  const unitWidth = colWidth + GAP
  const unitHeight = ROW_H + GAP
  const snappedW = Math.max(min.w, Math.round((rect.width + GAP) / unitWidth))
  const snappedH = Math.max(min.h, Math.round((rect.height + GAP) / unitHeight))
  const clampedW = Math.min(COLS, snappedW)
  const snappedX = Math.round(rect.left / unitWidth)
  const snappedY = Math.max(0, Math.round(rect.top / unitHeight))
  const clampedX = Math.max(0, Math.min(COLS - clampedW, snappedX))

  return {
    ...original,
    x: clampedX,
    y: snappedY,
    w: clampedW,
    h: snappedH,
  }
}

function gravityCompact(layout: WidgetPlacement[]): WidgetPlacement[] {
  const sorted = [...layout].sort((a, b) => a.y - b.y || a.x - b.x)
  const placed: WidgetPlacement[] = []

  for (const original of sorted) {
    let candidate = { ...original }

    while (placed.some((other) => overlaps(candidate, other))) {
      candidate = { ...candidate, y: candidate.y + 1 }
    }

    let changed = true
    while (changed) {
      changed = false

      while (candidate.y > 0) {
        const step = candidate.y >= 1 ? 1 : candidate.y
        const next = { ...candidate, y: Number((candidate.y - step).toFixed(2)) }
        if (placed.some((other) => overlaps(next, other))) break
        candidate = next
        changed = true
      }

      while (candidate.x > 0) {
        const next = { ...candidate, x: candidate.x - 1 }
        if (placed.some((other) => overlaps(next, other))) break
        candidate = next
        changed = true
      }
    }

    placed.push(candidate)
  }

  return layout.map((item) => placed.find((placedItem) => placedItem.id === item.id) ?? item)
}

function pushDown(layout: WidgetPlacement[], movedId: WidgetId): WidgetPlacement[] {
  const items = layout.map((item) => ({ ...item }))
  const queue: WidgetId[] = [movedId]
  const visited = new Set<WidgetId>()

  while (queue.length) {
    const currentId = queue.shift()
    if (!currentId || visited.has(currentId)) continue
    visited.add(currentId)

    const current = items.find((item) => item.id === currentId)
    if (!current) continue

    for (const other of items) {
      if (other.id === current.id) continue
      if (overlaps(current, other)) {
        other.y = current.y + current.h
        queue.push(other.id)
      }
    }
  }

  return items
}

function trendPct(current: number, prev: number): number {
  if (prev === 0) return 0
  return Math.abs(Math.round(((current - prev) / prev) * 100))
}

function trendDir(current: number, prev: number): "up" | "down" {
  return current >= prev ? "up" : "down"
}

function WidgetContent({ id, stats }: { id: WidgetId; stats: DashboardStats | null }) {
  switch (id) {
    case "ai":
      return <AIChatWidget />
    case "st1":
      return (
        <StatCard
          icon={Users}
          label="人脉数量"
          value={stats ? `${stats.highEnergy}/${stats.total}` : "--/--"}
          headerEnd={
            stats && stats.prevWeekTotal > 0 ? (
              <span className="rounded-full bg-[#A04F47]/10 px-2.5 py-[5px] text-[10px] text-[#A04F47]">
                较上周{trendDir(stats.total, stats.prevWeekTotal) === "up" ? "增加" : "减少"}了{" "}
                {trendPct(stats.total, stats.prevWeekTotal)}%
              </span>
            ) : null
          }
          summary={<span className="text-[11px] text-gray-500">高能量人脉 / 人脉总数</span>}
        />
      )
    case "st3":
      return <NeedsMaintenanceWidget stats={stats} />
    case "contrib":
      return <ContributionWidget stats={stats} />
    case "traits":
      return <TraitsSummaryWidget stats={stats} />
    case "trend":
      return <NetworkTrendWidget stats={stats} />
    case "today":
      return <TodayExpandWidget />
    default:
      return null
  }
}

export function DraggableCanvas({ autoAlign }: { autoAlign: boolean }) {
  const [layout, setLayout] = useState<WidgetPlacement[]>(() => cloneLayout(DEFAULT_LAYOUT))
  const [colWidth, setColWidth] = useState(0)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [interaction, setInteraction] = useState<ActiveInteraction | null>(null)
  const [draftRect, setDraftRect] = useState<DraftRect | null>(null)
  const [ghostItem, setGhostItem] = useState<WidgetPlacement | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const layoutRef = useRef(layout)
  const colWidthRef = useRef(colWidth)
  const autoAlignRef = useRef(autoAlign)
  const interactionRef = useRef<ActiveInteraction | null>(null)
  const ghostRef = useRef<WidgetPlacement | null>(null)
  const prevAutoAlignRef = useRef(autoAlign)

  layoutRef.current = layout
  colWidthRef.current = colWidth
  autoAlignRef.current = autoAlign
  interactionRef.current = interaction
  ghostRef.current = ghostItem

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) setStats(await response.json())
    } catch {
      // ignore polling errors
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const timer = setInterval(fetchStats, 60_000)
    return () => clearInterval(timer)
  }, [fetchStats])

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return
      const nextWidth = (containerRef.current.clientWidth - (COLS - 1) * GAP) / COLS
      setColWidth(nextWidth)
    }

    measure()
    const observer = new ResizeObserver(measure)
    if (containerRef.current) observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as unknown
      if (isValidLayout(parsed)) {
        setLayout(cloneLayout(parsed))
      }
    } catch {
      // ignore bad persisted layout
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout))
    } catch {
      // ignore persistence errors
    }
  }, [layout])

  useEffect(() => {
    if (prevAutoAlignRef.current === autoAlign) return
    prevAutoAlignRef.current = autoAlign
    if (autoAlign) {
      setLayout((current) => gravityCompact(current))
    }
  }, [autoAlign])

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const currentInteraction = interactionRef.current
      const currentColWidth = colWidthRef.current
      if (!currentInteraction || !containerRef.current || currentColWidth <= 0) return

      const containerBounds = containerRef.current.getBoundingClientRect()
      const pointerX = event.clientX - containerBounds.left
      const pointerY = event.clientY - containerBounds.top
      const maxWidth = containerRef.current.clientWidth

      if (currentInteraction.type === "drag") {
        const nextRect: DraftRect = {
          left: Math.max(
            0,
            Math.min(maxWidth - currentInteraction.originRect.width, pointerX - currentInteraction.offsetX),
          ),
          top: Math.max(0, pointerY - currentInteraction.offsetY),
          width: currentInteraction.originRect.width,
          height: currentInteraction.originRect.height,
        }
        const nextGhost = rectToGrid(nextRect, currentInteraction.original, currentColWidth)
        setDraftRect(nextRect)
        setGhostItem(nextGhost)
        return
      }

      const deltaX = event.clientX - currentInteraction.startMouseX
      const deltaY = event.clientY - currentInteraction.startMouseY
      const minRect = itemRect({ ...currentInteraction.original, ...MIN_SIZE[currentInteraction.id] }, currentColWidth)
      const nextRect = { ...currentInteraction.originRect }

      if (currentInteraction.handle.includes("e")) {
        nextRect.width = Math.max(minRect.width, currentInteraction.originRect.width + deltaX)
      }
      if (currentInteraction.handle.includes("s")) {
        nextRect.height = Math.max(minRect.height, currentInteraction.originRect.height + deltaY)
      }
      if (currentInteraction.handle.includes("w")) {
        const nextLeft = Math.min(
          currentInteraction.originRect.left + currentInteraction.originRect.width - minRect.width,
          Math.max(0, currentInteraction.originRect.left + deltaX),
        )
        nextRect.width = currentInteraction.originRect.width + (currentInteraction.originRect.left - nextLeft)
        nextRect.left = nextLeft
      }
      if (currentInteraction.handle.includes("n")) {
        const nextTop = Math.min(
          currentInteraction.originRect.top + currentInteraction.originRect.height - minRect.height,
          Math.max(0, currentInteraction.originRect.top + deltaY),
        )
        nextRect.height = currentInteraction.originRect.height + (currentInteraction.originRect.top - nextTop)
        nextRect.top = nextTop
      }

      nextRect.width = Math.min(nextRect.width, maxWidth - nextRect.left)

      const nextGhost = rectToGrid(nextRect, currentInteraction.original, currentColWidth)
      setDraftRect(nextRect)
      setGhostItem(nextGhost)
    }

    const handleMouseUp = () => {
      const currentInteraction = interactionRef.current
      const nextGhost = ghostRef.current
      if (!currentInteraction) return

      if (nextGhost) {
        let nextLayout = layoutRef.current.map((item) =>
          item.id === currentInteraction.id ? { ...item, ...nextGhost } : item,
        )
        nextLayout = autoAlignRef.current
          ? gravityCompact(nextLayout)
          : pushDown(nextLayout, currentInteraction.id)
        setLayout(nextLayout)
      }

      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      setInteraction(null)
      setDraftRect(null)
      setGhostItem(null)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  const beginDrag = (event: React.MouseEvent, item: WidgetPlacement) => {
    if ((event.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) return
    if ((event.target as HTMLElement).closest('[data-resize-handle="true"]')) return

    const currentColWidth = colWidthRef.current
    if (!containerRef.current || currentColWidth <= 0) return

    event.preventDefault()
    const bounds = containerRef.current.getBoundingClientRect()
    const rect = itemRect(item, currentColWidth)

    document.body.style.cursor = "grabbing"
    document.body.style.userSelect = "none"
    setInteraction({
      type: "drag",
      id: item.id,
      original: item,
      originRect: rect,
      offsetX: event.clientX - bounds.left - rect.left,
      offsetY: event.clientY - bounds.top - rect.top,
    })
    setDraftRect(rect)
    setGhostItem(item)
  }

  const beginResize = (event: React.MouseEvent, item: WidgetPlacement, handle: ResizeHandle) => {
    const currentColWidth = colWidthRef.current
    if (!containerRef.current || currentColWidth <= 0) return

    event.preventDefault()
    event.stopPropagation()

    document.body.style.cursor = "grabbing"
    document.body.style.userSelect = "none"
    const rect = itemRect(item, currentColWidth)

    setInteraction({
      type: "resize",
      id: item.id,
      handle,
      original: item,
      originRect: rect,
      startMouseX: event.clientX,
      startMouseY: event.clientY,
    })
    setDraftRect(rect)
    setGhostItem(item)
  }

  const itemsForHeight = ghostItem
    ? layout.map((item) => (item.id === ghostItem.id ? ghostItem : item))
    : layout
  const totalRows = Math.max(...itemsForHeight.map((item) => item.y + item.h))
  const canvasHeight = totalRows * ROW_H + (totalRows - 1) * GAP + GAP * 2

  return (
    <div ref={containerRef} className="relative min-w-0" style={{ height: canvasHeight }}>
      {ghostItem && colWidth > 0 ? (
        <div
          className="pointer-events-none absolute rounded-[24px] border-2 border-dashed border-gray-300 bg-gray-100/70"
          style={{
            ...itemRect(ghostItem, colWidth),
            zIndex: 30,
            transition: "left 90ms ease, top 90ms ease, width 90ms ease, height 90ms ease",
          }}
        />
      ) : null}

      {colWidth > 0 &&
        layout.map((item) => {
          const active = interaction?.id === item.id
          const frame = active && draftRect ? draftRect : itemRect(item, colWidth)

          return (
            <div
              key={item.id}
              className="absolute"
              style={{
                left: frame.left,
                top: frame.top,
                width: frame.width,
                height: frame.height,
                zIndex: active ? 60 : 1,
                transition: active
                  ? "none"
                  : "left 320ms cubic-bezier(0.22, 1, 0.36, 1), top 320ms cubic-bezier(0.22, 1, 0.36, 1), width 320ms cubic-bezier(0.22, 1, 0.36, 1), height 320ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms ease, filter 220ms ease",
                transform: active ? "scale(1.012)" : "scale(1)",
                filter: active
                  ? "drop-shadow(0 18px 48px rgba(15,23,42,0.16))"
                  : "drop-shadow(0 8px 24px rgba(15,23,42,0.06))",
              }}
            >
              <div
                className="group relative h-full w-full cursor-grab overflow-visible rounded-[24px] active:cursor-grabbing"
                onMouseDown={(event) => beginDrag(event, item)}
              >
                <div className="pointer-events-none absolute inset-0 rounded-[24px] border border-transparent transition group-hover:border-gray-300" />

                {RESIZE_HANDLES.map((edge) => (
                  <div
                    key={`${item.id}-${edge.handle}`}
                    data-resize-handle="true"
                    onMouseDown={(event) => beginResize(event, item, edge.handle)}
                    className={`absolute z-30 opacity-0 transition group-hover:opacity-100 ${edge.className}`}
                  />
                ))}

                <div className="h-full w-full overflow-hidden rounded-[24px]">
                  <WidgetContent id={item.id} stats={stats} />
                </div>
              </div>
            </div>
          )
        })}
    </div>
  )
}
