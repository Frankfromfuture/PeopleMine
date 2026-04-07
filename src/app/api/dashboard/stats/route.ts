import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'

export const dynamic = 'force-dynamic'

// ─── helpers ──────────────────────────────────────────────────────────────────

function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000)
}

function clamp(v: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v))
}

// ─── handler ──────────────────────────────────────────────────────────────────

export async function GET() {
  let userId: string
  try {
    userId = await getAuthUserId()
  } catch {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 86_400_000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000)
  const oneYearAgo = new Date(now.getTime() - 365 * 86_400_000)

  // single query — pull only what we need
  const contacts = await db.contact.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      title: true,
      jobTitle: true,
      company: true,
      companyName: true,
      energyScore: true,
      temperature: true,
      trustLevel: true,
      industryL1: true,
      roleArchetype: true,
      lastContactedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  const total = contacts.length

  // ── stat cards ──────────────────────────────────────────────────────────────
  const highEnergy = contacts.filter((c) => (c.energyScore ?? 50) >= 70).length
  const prevWeekTotal = contacts.filter((c) => c.createdAt <= oneWeekAgo).length
  const prevWeekHighEnergy = contacts
    .filter((c) => c.createdAt <= oneWeekAgo && (c.energyScore ?? 50) >= 70)
    .length

  // ── maintenance list ────────────────────────────────────────────────────────
  const withDays = contacts.map((c) => {
    const anchor = c.lastContactedAt ?? c.createdAt
    const days = daysBetween(anchor, now)
    return { ...c, lastDays: days }
  })
  // needs maintenance = >30 days since last contact
  const needsMaintenance = withDays.filter((c) => c.lastDays > 30).length

  const maintenanceList = withDays
    .sort((a, b) => b.lastDays - a.lastDays)
    .slice(0, 10)
    .map((c, i) => ({
      rank: i + 1,
      id: c.id,
      name: c.name,
      title: c.title || c.jobTitle || '',
      company: c.company || c.companyName || '',
      lastDays: c.lastDays,
      energyScore: c.energyScore ?? 50,
      temperature: c.temperature as string | null,
    }))

  // ── monthly growth (last 12 months, cumulative) ─────────────────────────────
  const monthlyGrowth: { month: string; value: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = `${d.getMonth() + 1}月`
    const cutoff = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const count = contacts.filter((c) => c.createdAt < cutoff).length
    monthlyGrowth.push({ month: label, value: count })
  }

  // ── daily activity for contribution grid (last 365 days) ───────────────────
  const dayBuckets = new Map<string, number>()
  for (const c of contacts) {
    if (c.createdAt < oneYearAgo) continue
    const key = c.createdAt.toISOString().slice(0, 10)
    dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1)
  }
  const dailyActivity: number[] = []
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const raw = dayBuckets.get(key) ?? 0
    // map count → level 0-4
    const level = raw === 0 ? 0 : raw <= 2 ? 1 : raw <= 5 ? 2 : raw <= 10 ? 3 : 4
    dailyActivity.push(level)
  }

  // ── traits radar ───────────────────────────────────────────────────────────
  const roleGroups = {
    social:    ['GATEWAY', 'THERMOMETER', 'BINDER', 'EVANGELIST'],
    influence: ['LIGHTHOUSE', 'BIG_INVESTOR', 'BREAKER'],
  }
  const socialCount    = contacts.filter((c) => roleGroups.social.includes(c.roleArchetype ?? '')).length
  const influenceCount = contacts.filter((c) => roleGroups.influence.includes(c.roleArchetype ?? '')).length
  const distinctInds   = new Set(contacts.map((c) => c.industryL1).filter(Boolean)).size
  const resourceCount  = contacts.filter((c) => ['BIG_INVESTOR', 'GATEWAY'].includes(c.roleArchetype ?? '')).length
  const avgTrust       = total
    ? contacts.reduce((s, c) => s + ((c.trustLevel as number | null) ?? 3), 0) / total
    : 3
  const activeRecent   = contacts.filter((c) => c.lastContactedAt && c.lastContactedAt >= thirtyDaysAgo).length

  const radarData = [
    { trait: '社交力',   value: clamp(total ? Math.round((socialCount    / total) * 200) : 0) },
    { trait: '影响力',   value: clamp(total ? Math.round((influenceCount / total) * 300) : 0) },
    { trait: '行业深度', value: clamp(Math.round((distinctInds / 6) * 100)) },
    { trait: '资源整合', value: clamp(total ? Math.round((resourceCount  / total) * 200) : 0) },
    { trait: '信任度',   value: clamp(Math.round((avgTrust / 5) * 100)) },
    { trait: '活跃度',   value: clamp(total ? Math.round((activeRecent   / total) * 100) : 0) },
  ]

  // ── top industries ─────────────────────────────────────────────────────────
  const indCount = new Map<string, number>()
  for (const c of contacts) {
    if (!c.industryL1) continue
    indCount.set(c.industryL1, (indCount.get(c.industryL1) ?? 0) + 1)
  }
  const topIndustries = [...indCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([ind]) => ind)

  // ── strong relation % ──────────────────────────────────────────────────────
  const strongRelationPct = total
    ? Math.round(((contacts.filter((c) => (c.energyScore ?? 50) >= 70).length) / total) * 100)
    : 0

  return NextResponse.json({
    total,
    highEnergy,
    needsMaintenance,
    prevWeekTotal,
    prevWeekHighEnergy,
    maintenanceList,
    monthlyGrowth,
    dailyActivity,
    radarData,
    topIndustries,
    strongRelationPct,
  })
}
