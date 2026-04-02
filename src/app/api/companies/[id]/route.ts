import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'



type Params = { params: Promise<{ id: string }> }

function parseMultiValue(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean)
}

// GET /api/companies/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const userId = await getAuthUserId()
  const { id } = await params

  const company = await db.company.findFirst({
    where: { id, userId },
    include: {
      contacts: { select: { id: true, name: true, relationRole: true } },
      relationsA: { include: { companyB: { select: { id: true, name: true, industry: true } } } },
      relationsB: { include: { companyA: { select: { id: true, name: true, industry: true } } } },
    },
  })

  if (!company) return NextResponse.json({ error: '未找到' }, { status: 404 })
  return NextResponse.json({ company })
}

// PATCH /api/companies/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const userId = await getAuthUserId()
  const { id } = await params

  const existing = await db.company.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: '未找到' }, { status: 404 })

  const body: Record<string, unknown> = await req.json()

  const tags = body.tags !== undefined
    ? (Array.isArray(body.tags) ? body.tags as string[] : parseMultiValue(body.tags as string))
    : undefined
  const investors = body.investors !== undefined
    ? (Array.isArray(body.investors) ? body.investors as string[] : parseMultiValue(body.investors as string))
    : undefined
  const upstreams = body.upstreams !== undefined
    ? (Array.isArray(body.upstreams) ? body.upstreams as string[] : parseMultiValue(body.upstreams as string))
    : undefined
  const downstreams = body.downstreams !== undefined
    ? (Array.isArray(body.downstreams) ? body.downstreams as string[] : parseMultiValue(body.downstreams as string))
    : undefined

  const company = await db.company.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: (body.name as string).trim() } : {}),
      ...(body.mainBusiness !== undefined ? { mainBusiness: body.mainBusiness as string || null } : {}),
      ...(body.website !== undefined ? { website: body.website as string || null } : {}),
      ...(body.scale !== undefined ? { scale: body.scale as never } : {}),
      ...(body.industry !== undefined ? { industry: body.industry as string || null } : {}),
      ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}),
      ...(body.founderName !== undefined ? { founderName: body.founderName as string || null } : {}),
      ...(body.founderContactId !== undefined ? { founderContactId: body.founderContactId as string || null } : {}),
      ...(investors !== undefined ? { investors: JSON.stringify(investors) } : {}),
      ...(upstreams !== undefined ? { upstreams: JSON.stringify(upstreams) } : {}),
      ...(downstreams !== undefined ? { downstreams: JSON.stringify(downstreams) } : {}),
      ...(body.familiarityLevel !== undefined ? { familiarityLevel: body.familiarityLevel ? parseInt(body.familiarityLevel as string) : null } : {}),
      ...(body.temperature !== undefined ? { temperature: body.temperature as never } : {}),
      ...(body.energyScore !== undefined ? { energyScore: parseInt(body.energyScore as string) } : {}),
      ...(body.notes !== undefined ? { notes: body.notes as string || null } : {}),
    },
  })

  return NextResponse.json({ company })
}

// DELETE /api/companies/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const userId = await getAuthUserId()
  const { id } = await params

  const existing = await db.company.findFirst({ where: { id, userId } })
  if (!existing) return NextResponse.json({ error: '未找到' }, { status: 404 })

  await db.company.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
