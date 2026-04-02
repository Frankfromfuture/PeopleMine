"use client"

import { useEffect, useRef, useState } from "react"

type PosMap = Record<string, { x: number; y: number }>
type HiddenMap = Record<string, boolean>
type SizeMap = Record<string, "sm" | "md" | "lg">
type DuplicateItem = { id: string; sourceId: string; x: number; y: number; size: "sm" | "md" | "lg" }

const STORAGE_KEY = "pm-dashboard-free-move-v1"
const HIDDEN_KEY = "pm-dashboard-hidden-widgets-v1"
const SIZE_KEY = "pm-dashboard-widget-size-v1"
const PIN_KEY = "pm-dashboard-pin-order-v1"
const DUP_KEY = "pm-dashboard-duplicates-v1"

function loadPosMap(): PosMap {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
    return parsed && typeof parsed === "object" ? (parsed as PosMap) : {}
  } catch {
    return {}
  }
}

function loadHiddenMap(): HiddenMap {
  try {
    const parsed = JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? "{}")
    return parsed && typeof parsed === "object" ? (parsed as HiddenMap) : {}
  } catch {
    return {}
  }
}

function loadSizeMap(): SizeMap {
  try {
    const parsed = JSON.parse(localStorage.getItem(SIZE_KEY) ?? "{}")
    return parsed && typeof parsed === "object" ? (parsed as SizeMap) : {}
  } catch {
    return {}
  }
}

function loadPinOrder(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(PIN_KEY) ?? "[]")
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

function loadDuplicates(): DuplicateItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(DUP_KEY) ?? "[]")
    return Array.isArray(parsed) ? (parsed as DuplicateItem[]) : []
  } catch {
    return []
  }
}

export default function FreeMoveCanvas() {
  const [editMode, setEditMode] = useState(false)
  const [hiddenCount, setHiddenCount] = useState(0)
  const [guide, setGuide] = useState<{ x: number | null; y: number | null }>({ x: null, y: null })
  const posMapRef = useRef<PosMap>({})
  const hiddenMapRef = useRef<HiddenMap>({})
  const sizeMapRef = useRef<SizeMap>({})
  const pinOrderRef = useRef<string[]>([])
  const duplicatesRef = useRef<DuplicateItem[]>([])
  const historyRef = useRef<string[]>([])

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
      const parsed = JSON.parse(raw) as {
        posMap: PosMap
        hiddenMap: HiddenMap
        sizeMap: SizeMap
        pinOrder: string[]
        duplicates: DuplicateItem[]
      }
      posMapRef.current = parsed.posMap ?? {}
      hiddenMapRef.current = parsed.hiddenMap ?? {}
      sizeMapRef.current = parsed.sizeMap ?? {}
      pinOrderRef.current = parsed.pinOrder ?? []
      duplicatesRef.current = parsed.duplicates ?? []
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posMapRef.current))
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(hiddenMapRef.current))
      localStorage.setItem(SIZE_KEY, JSON.stringify(sizeMapRef.current))
      localStorage.setItem(PIN_KEY, JSON.stringify(pinOrderRef.current))
      localStorage.setItem(DUP_KEY, JSON.stringify(duplicatesRef.current))
      window.location.reload()
    } catch {}
  }

  useEffect(() => {
    const posMap = loadPosMap()
    const hiddenMap = loadHiddenMap()
    const sizeMap = loadSizeMap()
    const pinOrder = loadPinOrder()
    const duplicates = loadDuplicates()

    posMapRef.current = posMap
    hiddenMapRef.current = hiddenMap
    sizeMapRef.current = sizeMap
    pinOrderRef.current = pinOrder
    duplicatesRef.current = duplicates

    const sourceNodes = Array.from(document.querySelectorAll<HTMLElement>("[data-free-move-id]"))

    for (const dup of duplicatesRef.current) {
      if (document.querySelector(`[data-free-move-id="${dup.id}"]`)) continue
      const source = sourceNodes.find((n) => n.dataset.freeMoveId === dup.sourceId)
      if (!source || !source.parentElement) continue
      const clone = source.cloneNode(true) as HTMLElement
      clone.dataset.freeMoveId = dup.id
      clone.style.transform = `translate(${dup.x}px, ${dup.y}px)`
      clone.dataset.widgetSize = dup.size
      source.parentElement.insertBefore(clone, source.nextSibling)
      posMapRef.current[dup.id] = { x: dup.x, y: dup.y }
      sizeMapRef.current[dup.id] = dup.size
    }

    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-free-move-id]"))

    for (let i = pinOrderRef.current.length - 1; i >= 0; i--) {
      const id = pinOrderRef.current[i]
      const node = nodes.find((n) => n.dataset.freeMoveId === id)
      const parent = node?.parentElement
      if (node && parent) parent.prepend(node)
    }

    for (const node of nodes) {
      const id = node.dataset.freeMoveId
      if (!id) continue

      if (hiddenMap[id]) node.style.display = "none"

      node.style.willChange = "transform"
      node.style.transition = "box-shadow 120ms ease"
      node.style.cursor = editMode ? "grab" : "default"

      const p = posMap[id]
      if (p) node.style.transform = `translate(${p.x}px, ${p.y}px)`

      const size = sizeMap[id] ?? "lg"
      node.dataset.widgetSize = size
    }

    setHiddenCount(Object.values(hiddenMap).filter(Boolean).length)

    let active: { el: HTMLElement; id: string; startX: number; startY: number; baseX: number; baseY: number } | null = null

    const SNAP = 12
    const GRID = 16

    const getSectionLanes = () => {
      const track = document.querySelector<HTMLElement>("[data-section-track]")
      if (!track) return [0]
      const lane = Math.max(280, Math.floor((track.clientWidth - 20) / 2))
      return [0, lane]
    }

    const isInteractiveTarget = (target: HTMLElement | null) =>
      Boolean(target?.closest("a,button,input,textarea,select,summary,[data-widget-menu],[data-widget-action]"))
    const onPointerDown = (e: PointerEvent) => {
      if (!editMode) return
      const target = e.target as HTMLElement | null
      const el = target?.closest("[data-free-move-id]") as HTMLElement | null
      if (!el) return

      const inBlankZone = Boolean(target?.closest('[data-drag-zone="blank"]'))
      if (!inBlankZone && isInteractiveTarget(target)) return

      const id = el.dataset.freeMoveId
      if (!id) return
      const base = posMapRef.current[id] ?? { x: 0, y: 0 }
      active = { el, id, startX: e.clientX, startY: e.clientY, baseX: base.x, baseY: base.y }
      el.style.boxShadow = "0 20px 50px rgba(15,23,42,0.12)"
      el.style.zIndex = "20"
      el.style.cursor = "grabbing"
      e.preventDefault()
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!active) return
      let x = active.baseX + (e.clientX - active.startX)
      let y = active.baseY + (e.clientY - active.startY)

      x = Math.round(x / GRID) * GRID
      y = Math.round(y / GRID) * GRID

      for (const [id, pos] of Object.entries(posMapRef.current)) {
        if (id === active.id) continue
        if (Math.abs(x - pos.x) <= SNAP) x = pos.x
        if (Math.abs(y - pos.y) <= SNAP) y = pos.y
      }

      for (const laneX of getSectionLanes()) {
        if (Math.abs(x - laneX) <= 20) x = laneX
      }

      active.el.style.transform = `translate(${x}px, ${y}px)`
      posMapRef.current[active.id] = { x, y }
      setGuide({ x, y })
    }

    const onPointerUp = () => {
      if (!active) return
      active.el.style.boxShadow = ""
      active.el.style.zIndex = ""
      active.el.style.cursor = editMode ? "grab" : "default"
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posMapRef.current))
      setGuide({ x: null, y: null })
      active = null
    }

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      const actionEl = target?.closest("[data-widget-action]") as HTMLElement | null
      if (!actionEl) return

      const action = actionEl.dataset.widgetAction
      const owner = actionEl.closest("[data-free-move-id]") as HTMLElement | null
      const id = owner?.dataset.freeMoveId
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
        pinOrderRef.current = pinOrderRef.current.filter((v) => v !== id)
        duplicatesRef.current = duplicatesRef.current.filter((d) => d.id !== id)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posMapRef.current))
        localStorage.setItem(HIDDEN_KEY, JSON.stringify(hiddenMapRef.current))
        localStorage.setItem(SIZE_KEY, JSON.stringify(sizeMapRef.current))
        localStorage.setItem(PIN_KEY, JSON.stringify(pinOrderRef.current))
        localStorage.setItem(DUP_KEY, JSON.stringify(duplicatesRef.current))
        setHiddenCount(Object.values(hiddenMapRef.current).filter(Boolean).length)
        return
      }

      if (action === "size-sm" || action === "size-md" || action === "size-lg") {
        const size = action.replace("size-", "") as "sm" | "md" | "lg"
        owner.dataset.widgetSize = size
        sizeMapRef.current[id] = size
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

        pinOrderRef.current = [id, ...pinOrderRef.current.filter((v) => v !== id)].slice(0, 50)
        localStorage.setItem(PIN_KEY, JSON.stringify(pinOrderRef.current))
        return
      }

      if (action === "duplicate") {
        e.preventDefault()
        const parent = owner.parentElement
        if (!parent) return

        const sourceId = owner.dataset.sourceId || id
        const clone = owner.cloneNode(true) as HTMLElement
        const newId = `${sourceId}-copy-${Date.now()}`
        clone.dataset.freeMoveId = newId
        clone.dataset.sourceId = sourceId
        clone.style.display = ""
        parent.insertBefore(clone, owner.nextSibling)

        const sourcePos = posMapRef.current[id] ?? { x: 0, y: 0 }
        const nextPos = { x: sourcePos.x + 24, y: sourcePos.y + 24 }
        clone.style.transform = `translate(${nextPos.x}px, ${nextPos.y}px)`
        posMapRef.current[newId] = nextPos
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posMapRef.current))

        const sourceSize = (owner.dataset.widgetSize as "sm" | "md" | "lg" | undefined) ?? "lg"
        clone.dataset.widgetSize = sourceSize
        sizeMapRef.current[newId] = sourceSize
        localStorage.setItem(SIZE_KEY, JSON.stringify(sizeMapRef.current))

        const newDup: DuplicateItem = { id: newId, sourceId, x: nextPos.x, y: nextPos.y, size: sourceSize }
        duplicatesRef.current = [newDup, ...duplicatesRef.current.filter((d) => d.id !== newId)].slice(0, 30)
        localStorage.setItem(DUP_KEY, JSON.stringify(duplicatesRef.current))
      }
    }

    window.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("click", onClick)

    return () => {
      window.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("click", onClick)
    }
  }, [editMode])

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
    posMapRef.current = {}
    hiddenMapRef.current = {}
    sizeMapRef.current = {}
    pinOrderRef.current = []
    duplicatesRef.current = []
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(HIDDEN_KEY)
    localStorage.removeItem(SIZE_KEY)
    localStorage.removeItem(PIN_KEY)
    localStorage.removeItem(DUP_KEY)
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-free-move-id]"))
    for (const node of nodes) {
      node.style.transform = ""
      node.style.display = ""
      node.dataset.widgetSize = "lg"
    }
    setGuide({ x: null, y: null })
    setHiddenCount(0)
  }

  return (
    <>
      {guide.x !== null && (
        <div
          className="pointer-events-none fixed inset-y-0 z-30 w-px bg-violet-400/40"
          style={{ left: `calc(2rem + ${guide.x}px)` }}
        />
      )}
      {guide.y !== null && (
        <div
          className="pointer-events-none fixed inset-x-0 z-30 h-px bg-violet-400/35"
          style={{ top: `${guide.y + 120}px` }}
        />
      )}

      <div className="fixed right-6 bottom-6 z-40 rounded-2xl border border-[#d6cec3] bg-white/90 backdrop-blur px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setEditMode((v) => !v)}
            className={`px-2.5 py-1 rounded-md border ${editMode ? "border-violet-300 bg-violet-50 text-violet-700" : "border-gray-200 text-gray-600"}`}
          >
            {editMode ? "结束编辑" : "编辑布局"}
          </button>
          <button onClick={alignAll} className="px-2.5 py-1 rounded-md border border-gray-200 text-gray-600">对齐</button>
          <button onClick={restoreAllHidden} className="px-2.5 py-1 rounded-md border border-gray-200 text-gray-600">
            显示全部{hiddenCount > 0 ? `(${hiddenCount})` : ""}
          </button>
          <button onClick={resetAll} className="px-2.5 py-1 rounded-md border border-rose-200 text-rose-600">重置</button>
        </div>
      </div>
    </>
  )
}
