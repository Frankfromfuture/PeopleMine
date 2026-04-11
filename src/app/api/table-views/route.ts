import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'

type TableName = 'contacts' | 'companies'

type TableViewRecord = {
  id: string
  table: TableName
  name: string
  config: Record<string, unknown>
  updatedAt: string
}

type StoredMeta = {
  legacyRole: string | null
  tableViews: TableViewRecord[]
}



function parseRoleMeta(raw: string | null): StoredMeta {
  if (!raw) return { legacyRole: null, tableViews: [] }
  try {
    const parsed = JSON.parse(raw) as StoredMeta
    if (Array.isArray(parsed.tableViews)) return parsed
  } catch {
    return { legacyRole: raw, tableViews: [] }
  }
  return { legacyRole: null, tableViews: [] }
}

function stringifyRoleMeta(meta: StoredMeta) {
  return JSON.stringify(meta)
}

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId()
  const table = (req.nextUrl.searchParams.get('table') || 'contacts') as TableName

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  const meta = parseRoleMeta(user?.role ?? null)
  const views = meta.tableViews
    .filter((v) => v.table === table)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

  return NextResponse.json({ views })
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId()
  const body = await req.json()

  const table = (body.table || 'contacts') as TableName
  const name = String(body.name || '').trim()
  const config = (body.config || {}) as Record<string, unknown>

  if (!name) return NextResponse.json({ error: '视图名称不能为空' }, { status: 400 })

  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
  const meta = parseRoleMeta(user?.role ?? null)

  const now = new Date().toISOString()
  const newRecord: TableViewRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    table,
    name,
    config,
    updatedAt: now,
  }

  meta.tableViews = [newRecord, ...meta.tableViews.filter((v) => !(v.table === table && v.name === name))].slice(0, 50)

  await db.user.update({
    where: { id: userId },
    data: { role: stringifyRoleMeta(meta) },
  })

  return NextResponse.json({ view: newRecord })
}

export async function PATCH(req: NextRequest) {
  const userId = await getAuthUserId()
  const body = await req.json()
  const id = String(body.id || '')
  const name = String(body.name || '').trim()

  if (!id || !name) return NextResponse.json({ error: '缺少参数' }, { status: 400 })

  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
  const meta = parseRoleMeta(user?.role ?? null)

  meta.tableViews = meta.tableViews.map((v) =>
    v.id === id ? { ...v, name, updatedAt: new Date().toISOString() } : v
  )

  await db.user.update({
    where: { id: userId },
    data: { role: stringifyRoleMeta(meta) },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const userId = await getAuthUserId()
  const id = req.nextUrl.searchParams.get('id')

  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
  const meta = parseRoleMeta(user?.role ?? null)
  meta.tableViews = meta.tableViews.filter((v) => v.id !== id)

  await db.user.update({
    where: { id: userId },
    data: { role: stringifyRoleMeta(meta) },
  })

  return NextResponse.json({ success: true })
}
