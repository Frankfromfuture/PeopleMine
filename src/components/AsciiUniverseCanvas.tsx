'use client'

import { useEffect, useRef } from 'react'

// ── Sphere geometry ────────────────────────────────────────────────────────────
const N   = 120
const PHI = (1 + Math.sqrt(5)) / 2

const BASE_NODES: [number, number, number][] = Array.from({ length: N }, (_, i) => {
  const y = 1 - (i / (N - 1)) * 2
  const r = Math.sqrt(Math.max(0, 1 - y * y))
  const t = 2 * Math.PI * (i / PHI)
  return [r * Math.cos(t), y, r * Math.sin(t)]
})

const NODE_CHARS = ['○', '◦', '+', '×', '·', '⊕', '⊙', '∘']
const CHAR_FOR   = BASE_NODES.map((_, i) => NODE_CHARS[i % NODE_CHARS.length])

// Edges: angular dot-product threshold
const EDGES: [number, number][] = []
for (let i = 0; i < N; i++) {
  for (let j = i + 1; j < N; j++) {
    const [ax, ay, az] = BASE_NODES[i]
    const [bx, by, bz] = BASE_NODES[j]
    if (ax * bx + ay * by + az * bz > 0.82) EDGES.push([i, j])
  }
}

// ── Star field (stable, not random per render) ─────────────────────────────────
const STARS = Array.from({ length: 220 }, (_, i) => ({
  xr:     (Math.sin(i * 2.399) * 0.5 + 0.5),       // deterministic pseudo-random
  yr:     (Math.sin(i * 5.133 + 1.0) * 0.5 + 0.5),
  size:   0.3 + (Math.sin(i * 7.77) * 0.5 + 0.5) * 1.1,
  baseA:  0.04 + (Math.sin(i * 3.11) * 0.5 + 0.5) * 0.28,
  phase:  i * 1.618,
  speed:  0.006 + (Math.sin(i * 9.3) * 0.5 + 0.5) * 0.018,
}))

// ── Flow particles along edges ─────────────────────────────────────────────────
interface FlowDot { edgeIdx: number; t: number; speed: number; alpha: number }
const FLOW_DOTS: FlowDot[] = Array.from({ length: 28 }, (_, i) => ({
  edgeIdx: Math.floor((Math.sin(i * 13.7) * 0.5 + 0.5) * EDGES.length),
  t:       (Math.sin(i * 5.9) * 0.5 + 0.5),
  speed:   0.0014 + (Math.sin(i * 3.3) * 0.5 + 0.5) * 0.003,
  alpha:   0.3 + (Math.sin(i * 7.1) * 0.5 + 0.5) * 0.5,
}))

// ── Canvas component ───────────────────────────────────────────────────────────
export default function AsciiUniverseCanvas({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rotY  = 0.5
    let rotX  = 0.22        // slight downward tilt — look at sphere from above
    let logW  = 0, logH = 0
    let animId: number
    let frame = 0

    const resize = () => {
      const ratio = window.devicePixelRatio || 1
      logW = canvas.offsetWidth
      logH = canvas.offsetHeight
      canvas.width  = logW * ratio
      canvas.height = logH * ratio
      ctx.scale(ratio, ratio)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    // projected node cache
    type PNode = { px: number; py: number; depth: number; rz: number; idx: number }
    const projected: PNode[] = []

    const draw = () => {
      frame++
      const t = frame * 0.016

      ctx.clearRect(0, 0, logW, logH)

      // ── Sphere params: large + positioned below center = horizon effect ──
      const R  = Math.max(logW, logH) * 0.82   // very large radius
      const cx = logW / 2
      // sphere center pushed well below viewport center
      const cy = logH * 0.74
      const FOV = 3.2

      const cosY = Math.cos(rotY), sinY = Math.sin(rotY)
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX)

      // ── 1. Star field (only in upper ~65% of canvas) ──────────────────────
      for (const s of STARS) {
        const sx = s.xr * logW
        const sy = s.yr * logH * 0.62
        const a  = s.baseA * (0.6 + 0.4 * Math.sin(t * s.speed + s.phase))
        ctx.globalAlpha = a
        ctx.fillStyle   = '#ffffff'
        ctx.beginPath()
        ctx.arc(sx, sy, s.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // ── 2. Transform all nodes ─────────────────────────────────────────────
      projected.length = 0
      for (let i = 0; i < N; i++) {
        const [bx, by, bz] = BASE_NODES[i]
        const x1 = bx * cosY + bz * sinY
        const z1 = -bx * sinY + bz * cosY
        const y2 = by * cosX - z1 * sinX
        const z2 = by * sinX + z1 * cosX
        const sc = FOV / (FOV + z2 * 0.5)
        projected.push({
          px:    cx + x1 * sc * R,
          py:    cy + y2 * sc * R,
          depth: (z2 + 1) / 2,
          rz:    z2,
          idx:   i,
        })
      }

      // ── 3. Edges ──────────────────────────────────────────────────────────
      ctx.lineCap = 'round'
      for (const [i, j] of EDGES) {
        const a = projected[i], b = projected[j]
        // only draw edges that are at least partly above the fog line
        if (a.py > logH * 0.88 && b.py > logH * 0.88) continue
        const d = (a.depth + b.depth) / 2
        ctx.globalAlpha = 0.018 + d * 0.12
        ctx.strokeStyle = '#c8c8c8'
        ctx.lineWidth   = 0.35 + d * 0.65
        ctx.setLineDash([2, 7])
        ctx.beginPath()
        ctx.moveTo(a.px, a.py)
        ctx.lineTo(b.px, b.py)
        ctx.stroke()
      }
      ctx.setLineDash([])
      ctx.globalAlpha = 1

      // ── 4. Flow dots along edges ───────────────────────────────────────────
      for (const dot of FLOW_DOTS) {
        dot.t = (dot.t + dot.speed) % 1
        const [i, j]  = EDGES[dot.edgeIdx] ?? EDGES[0]
        const a = projected[i], b = projected[j]
        if (!a || !b) continue
        if (a.py > logH * 0.88 && b.py > logH * 0.88) continue
        const px = a.px + (b.px - a.px) * dot.t
        const py = a.py + (b.py - a.py) * dot.t
        const d  = a.depth + (b.depth - a.depth) * dot.t
        if (d < 0.15) continue
        ctx.globalAlpha = dot.alpha * d * 0.7
        ctx.fillStyle   = '#e0e0e0'
        ctx.beginPath()
        ctx.arc(px, py, 1.2 + d * 1.4, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // ── 5. Nodes (back → front) ────────────────────────────────────────────
      const sorted = [...projected].sort((a, b) => a.rz - b.rz)
      for (const { px, py, depth, idx } of sorted) {
        if (py > logH * 0.90) continue   // hidden below fog
        const alpha = 0.08 + depth * 0.88
        const size  = 5 + depth * 11
        const ch    = CHAR_FOR[idx]

        // Bloom glow for front nodes
        if (depth > 0.70) {
          const bloomR = size * (2.5 + (depth - 0.70) * 6)
          const grd = ctx.createRadialGradient(px, py, 0, px, py, bloomR)
          grd.addColorStop(0,   `rgba(200,200,200,${(depth - 0.70) * 0.22})`)
          grd.addColorStop(1,   'rgba(200,200,200,0)')
          ctx.globalAlpha = 1
          ctx.fillStyle   = grd
          ctx.beginPath()
          ctx.arc(px, py, bloomR, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.globalAlpha  = alpha
        ctx.fillStyle    = depth > 0.68 ? '#eaeaea' : depth > 0.38 ? '#aaaaaa' : '#555555'
        ctx.font         = `${size}px "Courier New", monospace`
        ctx.textAlign    = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(ch, px, py)
      }
      ctx.globalAlpha = 1

      // ── 6. Atmospheric horizon glow ───────────────────────────────────────
      const hGlow = ctx.createLinearGradient(0, cy - logH * 0.22, 0, cy + logH * 0.05)
      hGlow.addColorStop(0,   'rgba(100,100,100,0)')
      hGlow.addColorStop(0.6, 'rgba(80,80,80,0.07)')
      hGlow.addColorStop(1,   'rgba(60,60,60,0)')
      ctx.fillStyle = hGlow
      ctx.fillRect(0, cy - logH * 0.22, logW, logH * 0.27)

      // ── 7. Bottom atmospheric fog (hide lower hemisphere) ────────────────
      const fog = ctx.createLinearGradient(0, logH * 0.60, 0, logH)
      fog.addColorStop(0,   'rgba(3,3,3,0)')
      fog.addColorStop(0.45,'rgba(3,3,3,0.55)')
      fog.addColorStop(1,   'rgba(3,3,3,1)')
      ctx.fillStyle = fog
      ctx.fillRect(0, logH * 0.60, logW, logH * 0.40)

      // ── 8. Radial vignette (corners) ─────────────────────────────────────
      const vig = ctx.createRadialGradient(cx, logH * 0.4, logH * 0.15, cx, logH * 0.4, logW * 0.75)
      vig.addColorStop(0, 'rgba(3,3,3,0)')
      vig.addColorStop(1, 'rgba(3,3,3,0.55)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, logW, logH)

      // ── 9. Scanlines ──────────────────────────────────────────────────────
      ctx.fillStyle = 'rgba(0,0,0,0.055)'
      for (let y = 0; y < logH; y += 3) {
        ctx.fillRect(0, y, logW, 1)
      }

      rotY += 0.0018
      rotX += 0.00035

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
    />
  )
}
