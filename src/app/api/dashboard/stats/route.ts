import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'

export const dynamic = 'force-dynamic'

function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000)
}

function clamp(v: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v))
}

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
  const highEnergy = contacts.filter((contact) => (contact.energyScore ?? 50) >= 70).length
  const prevWeekTotal = contacts.filter((contact) => contact.createdAt <= oneWeekAgo).length
  const prevWeekHighEnergy = contacts.filter(
    (contact) => contact.createdAt <= oneWeekAgo && (contact.energyScore ?? 50) >= 70,
  ).length

  const withDays = contacts.map((contact) => {
    const anchor = contact.lastContactedAt ?? contact.createdAt
    return {
      ...contact,
      lastDays: daysBetween(anchor, now),
    }
  })

  const needsMaintenance = withDays.filter((contact) => contact.lastDays > 30).length
  const maintenanceList = withDays
    .sort((a, b) => b.lastDays - a.lastDays)
    .slice(0, 10)
    .map((contact, index) => ({
      rank: index + 1,
      id: contact.id,
      name: contact.name,
      title: contact.title || contact.jobTitle || '',
      company: contact.company || contact.companyName || '',
      lastDays: contact.lastDays,
      energyScore: contact.energyScore ?? 50,
      temperature: contact.temperature as string | null,
    }))

  const monthlyGrowth: { month: string; value: number }[] = []
  for (let i = 11; i >= 0; i -= 1) {
    const cursor = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const cutoff = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    monthlyGrowth.push({
      month: `${cursor.getMonth() + 1}月`,
      value: contacts.filter((contact) => contact.createdAt < cutoff).length,
    })
  }

  const dayBuckets = new Map<string, number>()
  for (const contact of contacts) {
    if (contact.createdAt < oneYearAgo) continue
    const key = contact.createdAt.toISOString().slice(0, 10)
    dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1)
  }

  const dailyActivity: number[] = []
  for (let i = 364; i >= 0; i -= 1) {
    const day = new Date(now)
    day.setDate(day.getDate() - i)
    const key = day.toISOString().slice(0, 10)
    const raw = dayBuckets.get(key) ?? 0
    const level = raw === 0 ? 0 : raw <= 2 ? 1 : raw <= 5 ? 2 : raw <= 10 ? 3 : 4
    dailyActivity.push(level)
  }

  const roleGroups = {
    social: ['GATEWAY', 'THERMOMETER', 'BINDER', 'EVANGELIST'],
    influence: ['LIGHTHOUSE', 'BIG_INVESTOR', 'BREAKER'],
  }

  const socialCount = contacts.filter((contact) => roleGroups.social.includes(contact.roleArchetype ?? '')).length
  const influenceCount = contacts.filter((contact) =>
    roleGroups.influence.includes(contact.roleArchetype ?? ''),
  ).length
  const distinctIndustries = new Set(contacts.map((contact) => contact.industryL1).filter(Boolean)).size
  const resourceCount = contacts.filter((contact) =>
    ['BIG_INVESTOR', 'GATEWAY'].includes(contact.roleArchetype ?? ''),
  ).length
  const avgTrust = total
    ? contacts.reduce((sum, contact) => sum + ((contact.trustLevel as number | null) ?? 3), 0) / total
    : 3
  const activeRecent = contacts.filter(
    (contact) => contact.lastContactedAt && contact.lastContactedAt >= thirtyDaysAgo,
  ).length

  const radarData = [
    { trait: '社交力', value: clamp(total ? Math.round((socialCount / total) * 200) : 0) },
    { trait: '影响力', value: clamp(total ? Math.round((influenceCount / total) * 300) : 0) },
    { trait: '行业深度', value: clamp(Math.round((distinctIndustries / 6) * 100)) },
    { trait: '资源整合', value: clamp(total ? Math.round((resourceCount / total) * 200) : 0) },
    { trait: '信任度', value: clamp(Math.round((avgTrust / 5) * 100)) },
    { trait: '活跃度', value: clamp(total ? Math.round((activeRecent / total) * 100) : 0) },
  ]

  const industryCount = new Map<string, number>()
  for (const contact of contacts) {
    if (!contact.industryL1) continue
    industryCount.set(contact.industryL1, (industryCount.get(contact.industryL1) ?? 0) + 1)
  }
  const topIndustries = [...industryCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([industry]) => industry)

  const strongRelationPct = total
    ? Math.round((contacts.filter((contact) => (contact.energyScore ?? 50) >= 70).length / total) * 100)
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
