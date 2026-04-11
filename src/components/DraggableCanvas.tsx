"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Users } from "lucide-react"
import {
  AIChatWidget,
  ContributionWidget,
  NeedsMaintenanceWidget,
  NetworkTrendWidget,
  StatCard,
  TodayExpandWidget,
  TraitsSummaryWidget,
  type DashboardStats,
} from "./DashboardWidgets"

const COLS = 12
const ROW_H = 56
const GAP = 16
const LAYOUT_STORAGE_KEY = "dashboard-layout-v8"
const LAYOUT_TEMPLATE_KEY = "dashboard-layout-template-v4"
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
  ai: { w: 8, h: 4 },
  today: { w: 4, h: 4 },
  st1: { w: 4, h: 4 },
  st3: { w: 6, h: 4 },
  contrib: { w: 6, h: 4 },
  traits: { w: 6, h: 8 },
  trend: { w: 6, h: 4 },
}

const DEFAULT_LAYOUT: WidgetPlacement[] = [
  { id: "ai", x: 0, y: 0, w: 8, h: 4 },
  { id: "st1", x: 8, y: 0, w: 4, h: 4 },
  { id: "today", x: 0, y: 4, w: 4, h: 4 },
  { id: "st3", x: 4, y: 4, w: 8, h: 4 },
  { id: "contrib", x: 0, y: 8, w: 6, h: 4 },
  { id: "traits", x: 6, y: 8, w: 6, h: 8 },
  { id: "trend", x: 0, y: 12, w: 6, h: 4 },
]

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

const MOBILE_WIDGET_ORDER: Array<{ id: WidgetId; className: string }> = [
  { id: "today", className: "h-[216px]" },
  { id: "ai", className: "h-[336px]" },
  { id: "st1", className: "h-[172px]" },
  { id: "contrib", className: "h-[248px]" },
  { id: "st3", className: "h-[296px]" },
  { id: "trend", className: "h-[284px]" },
  { id: "traits", className: "h-[318px]" },
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

function overlaps(a: WidgetPlacement, b: WidgetPlacement) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function clampPlacement(item: WidgetPlacement): WidgetPlacement {
  const min = MIN_SIZE[item.id]
  const w = Math.max(min.w, Math.min(COLS, Math.round(item.w)))
  const h = Math.max(min.h, Math.round(item.h))
  const x = Math.max(0, Math.min(COLS - w, Math.round(item.x)))
  const y = Math.max(0, Math.round(item.y))
  return { ...item, x, y, w, h }
}

function sanitizeLayout(layout: WidgetPlacement[]): WidgetPlacement[] {
  return layout.map(clampPlacement)
}

function canPlaceWithoutOverlap(
  layout: WidgetPlacement[],
  itemId: WidgetId,
  candidate: WidgetPlacement,
) {
  return !layout.some((item) => item.id !== itemId && overlaps(item, candidate))
}

function itemRect(item: WidgetPlacement, colWidth: number): DraftRect {
  return {
    left: item.x * (colWidth + GAP),
    top: item.y * (ROW_H + GAP),
    width: item.w * colWidth + (item.w - 1) * GAP,
    height: item.h * ROW_H + (item.h - 1) * GAP,
  }
}

function rectToGrid(
  rect: DraftRect,
  original: WidgetPlacement,
  colWidth: number,
): WidgetPlacement {
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
              <span className="rounded-full bg-gray-100 px-2.5 py-[5px] text-[10px] text-gray-600">
                {`较上周${trendDir(stats.total, stats.prevWeekTotal) === "up" ? "增加" : "减少"} ${trendPct(
                  stats.total,
                  stats.prevWeekTotal,
                )}%`}
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

export function DraggableCanvas() {
  const [layout, setLayout] = useState<WidgetPlacement[]>(() =>
    cloneLayout(DEFAULT_LAYOUT),
  )
  const [colWidth, setColWidth] = useState(0)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [interaction, setInteraction] = useState<ActiveInteraction | null>(null)
  const [draftRect, setDraftRect] = useState<DraftRect | null>(null)
  const [ghostItem, setGhostItem] = useState<WidgetPlacement | null>(null)
  const [isMobileViewport, setIsMobileViewport] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const layoutRef = useRef(layout)
  const colWidthRef = useRef(colWidth)
  const interactionRef = useRef<ActiveInteraction | null>(null)
  const ghostRef = useRef<WidgetPlacement | null>(null)

  layoutRef.current = layout
  colWidthRef.current = colWidth
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
      const nextWidth =
        (containerRef.current.clientWidth - (COLS - 1) * GAP) / COLS
      setColWidth(nextWidth)
    }

    measure()
    const observer = new ResizeObserver(measure)
    if (containerRef.current) observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)")
    const apply = () => setIsMobileViewport(media.matches)
    apply()
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", apply)
      return () => media.removeEventListener("change", apply)
    }
    media.addListener(apply)
    return () => media.removeListener(apply)
  }, [])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY)
      const templateRaw = window.localStorage.getItem(LAYOUT_TEMPLATE_KEY)
      const fallbackLayout = (() => {
        if (!templateRaw) return sanitizeLayout(cloneLayout(DEFAULT_LAYOUT))
        const templateParsed = JSON.parse(templateRaw) as unknown
        return isValidLayout(templateParsed)
          ? sanitizeLayout(cloneLayout(templateParsed))
          : sanitizeLayout(cloneLayout(DEFAULT_LAYOUT))
      })()

      if (!raw) {
        setLayout(fallbackLayout)
        return
      }

      const parsed = JSON.parse(raw) as unknown
      setLayout(
        isValidLayout(parsed)
          ? sanitizeLayout(cloneLayout(parsed))
          : fallbackLayout,
      )
    } catch {
      setLayout(sanitizeLayout(cloneLayout(DEFAULT_LAYOUT)))
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout))
      // Persist latest arrangement as the template default for subsequent sessions/resets.
      window.localStorage.setItem(LAYOUT_TEMPLATE_KEY, JSON.stringify(layout))
    } catch {
      // ignore persistence errors
    }
  }, [layout])

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const currentInteraction = interactionRef.current
      const currentColWidth = colWidthRef.current
      if (!currentInteraction || !containerRef.current || currentColWidth <= 0) {
        return
      }

      const containerBounds = containerRef.current.getBoundingClientRect()
      const pointerX = event.clientX - containerBounds.left
      const pointerY = event.clientY - containerBounds.top
      const maxWidth = containerRef.current.clientWidth

      if (currentInteraction.type === "drag") {
        const nextRect: DraftRect = {
          left: Math.max(
            0,
            Math.min(
              maxWidth - currentInteraction.originRect.width,
              pointerX - currentInteraction.offsetX,
            ),
          ),
          top: Math.max(0, pointerY - currentInteraction.offsetY),
          width: currentInteraction.originRect.width,
          height: currentInteraction.originRect.height,
        }
        const nextGhost = rectToGrid(
          nextRect,
          currentInteraction.original,
          currentColWidth,
        )
        setDraftRect(itemRect(nextGhost, currentColWidth))
        setGhostItem(nextGhost)
        return
      }

      const deltaX = event.clientX - currentInteraction.startMouseX
      const deltaY = event.clientY - currentInteraction.startMouseY
      const minRect = itemRect(
        { ...currentInteraction.original, ...MIN_SIZE[currentInteraction.id] },
        currentColWidth,
      )
      const nextRect = { ...currentInteraction.originRect }

      if (currentInteraction.handle.includes("e")) {
        nextRect.width = Math.max(
          minRect.width,
          currentInteraction.originRect.width + deltaX,
        )
      }
      if (currentInteraction.handle.includes("s")) {
        nextRect.height = Math.max(
          minRect.height,
          currentInteraction.originRect.height + deltaY,
        )
      }
      if (currentInteraction.handle.includes("w")) {
        const nextLeft = Math.min(
          currentInteraction.originRect.left +
            currentInteraction.originRect.width -
            minRect.width,
          Math.max(0, currentInteraction.originRect.left + deltaX),
        )
        nextRect.width =
          currentInteraction.originRect.width +
          (currentInteraction.originRect.left - nextLeft)
        nextRect.left = nextLeft
      }
      if (currentInteraction.handle.includes("n")) {
        const nextTop = Math.min(
          currentInteraction.originRect.top +
            currentInteraction.originRect.height -
            minRect.height,
          Math.max(0, currentInteraction.originRect.top + deltaY),
        )
        nextRect.height =
          currentInteraction.originRect.height +
          (currentInteraction.originRect.top - nextTop)
        nextRect.top = nextTop
      }

      nextRect.width = Math.min(nextRect.width, maxWidth - nextRect.left)
      const nextGhost = rectToGrid(
        nextRect,
        currentInteraction.original,
        currentColWidth,
      )
      setDraftRect(itemRect(nextGhost, currentColWidth))
      setGhostItem(nextGhost)
    }

    const handleMouseUp = () => {
      const currentInteraction = interactionRef.current
      const nextGhost = ghostRef.current
      if (!currentInteraction) return

      if (nextGhost) {
        const sanitizedGhost = sanitizeLayout([nextGhost])[0]
        const currentLayout = layoutRef.current
        const nextLayout = currentLayout.map((item) =>
          item.id === currentInteraction.id ? { ...item, ...sanitizedGhost } : item,
        )

        if (canPlaceWithoutOverlap(currentLayout, currentInteraction.id, sanitizedGhost)) {
          setLayout(nextLayout)
        }
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

  const beginResize = (
    event: React.MouseEvent,
    item: WidgetPlacement,
    handle: ResizeHandle,
  ) => {
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

  if (isMobileViewport) {
    return (
      <div className="flex min-w-0 flex-col gap-1">
        {MOBILE_WIDGET_ORDER.map((item) => (
          <section key={`mobile-${item.id}`} className={item.className}>
            <WidgetContent id={item.id} stats={stats} />
          </section>
        ))}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative min-w-0 overflow-hidden"
      style={{ height: canvasHeight }}
    >
      {ghostItem && colWidth > 0 ? (
        <div
          className="pointer-events-none absolute rounded-[24px] border-2 border-dashed border-gray-300 bg-gray-100/70"
          style={{
            ...itemRect(ghostItem, colWidth),
            zIndex: 30,
            transition: "none",
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
                transition: "none",
                filter: active
                  ? "drop-shadow(0 8px 16px rgba(15,23,42,0.10))"
                  : "drop-shadow(0 4px 12px rgba(15,23,42,0.06))",
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
