'use client'

import { useEffect, useRef, useState } from 'react'

const MONO = '"Geist Mono", "SFMono-Regular", "Courier New", monospace'
const NODE_COUNT = 172
const PHI = (1 + Math.sqrt(5)) / 2
const NODE_CHARS = ['.', ':', '+', '*', 'o', 'x', '#', '@']
const EDGE_CHARS = ['.', '.', ':', '-', '=', '+']
const LATITUDE_LEVELS = [-0.76, -0.46, -0.16, 0.16, 0.46, 0.76]
const MOBILE_LATITUDE_LEVELS = [-0.46, -0.16, 0.16, 0.46]
const CHAR_SCALE_MULTIPLIER = 3

type QualityMode = 'desktop' | 'mobile' | 'auto'
type ResolvedQuality = Exclude<QualityMode, 'auto'>
type VariantMode = 'default' | 'light'

const BASE_NODES: [number, number, number][] = Array.from({ length: NODE_COUNT }, (_, index) => {
  const y = 1 - (index / (NODE_COUNT - 1)) * 2
  const radius = Math.sqrt(Math.max(0, 1 - y * y))
  const theta = 2 * Math.PI * (index / PHI)
  return [radius * Math.cos(theta), y, radius * Math.sin(theta)]
})

const CHAR_FOR = BASE_NODES.map((_, index) => NODE_CHARS[index % NODE_CHARS.length])

const ALL_EDGES: [number, number][] = []
for (let i = 0; i < NODE_COUNT; i += 1) {
  for (let j = i + 1; j < NODE_COUNT; j += 1) {
    const [ax, ay, az] = BASE_NODES[i]
    const [bx, by, bz] = BASE_NODES[j]
    if (ax * bx + ay * by + az * bz > 0.865) ALL_EDGES.push([i, j])
  }
}

const DESKTOP_EDGES = ALL_EDGES.filter(([from, to]) => ((from * 13 + to * 7) & 1) === 0)
const MOBILE_EDGES = ALL_EDGES.filter(([from, to]) => (from * 13 + to * 7) % 4 === 0)

const STAR_FIELD = Array.from({ length: 320 }, (_, index) => ({
  xr: Math.sin(index * 2.399) * 0.5 + 0.5,
  yr: Math.sin(index * 5.133 + 1.0) * 0.5 + 0.5,
  size: 7 + (Math.sin(index * 7.77) * 0.5 + 0.5) * 7,
  alpha: 0.06 + (Math.sin(index * 3.11) * 0.5 + 0.5) * 0.18,
  phase: index * 1.618,
  speed: 0.01 + (Math.sin(index * 8.37) * 0.5 + 0.5) * 0.04,
}))

type FlowDotSeed = {
  edgeIdx: number
  t: number
  speed: number
  alpha: number
}

const FLOW_DOT_SEEDS: FlowDotSeed[] = Array.from({ length: 40 }, (_, index) => ({
  edgeIdx: Math.floor((Math.sin(index * 13.7) * 0.5 + 0.5) * ALL_EDGES.length),
  t: Math.sin(index * 5.9) * 0.5 + 0.5,
  speed: 0.0012 + (Math.sin(index * 3.3) * 0.5 + 0.5) * 0.0026,
  alpha: 0.16 + (Math.sin(index * 7.1) * 0.5 + 0.5) * 0.32,
}))

type AsciiUniverseCanvasProps = {
  className?: string
  quality?: QualityMode
  variant?: VariantMode
}

function getLightPalette(depth: number) {
  if (depth > 0.72) return '#111111'
  if (depth > 0.42) return '#242424'
  return '#3a3a3a'
}

function getLightEdgePalette(depth: number) {
  if (depth > 0.66) return '#242424'
  if (depth > 0.36) return '#2e2e2e'
  return '#3a3a3a'
}

function resolveQualityMode(mode: QualityMode, width: number): ResolvedQuality {
  if (mode === 'desktop' || mode === 'mobile') return mode
  return width >= 1024 ? 'desktop' : 'mobile'
}

export default function AsciiUniverseCanvas({
  className = '',
  quality = 'desktop',
  variant = 'default',
}: AsciiUniverseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [resolvedQuality, setResolvedQuality] = useState<ResolvedQuality>(() =>
    quality === 'mobile' ? 'mobile' : 'desktop'
  )

  useEffect(() => {
    if (quality !== 'auto') {
      setResolvedQuality(quality)
      return
    }

    const apply = () => setResolvedQuality(resolveQualityMode('auto', window.innerWidth))
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [quality])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let logicalWidth = 0
    let logicalHeight = 0
    let animationFrame = 0
    let rafId = 0
    let isDisposed = false
    let isVisible = true
    let isRunning = false
    let rotY = 0.52
    let rotX = 0.28

    const isLight = variant === 'light'
    const isMobile = resolvedQuality === 'mobile'
    const edgeSet = isMobile ? MOBILE_EDGES : DESKTOP_EDGES
    const latitudeLevels = isMobile ? MOBILE_LATITUDE_LEVELS : LATITUDE_LEVELS
    const latitudeSamples = isMobile ? 20 : 44
    const flowDots = FLOW_DOT_SEEDS.slice(0, isMobile ? 8 : 18).map((dot) => ({ ...dot }))
    const baseRadius = isLight ? (isMobile ? 0.27 : 0.54) : 0.98
    const centerY = isLight ? (isMobile ? 0.34 : 0.5) : 0.88
    const speedY = isMobile ? 0.0032 : 0.009
    const speedX = isMobile ? 0.0005 : 0.0015
    const nodeFontScale = (isMobile ? 1.35 : 1.2) * CHAR_SCALE_MULTIPLIER
    const edgeFontScale = (isMobile ? 1.35 : 1.2) * CHAR_SCALE_MULTIPLIER
    const latitudeFontScale = (isMobile ? 1.35 : 1.2) * CHAR_SCALE_MULTIPLIER
    const flowFontScale = (isMobile ? 1.2 : 1.1) * CHAR_SCALE_MULTIPLIER

    type ProjectedNode = { px: number; py: number; depth: number; rz: number; index: number }
    const projected: ProjectedNode[] = []

    const resize = () => {
      const ratio = window.devicePixelRatio || 1
      logicalWidth = canvas.offsetWidth
      logicalHeight = canvas.offsetHeight
      canvas.width = logicalWidth * ratio
      canvas.height = logicalHeight * ratio
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    const drawFrame = () => {
      animationFrame += 1
      const time = animationFrame * 0.016

      ctx.clearRect(0, 0, logicalWidth, logicalHeight)

      const radius = Math.max(logicalWidth, logicalHeight) * baseRadius
      const cx = logicalWidth / 2
      const cy = logicalHeight * centerY
      const fov = 3.35

      const cosY = Math.cos(rotY)
      const sinY = Math.sin(rotY)
      const cosX = Math.cos(rotX)
      const sinX = Math.sin(rotX)

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      if (!isLight) {
        for (const star of STAR_FIELD) {
          const sx = star.xr * logicalWidth
          const sy = star.yr * logicalHeight * 0.72
          ctx.globalAlpha = star.alpha * (0.72 + 0.28 * Math.sin(time * star.speed + star.phase))
          ctx.fillStyle = '#5f5f5f'
          ctx.font = `${star.size}px ${MONO}`
          ctx.fillText('.', sx, sy)
        }
        ctx.globalAlpha = 1
      }

      projected.length = 0
      for (let index = 0; index < NODE_COUNT; index += 1) {
        const [bx, by, bz] = BASE_NODES[index]
        const x1 = bx * cosY + bz * sinY
        const z1 = -bx * sinY + bz * cosY
        const y2 = by * cosX - z1 * sinX
        const z2 = by * sinX + z1 * cosX
        const scale = fov / (fov + z2 * 0.52)

        projected.push({
          px: cx + x1 * scale * radius,
          py: cy + y2 * scale * radius,
          depth: (z2 + 1) / 2,
          rz: z2,
          index,
        })
      }

      for (let latIndex = 0; latIndex < latitudeLevels.length; latIndex += 1) {
        const latY = latitudeLevels[latIndex]
        const ringRadius = Math.sqrt(Math.max(0, 1 - latY * latY))

        for (let sample = 0; sample < latitudeSamples; sample += 1) {
          const theta = (sample / latitudeSamples) * Math.PI * 2
          const bx = ringRadius * Math.cos(theta)
          const by = latY
          const bz = ringRadius * Math.sin(theta)

          const x1 = bx * cosY + bz * sinY
          const z1 = -bx * sinY + bz * cosY
          const y2 = by * cosX - z1 * sinX
          const z2 = by * sinX + z1 * cosX
          const depth = (z2 + 1) / 2
          const scale = fov / (fov + z2 * 0.52)
          const px = cx + x1 * scale * radius
          const py = cy + y2 * scale * radius

          if (py > logicalHeight * 0.96) continue

          ctx.globalAlpha = (0.06 + depth * 0.3) * (isLight ? 1.15 : 1)
          ctx.fillStyle = isLight ? getLightEdgePalette(depth) : depth > 0.66 ? '#727272' : depth > 0.36 ? '#5a5a5a' : '#454545'
          ctx.font = `${((isLight ? 4.4 : 4.2) + depth * (isLight ? 3.4 : 3.2)) * latitudeFontScale}px ${MONO}`
          ctx.fillText(EDGE_CHARS[(latIndex + sample) % EDGE_CHARS.length], px, py)
        }
      }
      ctx.globalAlpha = 1

      for (let edgeIndex = 0; edgeIndex < edgeSet.length; edgeIndex += 1) {
        const [from, to] = edgeSet[edgeIndex]
        const a = projected[from]
        const b = projected[to]
        if (!a || !b) continue
        if (a.py > logicalHeight * 0.94 && b.py > logicalHeight * 0.94) continue

        const dx = b.px - a.px
        const dy = b.py - a.py
        const distance = Math.hypot(dx, dy)
        const depth = (a.depth + b.depth) / 2
        const steps = Math.max(2, Math.min(isMobile ? 5 : 6, Math.floor(distance / (isMobile ? 40 : 32))))

        for (let step = 1; step < steps; step += 1) {
          const t = step / steps
          const px = a.px + dx * t
          const py = a.py + dy * t
          if (py > logicalHeight * 0.95) continue

          ctx.globalAlpha = (0.04 + depth * 0.16) * (isLight ? 1.1 : 1)
          ctx.fillStyle = isLight ? getLightEdgePalette(depth) : depth > 0.66 ? '#7f7f7f' : depth > 0.36 ? '#5b5b5b' : '#474747'
          ctx.font = `${((isLight ? 3.6 : 4.2) + depth * (isLight ? 2.8 : 3.8)) * edgeFontScale}px ${MONO}`
          ctx.fillText(EDGE_CHARS[(edgeIndex + step) % EDGE_CHARS.length], px, py)
        }
      }
      ctx.globalAlpha = 1

      for (let index = 0; index < flowDots.length; index += 1) {
        const dot = flowDots[index]
        dot.t = (dot.t + dot.speed) % 1
        const [from, to] = edgeSet[dot.edgeIdx % edgeSet.length] ?? edgeSet[0] ?? [0, 1]
        const a = projected[from]
        const b = projected[to]
        if (!a || !b) continue

        const px = a.px + (b.px - a.px) * dot.t
        const py = a.py + (b.py - a.py) * dot.t
        const depth = a.depth + (b.depth - a.depth) * dot.t
        if (py > logicalHeight * 0.93 || depth < 0.16) continue

        ctx.globalAlpha = dot.alpha * depth * (isLight ? 1.12 : 1)
        ctx.fillStyle = isLight ? '#262626' : '#8c8c8c'
        ctx.font = `${((isLight ? 5.4 : 6.2) + depth * (isLight ? 3.8 : 4.2)) * flowFontScale}px ${MONO}`
        ctx.fillText('*', px, py)
      }
      ctx.globalAlpha = 1

      const sortedNodes = [...projected].sort((a, b) => a.rz - b.rz)
      for (const node of sortedNodes) {
        if (node.py > logicalHeight * 0.96) continue

        const alpha = 0.09 + node.depth * 0.9
        const size = (4.6 + node.depth * 8.2) * nodeFontScale
        const char = CHAR_FOR[node.index]

        if (node.depth > 0.72) {
          const glow = ctx.createRadialGradient(node.px, node.py, 0, node.px, node.py, size * 2.2)
          glow.addColorStop(0, isLight ? `rgba(36,36,36,${(node.depth - 0.72) * 0.18})` : `rgba(90,90,90,${(node.depth - 0.72) * 0.14})`)
          glow.addColorStop(1, isLight ? 'rgba(36,36,36,0)' : 'rgba(90,90,90,0)')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(node.px, node.py, size * 2.2, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.globalAlpha = alpha * (isLight ? 1.12 : 1)
        ctx.fillStyle = isLight ? getLightPalette(node.depth) : node.depth > 0.72 ? '#8c8c8c' : node.depth > 0.42 ? '#686868' : '#4b4b4b'
        ctx.font = `${size}px ${MONO}`
        ctx.fillText(char, node.px, node.py)
      }
      ctx.globalAlpha = 1

      if (!isLight) {
        const horizonGlow = ctx.createLinearGradient(0, logicalHeight * 0.44, 0, logicalHeight * 0.82)
        horizonGlow.addColorStop(0, 'rgba(70,70,70,0)')
        horizonGlow.addColorStop(0.56, 'rgba(58,58,58,0.16)')
        horizonGlow.addColorStop(1, 'rgba(45,45,45,0)')
        ctx.fillStyle = horizonGlow
        ctx.fillRect(0, logicalHeight * 0.44, logicalWidth, logicalHeight * 0.4)

        const lowerFog = ctx.createLinearGradient(0, logicalHeight * 0.58, 0, logicalHeight)
        lowerFog.addColorStop(0, 'rgba(18,18,18,0)')
        lowerFog.addColorStop(0.42, 'rgba(18,18,18,0.28)')
        lowerFog.addColorStop(1, 'rgba(18,18,18,0.74)')
        ctx.fillStyle = lowerFog
        ctx.fillRect(0, logicalHeight * 0.58, logicalWidth, logicalHeight * 0.42)

        ctx.fillStyle = 'rgba(0,0,0,0.035)'
        for (let y = 0; y < logicalHeight; y += 3) {
          ctx.fillRect(0, y, logicalWidth, 1)
        }
      }

      rotY += speedY
      rotX += speedX
    }

    const stopLoop = () => {
      if (!isRunning) return
      cancelAnimationFrame(rafId)
      isRunning = false
    }

    const loop = () => {
      if (isDisposed || !isVisible) {
        isRunning = false
        return
      }

      drawFrame()
      rafId = requestAnimationFrame(loop)
      isRunning = true
    }

    const startLoop = () => {
      if (isDisposed || isRunning || !isVisible) return
      rafId = requestAnimationFrame(loop)
      isRunning = true
    }

    const resizeObserver = new ResizeObserver(() => {
      resize()
      if (isVisible) drawFrame()
    })
    resizeObserver.observe(canvas)
    resize()

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = Boolean(entry?.isIntersecting)
        if (isVisible) startLoop()
        else stopLoop()
      },
      { threshold: 0.02 }
    )
    visibilityObserver.observe(canvas)

    startLoop()

    return () => {
      isDisposed = true
      stopLoop()
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
    }
  }, [resolvedQuality, variant])

  return <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full ${className}`} />
}
