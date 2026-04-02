import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'

function normalizeTagLibrary(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  return Array.from(
    new Set(
      input
        .map((v) => (typeof v === 'string' ? v.trim() : ''))
        .filter(Boolean),
    ),
  )
}

function parseManualTags(raw: unknown): string[] {
  if (typeof raw !== 'string') return []
  return Array.from(
    new Set(
      raw
        .split(/[,\uff0c\u3001;\n]/)
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  )
}



export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId()
    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role')
    const animal = searchParams.get('animal')

    const contacts = await db.contact.findMany({
      where: {
        userId,
        ...(role ? { relationRole: role as never } : {}),
        ...(animal ? { spiritAnimal: animal as never } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ contacts })
  } catch {
    return NextResponse.json({ contacts: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId()
    const contentType = req.headers.get('content-type') ?? ''
    const isJson = contentType.includes('application/json')
    const body = isJson
      ? await req.json()
      : await req.formData().then((fd) => ({
          name: String(fd.get('name') ?? ''),
          relationRole: String(fd.get('relationRole') ?? ''),
          tags: fd.getAll('tags').map((v) => String(v)),
          spiritAnimal: fd.get('spiritAnimal') ? String(fd.get('spiritAnimal')) : null,
          company: fd.get('company') ? String(fd.get('company')) : null,
          companyId: fd.get('companyId') ? String(fd.get('companyId')) : null,
          title: fd.get('title') ? String(fd.get('title')) : null,
          jobPosition: fd.get('jobPosition') ? String(fd.get('jobPosition')) : null,
          phone: fd.get('phone') ? String(fd.get('phone')) : null,
          wechat: fd.get('wechat') ? String(fd.get('wechat')) : null,
          email: fd.get('email') ? String(fd.get('email')) : null,
          notes: fd.get('notes') ? String(fd.get('notes')) : null,
          trustLevel: fd.get('trustLevel') ? Number(fd.get('trustLevel')) : null,
          temperature: fd.get('temperature') ? String(fd.get('temperature')) : null,
          tagLibrary: (() => { try { const p = JSON.parse(String(fd.get('tagLibrary') ?? '[]')); return Array.isArray(p) ? p : [] } catch { return [] } })(),
          manualTags: fd.get('manualTags') ? String(fd.get('manualTags')) : '',
          companyIndustry: fd.get('companyIndustry') ? String(fd.get('companyIndustry')) : null,
          companyScale: fd.get('companyScale') ? String(fd.get('companyScale')) : null,
          companyMainBusiness: fd.get('companyMainBusiness') ? String(fd.get('companyMainBusiness')) : null,
        }))

    console.log('[contacts POST] received body:', JSON.stringify(body))
    console.log('[contacts POST] userId:', userId)

    if (!body.name || !body.relationRole) {
      return NextResponse.json({ error: '请填写姓名并选择关系角色' }, { status: 400 })
    }

    const manualTags = parseManualTags(body.manualTags)
    const mergedTags = Array.from(
      new Set([...(Array.isArray(body.tags) ? body.tags : []), ...manualTags]),
    )

    const selectedCompanyId = typeof body.companyId === 'string' ? body.companyId.trim() : ''
    let linkedCompanyId: string | null = null
    let companyNameForContact = (body.company as string | null) ?? null

    if (selectedCompanyId) {
      const selected = await db.company.findFirst({
        where: { id: selectedCompanyId, userId },
        select: { id: true, name: true },
      })
      if (selected) {
        linkedCompanyId = selected.id
        companyNameForContact = selected.name
      }
    }

    const contact = await db.contact.create({
      data: {
        userId,
        name: body.name,
        relationRole: body.relationRole as never,
        tags: mergedTags.length > 0 ? JSON.stringify(mergedTags) : null,
        spiritAnimal: (body.spiritAnimal as never) ?? null,
        company: companyNameForContact,
        companyId: linkedCompanyId,
        title: body.title ?? null,
        jobPosition: body.jobPosition ?? null,
        phone: body.phone ?? null,
        wechat: body.wechat ?? null,
        email: body.email ?? null,
        temperature: (body.temperature as never) ?? null,
        trustLevel: body.trustLevel ? Number(body.trustLevel) : null,
        notes: body.notes ?? null,
        energyScore: 50,
      },
    })

    const tagLibrary = normalizeTagLibrary([...(Array.isArray(body.tagLibrary) ? body.tagLibrary : []), ...manualTags])
    if (tagLibrary.length > 0) {
      await db.user.update({
        where: { id: userId },
        data: { industry: JSON.stringify(tagLibrary) },
      })
    }

    // Create / link company if company name was provided
    const companyName = (body.company as string)?.trim()
    if (!linkedCompanyId && companyName) {
      try {
        let company = await db.company.findFirst({ where: { userId, name: companyName } })
        if (!company) {
          company = await db.company.create({
            data: {
              userId,
              name: companyName,
              industry: (body.companyIndustry as string) || null,
              scale: (body.companyScale as never) || null,
              mainBusiness: (body.companyMainBusiness as string) || null,
              tags: JSON.stringify([]),
              energyScore: 50,
            },
          })
        }
        await db.contact.update({ where: { id: contact.id }, data: { companyId: company.id } })
      } catch (err) {
        console.error('[contacts POST] company link failed:', err)
      }
    }

    if (!isJson) {
      return NextResponse.redirect(new URL('/contacts', req.url), { status: 303 })
    }
    return NextResponse.json({ contact }, { status: 201 })
  } catch (err) {
    console.error('[contacts POST]', err)
    return NextResponse.json({ error: '创建失败', detail: String(err) }, { status: 500 })
  }
}
