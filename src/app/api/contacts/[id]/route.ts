import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { RelationRole, SpiritAnimal, Temperature } from '@/types'

async function getRequestUserId() {
  try {
    const { userId } = await requireAuth()
    return userId
  } catch {
    // 开发模式：使用固定的 demo 用户 ID
    return 'dev-user'
  }
}

function parseTags(raw: unknown): string[] {
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

function mergeTags(tags: string[], manualRaw: unknown): string[] {
  const manual = parseTags(typeof manualRaw === 'string' ? manualRaw : '')
  return Array.from(new Set([...tags, ...manual]))
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getRequestUserId()
    const contact = await db.contact.findFirst({
      where: { id: params.id, userId },
    })
    if (!contact) {
      return NextResponse.json({ error: '联系人不存在' }, { status: 404 })
    }
    return NextResponse.json({ contact })
  } catch {
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getRequestUserId()
    const body = await req.json()
    const tagArr = Array.isArray(body.tags) ? body.tags : parseTags(body.tagsCsv)
    const existing = await db.contact.findFirst({ where: { id: params.id, userId } })
    if (!existing) {
      return NextResponse.json({ error: '联系人不存在' }, { status: 404 })
    }
    const selectedCompanyId = typeof body.companyId === 'string' ? body.companyId.trim() : ''
    let linkedCompanyId: string | null = null
    let companyNameForContact: string | null = typeof body.company === 'string' ? body.company : null
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

    const contact = await db.contact.update({
      where: { id: params.id },
      data: {
        name: body.name,
        relationRole: body.relationRole,
        tags: tagArr.length > 0 ? JSON.stringify(tagArr) : null,
        spiritAnimal: body.spiritAnimal || null,
        company: companyNameForContact,
        companyId: linkedCompanyId,
        temperature: body.temperature || null,
        trustLevel: body.trustLevel ? Number(body.trustLevel) : null,
      },
    })
    return NextResponse.json({ contact })
  } catch (err) {
    console.error('[contacts PATCH]', err)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getRequestUserId()
    const existing = await db.contact.findFirst({ where: { id: params.id, userId } })
    if (!existing) {
      return NextResponse.json({ error: '联系人不存在' }, { status: 404 })
    }
    await db.contact.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[contacts DELETE]', err)
    return NextResponse.json({ error: '删除失败' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const form = await req.formData()
    const action = String(form.get('_action') ?? '')
    const userId = await getRequestUserId()

    if (action === 'delete') {
      await db.contact.deleteMany({ where: { id: params.id, userId } })
      return NextResponse.redirect(new URL('/contacts', req.url), { status: 303 })
    }

    if (action === 'update') {
      const existing = await db.contact.findFirst({ where: { id: params.id, userId } })
      if (!existing) {
        return NextResponse.redirect(new URL('/contacts', req.url), { status: 303 })
      }
      const tagArr = mergeTags(form.getAll('tags').map((v) => String(v)), String(form.get('manualTags') ?? ''))
      const relationRoleValue = String(form.get('relationRole') ?? '') as RelationRole
      const spiritAnimalValue = form.get('spiritAnimal') ? (String(form.get('spiritAnimal')) as SpiritAnimal) : null
      const temperatureValue = form.get('temperature') ? (String(form.get('temperature')) as Temperature) : null
      const selectedCompanyId = form.get('companyId') ? String(form.get('companyId')) : ''
      let linkedCompanyId: string | null = null
      let companyNameForContact: string | null = form.get('company') ? String(form.get('company')) : null
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

      await db.contact.update({
        where: { id: params.id },
        data: {
          name: String(form.get('name') ?? ''),
          relationRole: relationRoleValue,
          tags: tagArr.length > 0 ? JSON.stringify(tagArr) : null,
          spiritAnimal: spiritAnimalValue,
          temperature: temperatureValue,
          trustLevel: form.get('trustLevel') ? Number(form.get('trustLevel')) : null,
          company: companyNameForContact,
          companyId: linkedCompanyId,
          title: form.get('title') ? String(form.get('title')) : null,
          jobPosition: form.get('jobPosition') ? String(form.get('jobPosition')) : null,
          wechat: form.get('wechat') ? String(form.get('wechat')) : null,
          phone: form.get('phone') ? String(form.get('phone')) : null,
          email: form.get('email') ? String(form.get('email')) : null,
          notes: form.get('notes') ? String(form.get('notes')) : null,
        },
      })
      return NextResponse.redirect(new URL('/contacts', req.url), { status: 303 })
    }

    return NextResponse.redirect(new URL('/contacts', req.url), { status: 303 })
  } catch (err) {
    console.error('[contacts POST action]', err)
    return NextResponse.redirect(new URL('/contacts', req.url), { status: 303 })
  }
}
