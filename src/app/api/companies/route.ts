import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import { syncCompaniesFromContacts } from '@/lib/company-sync'



function parseMultiValue(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean)
}

// GET /api/companies — list
export async function GET(req: NextRequest) {
  const userId = await getAuthUserId()
  await syncCompaniesFromContacts(userId)
  const { searchParams } = new URL(req.url)
  const scale = searchParams.get('scale')
  const q = searchParams.get('q')

  const companies = await db.company.findMany({
    where: {
      userId,
      ...(scale ? { scale: scale as never } : {}),
      ...(q ? { name: { contains: q } } : {}),
    },
    include: { contacts: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ companies })
}

// POST /api/companies — create
export async function POST(req: NextRequest) {
  const userId = await getAuthUserId()

  let body: Record<string, unknown>
  const ct = req.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) {
    body = await req.json()
  } else {
    const fd = await req.formData()
    body = Object.fromEntries(fd.entries())
  }

  const name = (body.name as string)?.trim()
  if (!name) return NextResponse.json({ error: '公司名称不能为空' }, { status: 400 })

  // Parse multi-value fields
  const tags = Array.isArray(body.tags)
    ? (body.tags as string[])
    : parseMultiValue(body.tags as string)

  const investors = Array.isArray(body.investors)
    ? (body.investors as string[])
    : parseMultiValue(body.investors as string)

  const upstreams = Array.isArray(body.upstreams)
    ? (body.upstreams as string[])
    : parseMultiValue(body.upstreams as string)

  const downstreams = Array.isArray(body.downstreams)
    ? (body.downstreams as string[])
    : parseMultiValue(body.downstreams as string)

  const existing = await db.company.findFirst({
    where: {
      userId,
      name: { equals: name, mode: 'insensitive' },
    },
    select: { id: true },
  })

  const company = existing
    ? await db.company.update({
        where: { id: existing.id },
        data: {
          mainBusiness: (body.mainBusiness as string) || null,
          website: (body.website as string) || null,
          scale: (body.scale as never) || null,
          industry: (body.industry as string) || null,
          tags: JSON.stringify(tags),
          founderName: (body.founderName as string) || null,
          founderContactId: (body.founderContactId as string) || null,
          investors: JSON.stringify(investors),
          upstreams: JSON.stringify(upstreams),
          downstreams: JSON.stringify(downstreams),
          familiarityLevel: body.familiarityLevel ? parseInt(body.familiarityLevel as string) : null,
          temperature: (body.temperature as never) || null,
          energyScore: body.energyScore ? parseInt(body.energyScore as string) : 50,
          notes: (body.notes as string) || null,
        },
      })
    : await db.company.create({
        data: {
          userId,
          name,
          mainBusiness: (body.mainBusiness as string) || null,
          website: (body.website as string) || null,
          scale: (body.scale as never) || null,
          industry: (body.industry as string) || null,
          tags: JSON.stringify(tags),
          founderName: (body.founderName as string) || null,
          founderContactId: (body.founderContactId as string) || null,
          investors: JSON.stringify(investors),
          upstreams: JSON.stringify(upstreams),
          downstreams: JSON.stringify(downstreams),
          familiarityLevel: body.familiarityLevel ? parseInt(body.familiarityLevel as string) : null,
          temperature: (body.temperature as never) || null,
          energyScore: body.energyScore ? parseInt(body.energyScore as string) : 50,
          notes: (body.notes as string) || null,
        },
      })

  await db.contact.updateMany({
    where: {
      userId,
      company: { equals: company.name, mode: 'insensitive' },
    },
    data: {
      companyId: company.id,
      company: company.name,
    },
  })

  const isJson = ct.includes('application/json')
  if (isJson) return NextResponse.json({ company })
  return NextResponse.redirect(new URL('/companies', req.url))
}
