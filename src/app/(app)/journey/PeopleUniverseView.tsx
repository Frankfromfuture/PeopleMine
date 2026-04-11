'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import type { NetworkContact, NetworkRelation } from './JourneyGraph'

// ── Types ──────────────────────────────────────────────────────────────────
type Group    = 'core' | 'engineering' | 'business' | 'research' | 'external'
type EdgeType = 'primary' | 'secondary' | 'auxiliary'
type Warmth   = '热' | '暖' | '中' | '冷'

interface SphereNode {
  id: string; name: string; role: string; group: Group
  bx: number; by: number; bz: number
  rx: number; ry: number; rz: number
  px: number; py: number; depth: number
  baseRadius: number; degree: number
}
interface Edge { source: string; target: string; strength: number; type: EdgeType; idx: number }
interface ArcPt { px: number; py: number; depth: number }
interface FlowParticle {
  edgeIdx: number; t: number; dir: number; speed: number
  alpha: number; maxAlpha: number; dying: boolean; size: number
}
interface EdgeFlash { edgeIdx: number; alpha: number }
interface PersonMeta {
  roleZh: string; value: number; warmth: Warmth
  industry: string; subIndustry: string; company: string; relation: string
}

// ── Visual config ──────────────────────────────────────────────────────────
const NODE_COLOR: Record<Group, string> = {
  core: '#0d0d0d', engineering: '#1c1c1c',
  business: '#2e2e2e', research: '#3e3e3e', external: '#545454',
}
const GROUP_ZH: Record<Group, string> = {
  core: '核心资源', engineering: '协作伙伴',
  business: '社交人脉', research: '智识资源', external: '外部链接',
}
const WARMTH_COLOR: Record<Warmth, string> = {
  '热': '#e74c3c', '暖': '#e67e22', '中': '#8e9aaa', '冷': '#4a90d9',
}
const EDGE_CFG: Record<EdgeType, { width: number; color: string; dash: number[]; alpha: number; zh: string }> = {
  primary:   { width: 1.8,  color: '#141414', dash: [],       alpha: 0.68, zh: '强连接'   },
  secondary: { width: 0.95, color: '#4a4a4a', dash: [],       alpha: 0.40, zh: '中等连接' },
  auxiliary: { width: 0.6,  color: '#888888', dash: [5.5, 5], alpha: 0.26, zh: '弱连接'   },
}
const PCFG: Record<EdgeType, { max: number; rate: number; speed: number; size: number; a: number }> = {
  primary:   { max: 6, rate: 0.13, speed: 0.016, size: 3.6, a: 0.90 },
  secondary: { max: 5, rate: 0.08, speed: 0.011, size: 2.8, a: 0.74 },
  auxiliary: { max: 3, rate: 0.04, speed: 0.007, size: 2.0, a: 0.58 },
}
const FONT = `'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif`

// ── Role mapping ───────────────────────────────────────────────────────────
function roleToGroup(role: string): Group {
  switch (role) {
    case 'BIG_INVESTOR': case 'LIGHTHOUSE': case 'BREAKER': return 'core'
    case 'COMRADE':                                          return 'engineering'
    case 'THERMOMETER': case 'BINDER':                      return 'business'
    case 'ADVISOR':     case 'ANALYST':                     return 'research'
    default:                                                 return 'external'
  }
}

function roleToZh(role: string): string {
  const map: Record<string, string> = {
    BIG_INVESTOR: '大金主', GATEWAY: '传送门', ADVISOR: '智囊',
    THERMOMETER: '温度计', LIGHTHOUSE: '灯塔',  COMRADE: '战友',
    BREAKER: '破局者',     EVANGELIST: '布道者', ANALYST: '分析师', BINDER: '粘合剂',
  }
  return map[role] || role
}

function tempToWarmth(temp: string | null): Warmth {
  if (temp === 'HOT')  return '热'
  if (temp === 'WARM') return '暖'
  if (temp === 'COLD') return '冷'
  return '中'
}

function classifyEdge(s: number): EdgeType {
  return s >= 0.80 ? 'primary' : s >= 0.55 ? 'secondary' : 'auxiliary'
}

// ── Sphere math ────────────────────────────────────────────────────────────
const ARC_STEPS = 22

function slerp3(ax:number,ay:number,az:number,bx:number,by:number,bz:number,t:number):[number,number,number]{
  const dot=Math.max(-1,Math.min(1,ax*bx+ay*by+az*bz))
  const om=Math.acos(dot)
  if(om<0.0002) return [ax+(bx-ax)*t,ay+(by-ay)*t,az+(bz-az)*t]
  const s=Math.sin(om)
  const wa=Math.sin((1-t)*om)/s, wb=Math.sin(t*om)/s
  return [ax*wa+bx*wb,ay*wa+by*wb,az*wa+bz*wb]
}

function fibSphere(n:number){
  if (n <= 1) return [{ bx:0, by:0, bz:1 }]
  const phi=(1+Math.sqrt(5))/2
  return Array.from({length:n},(_,i)=>{
    const y=1-(i/(n-1))*2, rr=Math.sqrt(Math.max(0,1-y*y)), t=2*Math.PI*i/phi
    return {bx:rr*Math.cos(t),by:y,bz:rr*Math.sin(t)}
  })
}

function rotFast(bx:number,by:number,bz:number,cY:number,sY:number,cX:number,sX:number){
  const x1=bx*cY+bz*sY, z1=-bx*sY+bz*cY
  const y2=by*cX-z1*sX, z2=by*sX+z1*cX
  return {rx:x1,ry:y2,rz:z2}
}

function arcPos(pts:ArcPt[],t:number):ArcPt{
  const fi=t*(pts.length-1), i0=Math.floor(fi), i1=Math.min(i0+1,pts.length-1), f=fi-i0
  return {
    px:pts[i0].px+(pts[i1].px-pts[i0].px)*f,
    py:pts[i0].py+(pts[i1].py-pts[i0].py)*f,
    depth:pts[i0].depth+(pts[i1].depth-pts[i0].depth)*f,
  }
}

function normalize3(x:number,y:number,z:number):[number,number,number]{
  const len=Math.sqrt(x*x+y*y+z*z)
  return len<1e-10?[0,0,1]:[x/len,y/len,z/len]
}

function tangentFrame(cx:number,cy:number,cz:number):[[number,number,number],[number,number,number]]{
  const ref:[number,number,number]=Math.abs(cy)<0.9?[0,1,0]:[1,0,0]
  const t1=normalize3(ref[1]*cz-ref[2]*cy, ref[2]*cx-ref[0]*cz, ref[0]*cy-ref[1]*cx)
  const t2=normalize3(cy*t1[2]-cz*t1[1], cz*t1[0]-cx*t1[2], cx*t1[1]-cy*t1[0])
  return [t1,t2]
}

function offsetOnSphere(cx:number,cy:number,cz:number,radius:number,azimuth:number):[number,number,number]{
  if(radius<1e-6) return [cx,cy,cz]
  const[t1,t2]=tangentFrame(cx,cy,cz)
  const dx=Math.cos(azimuth)*t1[0]+Math.sin(azimuth)*t2[0]
  const dy=Math.cos(azimuth)*t1[1]+Math.sin(azimuth)*t2[1]
  const dz=Math.cos(azimuth)*t1[2]+Math.sin(azimuth)*t2[2]
  const sa=Math.sin(radius),ca=Math.cos(radius)
  return normalize3(cx*ca+dx*sa, cy*ca+dy*sa, cz*ca+dz*sa)
}

// ── NodeCard ───────────────────────────────────────────────────────────────
function NodeCard({ node, meta, wx, wy }: { node: SphereNode; meta: PersonMeta; wx: number; wy: number }) {
  const nodeR  = node.baseRadius * (0.72 + 0.28 * node.depth)
  const cardW  = 212
  const toLeft = node.px > wx / 2
  const cardLeft = toLeft ? node.px - nodeR - cardW - 16 : node.px + nodeR + 16
  const cardTop  = Math.max(16, Math.min(wy - 290, node.py - 120))
  const ROW_H = 20

  const rows: { label: string; content: React.ReactNode }[] = [
    {
      label: '能量值',
      content: (
        <div style={{ display:'flex', alignItems:'center', gap:6, width:'100%' }}>
          <div style={{ flex:1, height:2.5, background:'rgba(0,0,0,0.1)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ width:`${meta.value}%`, height:'100%', background:'#2a2a2a', borderRadius:2 }} />
          </div>
          <span style={{ fontSize:11, color:'#222', minWidth:22, textAlign:'right', flexShrink:0 }}>{meta.value}</span>
        </div>
      ),
    },
    {
      label: '关系温度',
      content: (
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:WARMTH_COLOR[meta.warmth], flexShrink:0 }} />
          <span style={{ fontSize:11, color:'#333' }}>{meta.warmth}</span>
        </div>
      ),
    },
    { label:'所属行业', content:<span style={{ fontSize:11, color:'#444' }}>{meta.industry || '未分类'}</span> },
    { label:'细分领域', content:<span style={{ fontSize:11, color:'#777' }}>{meta.subIndustry || '—'}</span>    },
    { label:'所在公司', content:<span style={{ fontSize:11, color:'#444' }}>{meta.company || '—'}</span>        },
    { label:'职　　位', content:<span style={{ fontSize:11, color:'#444' }}>{node.role || '—'}</span>           },
    { label:'关系类型', content:<span style={{ fontSize:11, color:'#333' }}>{meta.roleZh}</span>                },
  ]

  return (
    <div style={{ position:'absolute', left:cardLeft, top:cardTop, width:cardW, zIndex:100, pointerEvents:'none', fontFamily:FONT }}>
      <div style={{
        background:'rgba(232,232,232,0.47)', backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
        border:'1px solid rgba(0,0,0,0.07)', boxShadow:'0 6px 24px rgba(0,0,0,0.07)', padding:'11px 13px',
      }}>
        <div style={{ fontSize:15, color:'#111', marginBottom:2 }}>{node.name}</div>
        <div style={{ fontSize:10, color:'#777', marginBottom:9 }}>{GROUP_ZH[node.group]}</div>
        <div style={{ height:1, background:'rgba(0,0,0,0.09)', marginBottom:7 }} />
        {rows.map(row => (
          <div key={row.label} style={{ display:'grid', gridTemplateColumns:'58px 1fr', gap:8, height:ROW_H, marginBottom:3 }}>
            <div style={{ height:ROW_H, display:'flex', alignItems:'center', fontSize:10, color:'#999', whiteSpace:'nowrap', flexShrink:0 }}>
              {row.label}
            </div>
            <div style={{ height:ROW_H, display:'flex', alignItems:'center', minWidth:0 }}>
              {row.content}
            </div>
          </div>
        ))}
        <div style={{ height:1, background:'rgba(0,0,0,0.08)', marginTop:8, marginBottom:7 }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', height:18 }}>
          <span style={{ fontSize:10, color:'#aaa' }}>关联节点</span>
          <span style={{ fontSize:12, color:'#333' }}>{node.degree}</span>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
interface PeopleUniverseViewProps {
  contacts: NetworkContact[]
  relations: NetworkRelation[]
  focusContactId?: string | null  // external search focus
  onNodeClick?: (contactId: string) => void
}

export default function PeopleUniverseView({ contacts, relations, focusContactId, onNodeClick }: PeopleUniverseViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const rafRef       = useRef<number>(0)
  const timeRef      = useRef<number>(0)
  const arcMapRef    = useRef<Map<number, ArcPt[]>>(new Map())
  const particlesRef = useRef<FlowParticle[]>([])
  const flashesRef   = useRef<EdgeFlash[]>([])
  const prevHovRef   = useRef<string | null>(null)
  const zoomRef      = useRef<number>(1.04)
  const dragMoved    = useRef(false)

  const simRef = useRef<{
    nodes: SphereNode[]; edges: Edge[]; nodeMap: Map<string, SphereNode>
    metaMap: Map<string, PersonMeta>
    rotX: number; rotY: number; hoveredId: string | null
    externalFocusId: string | null
    targetRot: { x: number; y: number } | null
    w: number; h: number
  }>({ nodes:[], edges:[], nodeMap:new Map(), metaMap:new Map(), rotX:0.28, rotY:0, hoveredId:null,
    externalFocusId:null, targetRot:null, w:0, h:0 })

  const drag = useRef({ on:false, lx:0, ly:0, vx:0, vy:0 })

  const [hovered, setHovered]     = useState<{ node:SphereNode; meta:PersonMeta; wx:number; wy:number } | null>(null)
  const [activeView, setActiveView] = useState<string | null>(null)
  const [zoom, setZoom]           = useState(1.04)
  // Entrance explosion progress: 0 → 1, driven by RAF loop
  const entranceRef = useRef({ progress: 0, done: false })

  const industryTargetsRef  = useRef<Map<string,[number,number,number]>>(new Map())
  const industryCentersRef  = useRef<Map<string,[number,number,number]>>(new Map())
  const top3IndustriesRef   = useRef<string[]>([])
  const viewTransRef        = useRef(0)
  const activeViewRef       = useRef<string|null>(null)

  // ── Derive sphere data from DB contacts ───────────────────────────────
  const { people, metaRecord, edgesRaw } = useMemo(() => {
    const people = contacts.map(c => ({
      id:    c.id,
      name:  c.name,
      role:  c.title || c.jobPosition || roleToZh(c.roleArchetype || ''),
      group: roleToGroup(c.roleArchetype || ''),
    }))

    const metaRecord: Record<string, PersonMeta> = {}
    for (const c of contacts) {
      const tagsArr: string[] = Array.isArray(c.tags)
        ? (c.tags as unknown as string[])
        : []
      metaRecord[c.id] = {
        roleZh:      roleToZh(c.roleArchetype || ''),
        value:       c.energyScore,
        warmth:      tempToWarmth(c.temperature),
        industry:    c.industryL1 || tagsArr[0] || '未分类',
        subIndustry: c.industryL2 || tagsArr[1] || '',
        company:     c.company || '',
        relation:    roleToZh(c.roleArchetype || ''),
      }
    }

    function strengthToScore(s?: 'STRONG' | 'MEDIUM' | 'WEAK'): number {
      return s === 'STRONG' ? 0.85 : s === 'MEDIUM' ? 0.65 : 0.38
    }
    const edgesRaw: [string, string, number][] = relations.map(r => [
      r.contactIdA, r.contactIdB, strengthToScore(r.strength),
    ])

    return { people, metaRecord, edgesRaw }
  }, [contacts, relations])

  // ── Industry layout ────────────────────────────────────────────────────
  const computeIndustryLayout = useCallback(() => {
    const { nodes, metaMap } = simRef.current
    if (!nodes.length) return

    const indMap = new Map<string, SphereNode[]>()
    for (const n of nodes) {
      const ind = metaMap.get(n.id)?.industry || '未分类'
      if (!indMap.has(ind)) indMap.set(ind, [])
      indMap.get(ind)!.push(n)
    }

    const sorted = [...indMap.entries()].sort((a,b) => b[1].length - a[1].length)
    top3IndustriesRef.current = sorted.slice(0,3).map(([ind]) => ind)

    const N = sorted.length
    const phi = (1+Math.sqrt(5))/2
    const allCenters: [number,number,number][] = sorted.map((_,i) => {
      const t = (i+0.5)/N
      const bz = 0.93 - t*0.86
      const st = Math.sqrt(Math.max(0,1-bz*bz))
      const az = 2*Math.PI*i/phi
      return normalize3(st*Math.cos(az), st*Math.sin(az), bz)
    })

    const centers = new Map<string,[number,number,number]>()
    sorted.forEach(([ind],i) => centers.set(ind, allCenters[i]))
    industryCentersRef.current = centers

    const targets = new Map<string,[number,number,number]>()
    for (const [ind, indNodes] of indMap) {
      const [cx,cy,cz] = centers.get(ind)!
      const Nc = indNodes.length
      if (Nc === 1) { targets.set(indNodes[0].id, [cx,cy,cz]); continue }
      const bySub = [...indNodes].sort((a,b) =>
        (metaMap.get(a.id)?.subIndustry||'').localeCompare(metaMap.get(b.id)?.subIndustry||''))
      const spread = 0.09 + 0.013*Nc
      bySub.forEach((n,i) => {
        const az = (i/Nc)*2*Math.PI
        targets.set(n.id, offsetOnSphere(cx,cy,cz,spread,az))
      })
    }
    industryTargetsRef.current = targets
  }, [])

  useEffect(() => {
    activeViewRef.current = activeView
    if (activeView === 'industry') computeIndustryLayout()
  }, [activeView, computeIndustryLayout])

  // ── Init ───────────────────────────────────────────────────────────────
  const init = useCallback((w:number, h:number) => {
    const deg: Record<string,number> = {}
    people.forEach(p => (deg[p.id] = 0))
    edgesRaw.forEach(([s,t]) => { deg[s] = (deg[s]||0)+1; deg[t] = (deg[t]||0)+1 })

    const pts = fibSphere(Math.max(people.length, 1))
    const nodes: SphereNode[] = people.map((p,i) => ({
      ...p, ...pts[i],
      rx: pts[i].bx, ry: pts[i].by, rz: pts[i].bz,
      px: 0, py: 0, depth: 0,
      baseRadius: p.group === 'core' ? 16.5 : 9 + Math.min(deg[p.id]||0, 4) * 1.05,
      degree: deg[p.id]||0,
    }))

    const nodeMap = new Map<string,SphereNode>()
    nodes.forEach(n => nodeMap.set(n.id, n))

    const metaMap = new Map<string,PersonMeta>()
    Object.entries(metaRecord).forEach(([id,m]) => metaMap.set(id, m))

    const validEdges: [string,string,number][] = edgesRaw.filter(([s,t]) => nodeMap.has(s) && nodeMap.has(t))
    const edges: Edge[] = validEdges.map(([s,t,str],i) => ({
      source:s, target:t, strength:str, type:classifyEdge(str), idx:i,
    }))

    simRef.current = {
      ...simRef.current,
      nodes, edges, nodeMap, metaMap,
      rotX:0.28, rotY:0, hoveredId:null, w, h,
    }
    particlesRef.current = []
    flashesRef.current   = []
    prevHovRef.current   = null
  }, [people, metaRecord, edgesRaw])

  // ── Project ────────────────────────────────────────────────────────────
  const project = useCallback(() => {
    const { nodes, edges, nodeMap, rotX, rotY, w, h } = simRef.current
    const cx = w/2, cy = h/2
    const sR = Math.min(w,h)*0.42*zoomRef.current
    const FOV = 3.2
    const cosY=Math.cos(rotY), sinY=Math.sin(rotY)
    const cosX=Math.cos(rotX), sinX=Math.sin(rotX)
    const trans = Math.max(0, Math.min(1, viewTransRef.current))

    for (const n of nodes) {
      let bx=n.bx, by=n.by, bz=n.bz
      if (trans > 0.001) {
        const tgt = industryTargetsRef.current.get(n.id)
        if (tgt) { [bx,by,bz] = slerp3(bx,by,bz,tgt[0],tgt[1],tgt[2],trans) }
      }
      const r = rotFast(bx,by,bz,cosY,sinY,cosX,sinX)
      n.rx=r.rx; n.ry=r.ry; n.rz=r.rz
      const sc = sR*FOV/(FOV+r.rz*0.5)
      n.px=cx+r.rx*sc; n.py=cy+r.ry*sc; n.depth=(r.rz+1)/2
    }

    const arcMap = new Map<number,ArcPt[]>()
    for (const e of edges) {
      const s = nodeMap.get(e.source), t = nodeMap.get(e.target)
      if (!s||!t) continue
      let sbx=s.bx,sby=s.by,sbz=s.bz
      let tbx=t.bx,tby=t.by,tbz=t.bz
      if (trans > 0.001) {
        const st = industryTargetsRef.current.get(s.id)
        const tt = industryTargetsRef.current.get(t.id)
        if (st) [sbx,sby,sbz] = slerp3(sbx,sby,sbz,st[0],st[1],st[2],trans)
        if (tt) [tbx,tby,tbz] = slerp3(tbx,tby,tbz,tt[0],tt[1],tt[2],trans)
      }
      const pts: ArcPt[] = []
      for (let i=0;i<=ARC_STEPS;i++){
        const p = i/ARC_STEPS
        const [x,y,z] = slerp3(sbx,sby,sbz,tbx,tby,tbz,p)
        const r = rotFast(x,y,z,cosY,sinY,cosX,sinX)
        const sc = sR*FOV/(FOV+r.rz*0.5)
        pts.push({px:cx+r.rx*sc, py:cy+r.ry*sc, depth:(r.rz+1)/2})
      }
      arcMap.set(e.idx, pts)
    }
    arcMapRef.current = arcMap
  }, [])

  // ── Effects update ─────────────────────────────────────────────────────
  const updateEffects = useCallback(() => {
    const { hoveredId, edges, externalFocusId } = simRef.current
    const effectiveId = hoveredId || externalFocusId
    const particles = particlesRef.current, flashes = flashesRef.current

    if (effectiveId !== prevHovRef.current) {
      prevHovRef.current = effectiveId
      particles.forEach(p => { p.dying = true })
      if (effectiveId) {
        edges.forEach(e => {
          if (e.source===effectiveId||e.target===effectiveId) {
            const fi = flashes.findIndex(f => f.edgeIdx===e.idx)
            if (fi>=0) flashes.splice(fi,1)
            flashes.push({edgeIdx:e.idx, alpha:1.0})
          }
        })
      }
    }

    if (effectiveId) {
      edges.forEach(e => {
        if (e.source!==effectiveId&&e.target!==effectiveId) return
        const cfg = PCFG[e.type]
        const live = particles.filter(p=>p.edgeIdx===e.idx&&!p.dying).length
        if (live<cfg.max&&Math.random()<cfg.rate) {
          const fromSrc = e.source===effectiveId
          particles.push({
            edgeIdx:e.idx, t:fromSrc?0.03:0.97, dir:fromSrc?1:-1,
            speed:cfg.speed, alpha:0, maxAlpha:cfg.a, dying:false, size:cfg.size,
          })
        }
      })
    }

    for (let i=particles.length-1;i>=0;i--) {
      const p=particles[i]; const e=edges[p.edgeIdx]
      if (!e||(effectiveId!==e.source&&effectiveId!==e.target)) p.dying=true
      if (p.dying) { p.alpha-=0.055; if(p.alpha<=0){particles.splice(i,1);continue} }
      else p.alpha=Math.min(p.alpha+0.08, p.maxAlpha)
      p.t+=p.speed*p.dir
      if (p.t>0.97) p.t=0.03
      if (p.t<0.03) p.t=0.97
    }
    for (let i=flashes.length-1;i>=0;i--) {
      flashes[i].alpha-=0.025
      if (flashes[i].alpha<=0) flashes.splice(i,1)
    }
  }, [])

  // ── Draw ───────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas=canvasRef.current; if(!canvas) return
    const ctx=canvas.getContext('2d'); if(!ctx) return
    const { nodes, edges, nodeMap, metaMap, hoveredId, w, h } = simRef.current
    const arcMap=arcMapRef.current, t=timeRef.current

    ctx.clearRect(0,0,w,h)
    const cx=w/2, cy=h/2
    const vig=ctx.createRadialGradient(cx,cy,Math.min(w,h)*0.22,cx,cy,Math.max(w,h)*0.82)
    vig.addColorStop(0,'rgba(0,0,0,0)'); vig.addColorStop(1,'rgba(0,0,0,0.13)')
    ctx.fillStyle=vig; ctx.fillRect(0,0,w,h)

    // ── Entrance explosion scale ────────────────────────────────────────────
    const ep = entranceRef.current.progress
    // easeOutBack: fast expand with slight overshoot
    const eased = ep < 1 ? 1 + 2.7*(ep-1)**3 + 1.7*(ep-1)**2 : 1
    const entranceScale = Math.max(0.001, eased)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(entranceScale, entranceScale)
    ctx.translate(-cx, -cy)
    ctx.globalAlpha = Math.min(ep * 3, 1)

    const focusId=hoveredId||simRef.current.externalFocusId
    const focused=new Set<string>()
    if(focusId){
      focused.add(focusId)
      for(const e of edges){
        if(e.source===focusId) focused.add(e.target)
        if(e.target===focusId) focused.add(e.source)
      }
    }

    const flashMap=new Map<number,number>()
    flashesRef.current.forEach(f=>flashMap.set(f.edgeIdx,f.alpha))

    // ── Arcs
    for(const tier of ['auxiliary','secondary','primary'] as EdgeType[]){
      const cfg=EDGE_CFG[tier]
      for(const edge of edges){
        if(edge.type!==tier) continue
        const sNode=nodeMap.get(edge.source), tNode=nodeMap.get(edge.target)
        if(!sNode||!tNode) continue
        const pts=arcMap.get(edge.idx); if(!pts||pts.length<2) continue
        const hi=focusId?(focused.has(sNode.id)&&focused.has(tNode.id)):true
        const fa=focusId&&!hi
        const flashA=flashMap.get(edge.idx)??0
        const midD=pts[Math.floor(pts.length/2)].depth
        const endD=(pts[0].depth+pts[pts.length-1].depth)/2
        const effD=Math.min(midD,endD)*0.55+endD*0.45
        const ds=0.12+0.88*effD
        let baseA=cfg.alpha*ds
        if(fa) baseA*=0.05
        if(hi&&focusId) baseA=Math.min(baseA*2.1,0.9)
        ctx.save()
        if((hi&&focusId)||flashA>0.05){
          const gA=(hi&&focusId?0.06+0.03*Math.sin(t*2.4):0)+flashA*0.35
          ctx.globalAlpha=gA; ctx.strokeStyle=cfg.color; ctx.lineWidth=cfg.width*6
          ctx.lineCap='round'; ctx.lineJoin='round'
          ctx.beginPath(); ctx.moveTo(pts[0].px,pts[0].py)
          for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].px,pts[i].py)
          ctx.stroke()
        }
        ctx.globalAlpha=Math.min(baseA+flashA*0.55,1)
        ctx.strokeStyle=cfg.color
        ctx.lineWidth=cfg.width*(0.6+0.4*ds)*(hi&&focusId?1.35:1)
        if(cfg.dash.length) ctx.setLineDash(cfg.dash)
        ctx.lineCap='round'; ctx.lineJoin='round'
        ctx.beginPath(); ctx.moveTo(pts[0].px,pts[0].py)
        for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].px,pts[i].py)
        ctx.stroke(); ctx.setLineDash([]); ctx.restore()
      }
    }

    // ── Particles
    for(const p of particlesRef.current){
      const pts=arcMap.get(p.edgeIdx); if(!pts||pts.length<2) continue
      const head=arcPos(pts,p.t)
      const tailT=Math.max(0.01,Math.min(0.99,p.t-p.dir*p.speed*12))
      const tail=arcPos(pts,tailT)
      const sz=p.size*(0.3+0.7*head.depth), a=p.alpha*(0.25+0.75*head.depth)
      ctx.save()
      const trailG=ctx.createLinearGradient(tail.px,tail.py,head.px,head.py)
      trailG.addColorStop(0,'rgba(18,18,18,0)'); trailG.addColorStop(1,`rgba(18,18,18,${a*0.5})`)
      ctx.strokeStyle=trailG; ctx.lineWidth=sz*0.85; ctx.lineCap='round'
      ctx.beginPath(); ctx.moveTo(tail.px,tail.py); ctx.lineTo(head.px,head.py); ctx.stroke()
      const glow=ctx.createRadialGradient(head.px,head.py,0,head.px,head.py,sz*2.6)
      glow.addColorStop(0,`rgba(22,22,22,${a*0.5})`); glow.addColorStop(1,'rgba(22,22,22,0)')
      ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(head.px,head.py,sz*2.6,0,Math.PI*2); ctx.fill()
      ctx.fillStyle=`rgba(12,12,12,${a})`
      ctx.beginPath(); ctx.arc(head.px,head.py,sz*0.62,0,Math.PI*2); ctx.fill()
      ctx.restore()
    }

    // ── Nodes
    const sorted=[...nodes].sort((a,b)=>a.rz-b.rz)
    for(const n of sorted){
      const isH=n.id===hoveredId, hi=!focusId||focused.has(n.id), fa=focusId&&!hi
      const df=0.28+0.72*n.depth, r=n.baseRadius*(0.72+0.28*n.depth), nA=fa?0.07:df
      ctx.save(); ctx.globalAlpha=nA
      if(n.depth>0.52&&!fa){
        ctx.shadowColor='rgba(0,0,0,0.3)'; ctx.shadowBlur=10*n.depth
        ctx.shadowOffsetX=2*n.depth; ctx.shadowOffsetY=2.5*n.depth
      }
      ctx.fillStyle=NODE_COLOR[n.group]; ctx.beginPath(); ctx.arc(n.px,n.py,r,0,Math.PI*2); ctx.fill()
      ctx.shadowBlur=0; ctx.shadowOffsetX=0; ctx.shadowOffsetY=0
      if(isH){
        const pulse=0.5+0.5*Math.sin(t*4.5)
        ctx.globalAlpha=df*(0.5+0.3*pulse); ctx.strokeStyle='#111'; ctx.lineWidth=2
        ctx.beginPath(); ctx.arc(n.px,n.py,r+6,0,Math.PI*2); ctx.stroke()
        ctx.globalAlpha=df*(0.18+0.12*pulse); ctx.lineWidth=1.2
        ctx.beginPath(); ctx.arc(n.px,n.py,r+13,0,Math.PI*2); ctx.stroke()
      }
      ctx.restore()

      if(!fa){
        const isFront=n.depth>=0.5
        const lA=isFront
          ?(isH?1.0:0.72)*Math.max(0,(n.depth-0.3)/0.7)
          :(isH?0.48:0.32)
        if(lA>0.01){
          ctx.save()
          ctx.globalAlpha=lA; ctx.textAlign='center'; ctx.textBaseline='top'
          ctx.font=isH?`500 11px ${FONT}`:`400 10px ${FONT}`
          ctx.fillStyle=isFront?(isH?'#111':'#2a2a2a'):'#b2b2b2'
          ctx.fillText(n.name, n.px, n.py+r+6)
          if(!isH){
            ctx.font=`300 8.5px ${FONT}`
            ctx.fillStyle=isFront?'#666':'#c8c8c8'
            ctx.globalAlpha=lA*(isFront?0.5:0.75)
            ctx.fillText(n.role, n.px, n.py+r+19)
          }
          ctx.restore()
        }
      }
    }

    // ── Industry cluster boundaries + labels
    const trans=viewTransRef.current
    if(trans>0.05){
      const top3=top3IndustriesRef.current
      const fadeIn=Math.min(1,(trans-0.05)/0.50)

      const indNodeMap=new Map<string,SphereNode[]>()
      for(const n of nodes){
        const ind=metaMap.get(n.id)?.industry||'未分类'
        if(!indNodeMap.has(ind)) indNodeMap.set(ind,[])
        indNodeMap.get(ind)!.push(n)
      }

      for(const [ind,indNodes] of indNodeMap){
        const avgDepth=indNodes.reduce((s,n)=>s+n.depth,0)/indNodes.length
        if(avgDepth<0.26) continue
        const bCx=indNodes.reduce((s,n)=>s+n.px,0)/indNodes.length
        const bCy=indNodes.reduce((s,n)=>s+n.py,0)/indNodes.length
        let maxReach=0
        for(const n of indNodes){
          const nr=n.baseRadius*(0.72+0.28*n.depth)
          const dx=n.px-bCx, dy=n.py-bCy
          maxReach=Math.max(maxReach,Math.sqrt(dx*dx+dy*dy)+nr+26)
        }
        const boundsR=Math.max(maxReach+14,30)
        const isTop=top3.includes(ind)
        const a=fadeIn*(0.28+0.72*avgDepth)

        ctx.save()
        ctx.globalAlpha=a*(isTop?0.50:0.32)
        ctx.strokeStyle='#2a2a2a'
        ctx.lineWidth=isTop?1.1:0.72
        ctx.setLineDash(isTop?[6,6]:[4,8])
        ctx.beginPath(); ctx.arc(bCx,bCy,boundsR,0,Math.PI*2); ctx.stroke()
        ctx.setLineDash([])

        const labelY=bCy-boundsR-5
        ctx.textAlign='center'
        if(isTop){
          const rank=top3.indexOf(ind)+1
          ctx.globalAlpha=a*0.40; ctx.font=`300 8px ${FONT}`; ctx.fillStyle='#666'
          ctx.textBaseline='bottom'; ctx.fillText(`#${rank}`,bCx,labelY-13)
          ctx.globalAlpha=a; ctx.font=`500 13px ${FONT}`; ctx.fillStyle='#111'
          ctx.textBaseline='bottom'; ctx.fillText(ind,bCx,labelY)
        } else {
          ctx.globalAlpha=a*0.68; ctx.font=`300 9px ${FONT}`; ctx.fillStyle='#555'
          ctx.textBaseline='bottom'; ctx.fillText(ind,bCx,labelY)
        }
        ctx.restore()
      }
    }

    // close entrance scale transform
    ctx.restore()
    ctx.globalAlpha = 1
  }, [])

  // ── Find node ──────────────────────────────────────────────────────────
  const findNode = useCallback((mx:number, my:number) => {
    const sorted=[...simRef.current.nodes].sort((a,b)=>b.rz-a.rz)
    for(const n of sorted){
      const r=n.baseRadius*(0.72+0.28*n.depth)
      const dx=mx-n.px, dy=my-n.py
      if(Math.sqrt(dx*dx+dy*dy)<=r+10) return n
      const labelHalfW=48, labelTop=n.py+r+2, labelBottom=n.py+r+34
      const lD=(n.depth-0.3)/0.7
      if(lD>0.02&&Math.abs(dx)<=labelHalfW&&my>=labelTop&&my<=labelBottom) return n
    }
    return null
  }, [])

  // ── Mouse handlers ─────────────────────────────────────────────────────
  const onMouseMove = useCallback((e:MouseEvent) => {
    const canvas=canvasRef.current; if(!canvas) return
    const rect=canvas.getBoundingClientRect()
    const sx=simRef.current.w/rect.width, sy=simRef.current.h/rect.height
    const mx=(e.clientX-rect.left)*sx, my=(e.clientY-rect.top)*sy
    if(drag.current.on){
      const rawVx=(e.clientX-drag.current.lx)*0.009
      const rawVy=(e.clientY-drag.current.ly)*0.009
      if(Math.abs(e.clientX-drag.current.lx)>4||Math.abs(e.clientY-drag.current.ly)>4) dragMoved.current=true
      drag.current.vx=Math.max(-0.040,Math.min(0.040,rawVx))
      drag.current.vy=Math.max(-0.040,Math.min(0.040,rawVy))
      simRef.current.rotY+=drag.current.vx
      simRef.current.rotX+=drag.current.vy
      drag.current.lx=e.clientX; drag.current.ly=e.clientY
    } else {
      const hit=findNode(mx,my)
      simRef.current.hoveredId=hit?.id??null
      const m=hit?simRef.current.metaMap.get(hit.id):undefined
      setHovered(hit&&m?{node:hit,meta:m,wx:simRef.current.w,wy:simRef.current.h}:null)
    }
  }, [findNode])

  const onMouseDown = useCallback((e:MouseEvent) => {
    drag.current={on:true,lx:e.clientX,ly:e.clientY,vx:0,vy:0}
    dragMoved.current=false
    simRef.current.hoveredId=null; setHovered(null)
  }, [])
  const onMouseUp    = useCallback(()=>{ drag.current.on=false }, [])
  const onMouseLeave = useCallback(()=>{ simRef.current.hoveredId=null; setHovered(null) }, [])

  const onClickCanvas = useCallback((e:MouseEvent) => {
    if (dragMoved.current) return
    const canvas=canvasRef.current; if(!canvas) return
    const rect=canvas.getBoundingClientRect()
    const sx=simRef.current.w/rect.width, sy=simRef.current.h/rect.height
    const mx=(e.clientX-rect.left)*sx, my=(e.clientY-rect.top)*sy
    const hit=findNode(mx,my)
    if(hit) onNodeClick?.(hit.id)
  }, [findNode, onNodeClick])

  // ── Main loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas=canvasRef.current
    const container=containerRef.current
    if(!canvas||!container) return

    // During sidebar CSS transition (300ms), only update simRef.w/h so the
    // sphere centre shifts smoothly. Debounce the actual canvas bitmap resize
    // to after the transition settles — resetting canvas.width clears the bitmap.
    let resizeDebounce=0
    const resizeCanvas=()=>{
      const dpr=Math.min(window.devicePixelRatio||1,2)
      const w=container.offsetWidth, h=container.offsetHeight
      if(w===0||h===0) return
      // Always update logical centre immediately — no flicker
      simRef.current.w=w; simRef.current.h=h
      // Debounce the bitmap resize to after the CSS transition finishes (~350ms)
      clearTimeout(resizeDebounce)
      resizeDebounce=window.setTimeout(()=>{
        const w2=container.offsetWidth, h2=container.offsetHeight
        if(w2===0||h2===0) return
        const tw=Math.round(w2*dpr), th=Math.round(h2*dpr)
        if(canvas.width===tw && canvas.height===th) return
        canvas.width=tw; canvas.height=th
        canvas.style.width=`${w2}px`; canvas.style.height=`${h2}px`
        const ctx=canvas.getContext('2d')
        if(ctx) ctx.setTransform(dpr,0,0,dpr,0,0)
        simRef.current.w=w2; simRef.current.h=h2
      }, 350)
    }

    // Full init — only called once on mount (or when contacts change)
    const setup=()=>{
      const dpr=Math.min(window.devicePixelRatio||1,2)
      const w=container.offsetWidth, h=container.offsetHeight
      if(w===0||h===0) return
      canvas.width=w*dpr; canvas.height=h*dpr
      canvas.style.width=`${w}px`; canvas.style.height=`${h}px`
      const ctx=canvas.getContext('2d')
      if(ctx) ctx.setTransform(dpr,0,0,dpr,0,0)
      init(w,h)
    }

    setup()
    canvas.addEventListener('mousemove',  onMouseMove)
    canvas.addEventListener('mousedown',  onMouseDown)
    canvas.addEventListener('mouseleave', onMouseLeave)
    canvas.addEventListener('click',      onClickCanvas)
    window.addEventListener('mouseup',    onMouseUp)
    window.addEventListener('resize',     resizeCanvas)
    const ro = new ResizeObserver(() => resizeCanvas())
    ro.observe(container)

    const loop=()=>{
      timeRef.current+=0.016
      // Drive entrance explosion (completes in ~25 frames ≈ 400ms)
      if (!entranceRef.current.done) {
        entranceRef.current.progress = Math.min(entranceRef.current.progress + 0.04, 1)
        if (entranceRef.current.progress >= 1) entranceRef.current.done = true
      }
      const targetTrans=activeViewRef.current==='industry'?1:0
      viewTransRef.current+=(targetTrans-viewTransRef.current)*0.028
      if(!drag.current.on){
        simRef.current.rotY+=drag.current.vx*0.5
        simRef.current.rotX+=drag.current.vy*0.5
        drag.current.vx*=0.55
        drag.current.vy*=0.55
        if(simRef.current.targetRot){
          // Smooth rotation toward focused node
          const tx=simRef.current.targetRot.x
          const ty=simRef.current.targetRot.y
          simRef.current.rotX+=(tx-simRef.current.rotX)*0.07
          simRef.current.rotY+=(ty-simRef.current.rotY)*0.07
          if(Math.abs(tx-simRef.current.rotX)<0.002&&Math.abs(ty-simRef.current.rotY)<0.002){
            simRef.current.targetRot=null
          }
        } else if(!simRef.current.hoveredId&&!simRef.current.externalFocusId){
          simRef.current.rotY+=0.0004
          simRef.current.rotX+=(0.28-simRef.current.rotX)*0.004
        }
      }
      updateEffects(); project(); draw()
      rafRef.current=requestAnimationFrame(loop)
    }
    rafRef.current=requestAnimationFrame(loop)

    return ()=>{
      cancelAnimationFrame(rafRef.current)
      clearTimeout(resizeDebounce)
      canvas.removeEventListener('mousemove',  onMouseMove)
      canvas.removeEventListener('mousedown',  onMouseDown)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      canvas.removeEventListener('click',      onClickCanvas)
      window.removeEventListener('mouseup',    onMouseUp)
      window.removeEventListener('resize',     resizeCanvas)
      ro.disconnect()
    }
  }, [init, project, draw, updateEffects, onMouseMove, onMouseDown, onMouseLeave, onMouseUp, onClickCanvas])

  // Sync zoom state → ref
  useEffect(() => { zoomRef.current = zoom }, [zoom])

  // External focus: highlight + smooth rotate toward focused node
  useEffect(() => {
    simRef.current.externalFocusId = focusContactId ?? null
    if (focusContactId) {
      const node = simRef.current.nodeMap.get(focusContactId)
      if (node) {
        const { bx, by, bz } = node
        const r = Math.sqrt(bx * bx + bz * bz)
        const targetY = -Math.atan2(bx, bz)
        const targetX = r < 0.001 ? (by > 0 ? -Math.PI / 2 : Math.PI / 2) : -Math.atan2(by, r)
        // Normalize Y to shortest rotation path
        let dY = targetY - simRef.current.rotY
        while (dY > Math.PI) dY -= 2 * Math.PI
        while (dY < -Math.PI) dY += 2 * Math.PI
        simRef.current.targetRot = { x: targetX, y: simRef.current.rotY + dY }
      }
    } else {
      simRef.current.targetRot = null
    }
  }, [focusContactId])

  const { edges } = simRef.current
  const primCount = edges.filter(e=>e.type==='primary').length
  const secCount  = edges.filter(e=>e.type==='secondary').length
  const auxCount  = edges.filter(e=>e.type==='auxiliary').length

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 40% 36%, #fafafa 0%, #f4f4f4 35%, #eeeeee 70%, #e8e8e8 100%)',
        fontFamily: FONT,
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor: hovered ? 'pointer' : 'grab' }}
      />

      {/* Hovered node card */}
      {hovered && <NodeCard node={hovered.node} meta={hovered.meta} wx={hovered.wx} wy={hovered.wy} />}

      {/* Stats */}
      <div className="absolute top-8 right-10 pointer-events-none select-none text-right">
        <div style={{ fontSize:10, color:'#999', letterSpacing:'0.18em', marginBottom:10 }}>总览</div>
        {[{ label:'节点', val:contacts.length },{ label:'连接', val:relations.length }].map(r=>(
          <div key={r.label} style={{ display:'flex', alignItems:'baseline', justifyContent:'flex-end', gap:10, marginBottom:5 }}>
            <span style={{ fontSize:11, color:'#aaa', letterSpacing:'0.1em' }}>{r.label}</span>
            <span style={{ fontSize:22, color:'#222', letterSpacing:'-0.02em' }}>{r.val}</span>
          </div>
        ))}
      </div>

      {/* Edge legend */}
      <div className="absolute bottom-9 left-10 pointer-events-none select-none">
        <div style={{ fontSize:10, color:'#999', letterSpacing:'0.18em', marginBottom:10 }}>连接类型</div>
        {([
          { type:'primary'   as EdgeType, count:primCount },
          { type:'secondary' as EdgeType, count:secCount  },
          { type:'auxiliary' as EdgeType, count:auxCount  },
        ]).map(({ type, count })=>{
          const cfg=EDGE_CFG[type]
          return (
            <div key={type} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
              <svg width="36" height="10" style={{ flexShrink:0 }}>
                <line x1="2" y1="5" x2="34" y2="5" stroke={cfg.color}
                  strokeWidth={cfg.width*1.15} strokeDasharray={cfg.dash.join(',')}
                  strokeOpacity={cfg.alpha+0.22} strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize:12, color:'#333' }}>{cfg.zh}</span>
              <span style={{ fontSize:11, color:'#bbb', marginLeft:'auto' }}>{count}</span>
            </div>
          )
        })}
      </div>

      {/* View selector — right middle */}
      <div className="absolute select-none" style={{ right:40, top:'50%', transform:'translateY(-50%)' }}>
        <div style={{ fontSize:10, color:'#999', letterSpacing:'0.18em', marginBottom:12, textAlign:'right' }}>
          视角
        </div>
        <button
          onClick={()=>setActiveView(v=>v==='industry'?null:'industry')}
          style={{
            display:'flex', alignItems:'center', gap:9,
            background:activeView==='industry'?'rgba(40,40,40,0.10)':'transparent',
            border:activeView==='industry'?'1px solid rgba(0,0,0,0.18)':'1px solid rgba(0,0,0,0.09)',
            padding:'6px 10px', cursor:'pointer', width:'100%', justifyContent:'flex-end',
            fontFamily:FONT,
          }}
        >
          <span style={{
            fontSize:11, color:activeView==='industry'?'#111':'#666',
            letterSpacing:'0.04em', whiteSpace:'nowrap',
          }}>
            行业属性视角
          </span>
          <div style={{
            width:5, height:5, borderRadius:'50%', flexShrink:0,
            background:activeView==='industry'?'#2a2a2a':'rgba(0,0,0,0.18)',
          }}/>
        </button>
      </div>

      {/* Group legend */}
      <div className="absolute bottom-36 right-10 pointer-events-none select-none text-right">
        <div style={{ fontSize:10, color:'#999', letterSpacing:'0.18em', marginBottom:10 }}>人脉类型</div>
        {(Object.entries(NODE_COLOR) as [Group,string][]).map(([g,c])=>(
          <div key={g} style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:8, marginBottom:8 }}>
            <span style={{ fontSize:12, color:'#666' }}>{GROUP_ZH[g]}</span>
            <div style={{
              width:9, height:9, borderRadius:'50%', backgroundColor:c,
              boxShadow:'0 1px 3px rgba(0,0,0,0.25)', flexShrink:0,
            }}/>
          </div>
        ))}
      </div>

      {/* Zoom controls — bottom right */}
      <div className="absolute select-none" style={{ bottom:32, right:10 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {([
            { label:'+', title:'放大',   action:()=>setZoom(z=>Math.min(z*1.25, 4))    },
            { label:'−', title:'缩小',   action:()=>setZoom(z=>Math.max(z/1.25, 0.25)) },
            { label:'⊡', title:'铺满画布', action:()=>setZoom(1.04)                     },
          ] as const).map(btn=>(
            <button
              key={btn.title}
              onClick={btn.action}
              title={btn.title}
              style={{
                width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center',
                background:'rgba(255,255,255,0.6)', backdropFilter:'blur(8px)',
                WebkitBackdropFilter:'blur(8px)',
                border:'1px solid rgba(0,0,0,0.12)', cursor:'pointer',
                fontSize:btn.label==='⊡'?14:18, color:'#333', fontFamily:'monospace',
                transition:'background 0.15s',
              }}
              onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.9)')}
              onMouseLeave={e=>(e.currentTarget.style.background='rgba(255,255,255,0.6)')}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Signature */}
      <div
        className="absolute pointer-events-none select-none"
        style={{ bottom:32, left:'50%', transform:'translateX(-50%)', fontSize:11, color:'#bbb', letterSpacing:'0.12em' }}
      >
        Xminer 智能社交关系网络图
      </div>
    </div>
  )
}
