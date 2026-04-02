"use client"

import { useEffect, useRef, useState } from "react"

type PosMap = Record<string, { x: number; y: number }>
type HiddenMap = Record<string, boolean>
type SizeMap = Record<string, "sm" | "md" | "lg">
type DuplicateItem = { id: string; sourceId: string; x: number; y: number; size: "sm" | "md" | "lg" }

const STORAGE_KEY = "pm-dashboard-free-move-v1"
const HIDDEN_KEY  = "pm-dashboard-hidden-widgets-v1"
const SIZE_KEY    = "pm-dashboard-widget-size-v1"
const PIN_KEY     = "pm-dashboard-pin-order-v1"
const DUP_KEY     = "pm-dashboard-duplicates-v1"
const GRID        = 16
const GAP         = 10   // padding between pushed widgets
const PUSH_PASSES = 4    // collision resolution iterations

// ─── localStorage helpers ─────────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch { return fallback }
}

// ─── Collision helpers ────────────────────────────────────────────────────────

function snap(v: number) { return Math.round(v / GRID) * GRID }

/** Push all non-active widgets away from each other after the active one moved. */
function resolveCollisions(
  activeId: string,
  nodes: HTMLElement[],
  posMap: PosMap,
) {
  const visible = nodes.filter(n => n.style.display !== "none")

  for (let pass = 0; pass < PUSH_PASSES; pass++) {
    let pushed = false

    for (let i = 0; i < visible.length; i++) {
      const a = visible[i]

      for (let j = 0; j < visible.length; j++) {
        if (i === j) continue
        const b = visible[j]
        const idB = b.dataset.freeMoveId!
        if (idB === activeId) continue // never push the dragged widget

        const rA = a.getBoundingClientRect()
        const rB = b.getBoundingClientRect()

        const ox = Math.min(rA.right, rB.right) - Math.max(rA.left, rB.left)
        const oy = Math.min(rA.bottom, rB.bottom) - Math.max(rA.top, rB.top)
        if (ox <= 2 || oy <= 2) continue

        const posB = posMap[idB] ?? { x: 0, y: 0 }

        if (ox < oy) {
          const dir = rB.left >= rA.left ? 1 : -1
          posMap[idB] = { x: snap(posB.x + dir * (ox + GAP)), y: posB.y }
        } else {
          const dir = rB.top >= rA.top ? 1 : -1
          posMap[idB] = { x: posB.x, y: snap(posB.y + dir * (oy + GAP)) }
        }
        b.style.transform = `translate(${posMap[idB].x}px, ${posMap[idB].y}px)`
        pushed = true
      }
    }

    if (!pushed) break
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FreeMoveCanvas() {
  const [hiddenCount, setHiddenCount] = useState(0)
  const posMapRef     = useRef<PosMap>({})
  const hiddenMapRef  = useRef<HiddenMap>({})
  const sizeMapRef    = useRef<SizeMap>({})
  const pinOrderRef   = useRef<string[]>([])
  const duplicatesRef = useRef<DuplicateItem[]>([])
  const historyRef    = useRef<string[]>([])
  // track which node is dragging so mousemove cursor logic knows
  const draggingRef   = useRef(false)

  const pushHistory = () => {
    const raw = JSON.stringify({
      posMap: posMapRef.current,
      hiddenMap: hiddenMapRef.current,
      sizeMap: sizeMapRef.current,
      pinOrder: pinOrderRef.current,
      duplicates: duplicatesRef.current,
    })
    historyRef.current = [raw, ...historyRef.current].slice(0, 30)
  }

  const restoreFromRaw = (raw: string) => {
    try {
      const p = JSON.parse(raw)
      posMapRef.current     = p.posMap ?? {}
      hiddenMapRef.current  = p.hiddenMap ?? {}
      sizeMapRef.current    = p.sizeMap ?? {}
      pinOrderRef.current   = p.pinOrder ?? []
      duplicatesRef.current = p.duplicates ?? []
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posMapRef.current))
      localStorage.setItem(HIDDEN_KEY,  JSON.stringify(hiddenMapRef.current))
      localStorage.setItem(SIZE_KEY,    JSON.stringify(sizeMapRef.current))
      localStorage.setItem(PIN_KEY,     JSON.stringify(pinOrderRef.current))
      localStorage.setItem(DUP_KEY,     JSON.stringify(duplicatesRef.current))
      window.location.reload()
    } catch {}
  }

  useEffect(() => {
    const posMap     = load<PosMap>(STORAGE_KEY, {})
    const hiddenMap  = load<HiddenMap>(HIDDEN_KEY, {})
    const sizeMap    = load<SizeMap>(SIZE_KEY, {})
    const pinOrder   = load<string[]>(PIN_KEY, [])
    const duplicates = load<DuplicateItem[]>(DUP_KEY, [])

    posMapRef.current     = posMap
    hiddenMapRef.current  = hiddenMap
    sizeMapRef.current    = sizeMap
    pinOrderRef.current   = pinOrder
    duplicatesRef.current = duplicates

    // ── Restore duplicate clones ──────────────────────────────────────────
    const sourceNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-free-move-id]"))
    for (const dup of duplicatesRef.current) {
      if (document.querySelector(`[data-free-move-id="${dup.id}"]`)) continue
      const source = sourceNodes.find(n => n.dataset.freeMoveId === dup.sourceId)
      if (!source?.parentElement) continue
      const clone = source.cloneNode(true) as HTMLElement
      clone.dataset.freeMoveId = dup.id
      clone.style.transform    = `translate(${dup.x}px, ${dup.y}px)`
      clone.dataset.widgetSize = dup.size
      source.parentElement.insertBefore(clone, source.nextSibling)
      posMapRef.current[dup.id] = { x: dup.x, y: dup.y }
      sizeMapRef.current[dup.id] = dup.size
    }

    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-free-move-id]"))

    // ── Restore pin order ─────────────────────────────────────────────────
    for (let i = pinOrderRef.current.length - 1; i >= 0; i--) {
      const id   = pinOrderRef.current[i]
      const node = nodes.find(n => n.dataset.freeMoveId === id)
      if (node?.parentElement) node.parentElement.prepend(node)
    }

    // ── Apply saved state to DOM ──────────────────────────────────────────
    for (const node of nodes) {
      const id = node.dataset.freeMoveId
      if (!id) continue
      if (hiddenMap[id]) node.style.display = "none"
      node.style.willChange  = "transform"
      node.style.transition  = "box-shadow 120ms ease, transform 80ms ease"
      const p = posMap[id]
      if (p) node.style.transform = `translate(${p.x}px, ${p.y}px)`
      node.dataset.widgetSize = sizeMap[id] ?? "lg"
    }

    setHiddenCount(Object.values(hiddenMap).filter(Boolean).length)

    // ─────────────────────────────────────────────────────────────────────
    // DRAG LOGIC — always on, no editMode gate
    // ─────────────────────────────────────────────────────────────────────
    type Active = { el: HTMLElement; id: string; startX: number; startY: number; baseX: number; baseY: number }
    let active: Active | null = null

    const NON_DRAG_SELECTOR = "a,button,input,textarea,select,summary,[data-widget-menu],[data-widget-action]"
    const TEXT_SELECTOR     = "p,span,h1,h2,h3,h4,h5,h6,li,td,th,label,svg,img,em,strong,small,time"

    const isInteractive = (t: HTMLElement | null) => Boolean(t?.closest(NON_DRAG_SELECTOR))
    const isTextOrIcon  = (t: HTMLElement | null) => Boolean(t?.closest(TEXT_SELECTOR))

    // ── Cursor management ─────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      if (draggingRef.current) return
      const target = e.target as HTMLElement | null
      const widget = target?.closest("[data-free-move-id]") as HTMLElement | null
      // Reset all widget cursors first
      for (const n of nodes) { if (n !== widget) n.style.cursor = "default" }
      if (!widget) return
      if (isInteractive(target) || isTextOrIcon(target)) {
        widget.style.cursor = "default"
      } else {
        widget.style.cursor = "grab"
      }
    }

    // ── Pointer events ────────────────────────────────────────────────────
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      const el = target?.closest("[data-free-move-id]") as HTMLElement | null
      if (!el) return
      if (isInteractive(target)) return
      // Allow drag from any non-interactive area (not just data-drag-zone="blank")
      const id = el.dataset.freeMoveId
      if (!id) return

      pushHistory()
      const base = posMapRef.current[id] ?? { x: 0, y: 0 }
      active = { el, id, startX: e.clientX, startY: e.clientY, baseX: base.x, baseY: base.y }
      draggingRef.current = true
      el.style.boxShadow = "0 20px 50px rgba(15,23,42,0.14)"
      el.style.zIndex    = "20"
      el.style.cursor    = "grabbing"
      el.style.transition = "box-shadow 120ms ease"
      e.preventDefault()
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!active) return
      let x = snap(active.baseX + (e.clientX - active.startX))
      let y = snap(active.baseY + (e.clientY - active.startY))

      // Snap to sibling edges
      const SNAP_THRESHOLD = 10
      for (const [id, pos] of Object.entries(posMapRef.current)) {
        if (id === active.id) continue
        if (Math.abs(x - pos.x) <= SNAP_THRESHOLD) x = pos.x
        if (Math.abs(y - pos.y) <= SNAP_THRESHOLD) y = pos.y
      }

      active.el.style.transform = `translate(${x}px, ${y}px)`
      posMapRef.current[active.id] = { x, y }

      // Push colliding widgets away
      resolveCollisions(active.id, nodes, posMapRef.current)
    }

    const onPointerUp = () => {
      if (!active) return
      active.el.style.boxShadow = ""
      active.el.style.zIndex    = ""
      active.el.style.cursor    = "grab"
      active.el.style.transition = "box-shadow 120ms ease, transform 80ms ease"
      // Save all positions (including pushed ones)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posMapRef.current))
      draggingRef.current = false
      active = null
    }

    // ── Widget action clicks ──────────────────────────────────────────────
    const onClick = (e: MouseEvent) => {
      const target    = e.target as HTMLElement | null
      const actionEl  = target?.closest("[data-widget-action]") as HTMLElement | null
      if (!actionEl) return
      const action    = actionEl.dataset.widgetAction
      const owner     = actionEl.closest("[data-free-move-id]") as HTMLElement | null
      const id        = owner?.dataset.freeMoveId
      if (!id || !owner || !action) return

      pushHistory()

      if (action === "close") {
        e.preventDefault()
        owner.style.display = "none"
        hiddenMapRef.current[id] = true
        localStorage.setItem(HIDDEN_KEY, JSON.stringify(hiddenMapRef.current))
        setHiddenCount(Object.values(hiddenMapRef.current).filter(Boolean).length)
        return
      }

      if (action === "delete-duplicate") {
        e.preventDefault()
        if (!id.includes("-copy-")) return
        owner.remove()
        delete posMapRef.current[id]
        delete hiddenMapRef.current[id]
        delete sizeMapRef.current[id]
        pinOrderRef.current   = pinOrderRef.current.filter(v => v !== id)
        duplicatesRef.current = duplicatesRef.current.filter(d => d.id !== id)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posMapRef.current))
        localStorage.setItem(HIDDEN_KEY,  JSON.stringify(hiddenMapRef.current))
        localStorage.setItem(SIZE_KEY,    JSON.stringify(sizeMapRef.current))
        localStorage.setItem(PIN_KEY,     JSON.stringify(pinOrderRef.current))
        localStorage.setItem(DUP_KEY,     JSON.stringify(duplicatesRef.current))
        setHiddenCount(Object.values(hiddenMapRef.current).filter(Boolean).length)
        return
      }

      if (action === "size-sm" || action === "size-md" || action === "size-lg") {
        const size = action.replace("size-", "") as "sm" | "md" | "lg"
        owner.dataset.widgetSize = size
        sizeMapRef.current[id]   = size
        localStorage.setItem(SIZE_KEY, JSON.stringify(sizeMapRef.current))
        return
      }

      if (action === "pin-top") {
        e.preventDefault()
        const parent = owner.parentElement
        if (!parent) return
        parent.prepend(owner)
        owner.style.transform = ""
        delete posMapRef.current[id]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posMapRef.current))
        pinOrderRef.current = [id, ...pinOrderRef.current.filter(v => v !== id)].slice(0, 50)
        localStorage.setItem(PIN_KEY, JSON.stringify(pinOrderRef.current))
        return
      }

      if (action === "duplicate") {
        e.preventDefault()
        const parent = owner.parentElement
        if (!parent) return
        const sourceId = owner.dataset.sourceId || id
        const clone    = owner.cloneNode(true) as HTMLElement
        const newId    = `${sourceId}-copy-${Date.now()}`
        clone.dataset.freeMoveId = newId
        clone.dataset.sourceId   = sourceId
        clone.style.display = ""
        parent.insertBefore(clone, owner.nextSibling)
        const srcPos = posMapRef.current[id] ?? { x: 0, y: 0 }
        const pos    = { x: srcPos.x + 24, y: srcPos.y + 24 }
        clone.style.transform     = `translate(${pos.x}px, ${pos.y}px)`
        posMapRef.current[newId]  = pos
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posMapRef.current))
        const size = (owner.dataset.widgetSize as "sm" | "md" | "lg") ?? "lg"
        clone.dataset.widgetSize  = size
        sizeMapRef.current[newId] = size
        localStorage.setItem(SIZE_KEY, JSON.stringify(sizeMapRef.current))
        duplicatesRef.current = [
          { id: newId, sourceId, x: pos.x, y: pos.y, size },
          ...duplicatesRef.current.filter(d => d.id !== newId),
        ].slice(0, 30)
        localStorage.setItem(DUP_KEY, JSON.stringify(duplicatesRef.current))
        return
      }
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("click", onClick)

    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("click", onClick)
    }
  }, [])

  // ─── Toolbar actions ───────────────────────────────────────────────────────

  const restoreAllHidden = () => {
    pushHistory()
    hiddenMapRef.current = {}
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(hiddenMapRef.current))
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-free-move-id]"))
    for (const node of nodes) node.style.display = ""
    setHiddenCount(0)
  }

  const alignAll = () => {
    pushHistory()
    posMapRef.current = {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posMapRef.current))
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-free-move-id]"))
    for (const node of nodes) node.style.transform = ""
  }

  const resetAll = () => {
    pushHistory()
    posMapRef.current     = {}
    hiddenMapRef.current  = {}
    sizeMapRef.current    = {}
    pinOrderRef.current   = []
    duplicatesRef.current = []
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(HIDDEN_KEY)
    localStorage.removeItem(SIZE_KEY)
    localStorage.removeItem(PIN_KEY)
    localStorage.removeItem(DUP_KEY)
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-free-move-id]"))
    for (const node of nodes) {
      node.style.transform    = ""
      node.style.display      = ""
      node.dataset.widgetSize = "lg"
    }
    setHiddenCount(0)
  }

  const undo = () => {
    const prev = historyRef.current.shift()
    if (prev) restoreFromRaw(prev)
  }

  return (
    <div className="canvas-toolbar fixed right-6 bottom-6 z-40 rounded-2xl bg-white/90 backdrop-blur px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2 text-xs">
        <button onClick={undo} className="px-2.5 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50" title="撤销">↩ 撤销</button>
        <button onClick={alignAll} className="px-2.5 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50">对齐</button>
        <button onClick={restoreAllHidden} className="px-2.5 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50">
          显示全部{hiddenCount > 0 ? `(${hiddenCount})` : ""}
        </button>
        <button onClick={resetAll} className="px-2.5 py-1 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50">重置</button>
      </div>
    </div>
  )
}
