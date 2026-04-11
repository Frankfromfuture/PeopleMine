import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import type {
  QuickContext,
  RoleArchetype,
} from '@/types'
import { mapArchetypeToRole } from '@/types'
import type { Temperature } from '@/types'
import { buildArcForContact, parseQuickContext, parseRelationVector } from '@/lib/arc'

async function getRequestUserId() {
  return getAuthUserId()
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

function parseQuickContextInput(body: Record<string, unknown>): Partial<QuickContext> {
  return {
    scene: typeof body.quickScene === 'string' ? (body.quickScene as QuickContext['scene']) : undefined,
    frequency: typeof body.quickFrequency === 'string' ? (body.quickFrequency as QuickContext['frequency']) : undefined,
    temperature: typeof body.quickTemperature === 'string' ? (body.quickTemperature as QuickContext['temperature']) : undefined,
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
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
    const normalizedTags = tagArr
      .map((tag: unknown) => (typeof tag === 'string' ? tag.trim() : ''))
      .filter(Boolean)

    const existing = await db.contact.findFirst({ where: { id: params.id, userId } })
    if (!existing) {
      return NextResponse.json({ error: '联系人不存在' }, { status: 404 })
    }

    const selectedCompanyId = typeof body.companyId === 'string' ? body.companyId.trim() : ''
    let linkedCompanyId: string | null = null
    let companyNameForContact: string | null = asString(body.companyName) ?? asString(body.company) ?? existing.companyName ?? existing.company ?? null
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

    // When roleArchetype is passed, sync relationRole via mapping
    const roleArchetypeValue = asString(body.roleArchetype) as RoleArchetype | undefined
    const relationRoleValue = roleArchetypeValue
      ? (mapArchetypeToRole(roleArchetypeValue) ?? existing.relationRole)
      : (asString(body.relationRole) ?? existing.relationRole)
    const temperatureValue = (body.temperature || existing.temperature || null) as Temperature | null

    const parsedQuickContext = parseQuickContextInput(body as Record<string, unknown>)
    const rawQuickContext = parseQuickContext((body as Record<string, unknown>).quickContext)
    const rawRelationVector = parseRelationVector((body as Record<string, unknown>).relationVector)
    const arc = buildArcForContact({
      roleArchetype: roleArchetypeValue ?? (existing.roleArchetype as RoleArchetype) ?? 'BINDER',
      quickContext: rawQuickContext ?? parsedQuickContext,
      temperature: temperatureValue,
      relationVector: rawRelationVector,
    })

    const resolvedFullName = asString(body.fullName) ?? asString(body.name) ?? existing.fullName ?? existing.name
    const resolvedCompanyName = asString(body.companyName) ?? asString(body.company) ?? existing.companyName ?? existing.company ?? ''
    const resolvedJobTitle = asString(body.jobTitle) ?? asString(body.title) ?? existing.jobTitle ?? existing.title ?? ''

    const contact = await db.contact.update({
      where: { id: params.id },
      data: {
        name: resolvedFullName,
        fullName: resolvedFullName,
        relationRole: (relationRoleValue ?? null) as never,
        roleArchetype: roleArchetypeValue ?? (existing.roleArchetype as never) ?? null,
        tags: normalizedTags.length > 0 ? JSON.stringify(normalizedTags) : null,
        industry: asString(body.industry) ?? existing.industry ?? null,
        companyName: resolvedCompanyName,
        jobTitle: resolvedJobTitle,
        spiritAnimal: body.spiritAnimal !== undefined ? (body.spiritAnimal || null) : existing.spiritAnimal,
        company: companyNameForContact,
        companyId: linkedCompanyId,
        companyScale: body.companyScale !== undefined ? ((body.companyScale as never) ?? null) : (existing.companyScale as never) ?? null,
        title: body.title ?? resolvedJobTitle,
        temperature: temperatureValue,
        trustLevel: body.trustLevel ? Number(body.trustLevel) : null,
        valueScore: body.valueScore !== undefined ? ((body.valueScore as never) ?? null) : (existing.valueScore as never) ?? null,
        chemistryScore: body.chemistryScore !== undefined ? (body.chemistryScore ?? null) : existing.chemistryScore,
        networkingNeeds: Array.isArray(body.networkingNeeds) ? body.networkingNeeds : existing.networkingNeeds,
        noteSummary: body.noteSummary ?? existing.noteSummary ?? null,
        circles: Array.isArray(body.circles) ? body.circles : existing.circles,
        interests: Array.isArray(body.interests) ? body.interests : existing.interests,
        careTopics: Array.isArray(body.careTopics) ? body.careTopics : existing.careTopics,
        potentialProjects: Array.isArray(body.potentialProjects) ? body.potentialProjects : existing.potentialProjects,
        industryL1: body.industryL1 !== undefined ? (asString(body.industryL1) ?? null) : existing.industryL1 ?? null,
        industryL2: body.industryL2 !== undefined ? (asString(body.industryL2) ?? null) : existing.industryL2 ?? null,
        jobPosition: body.jobPosition !== undefined ? ((body.jobPosition as never) ?? null) : (existing.jobPosition as never) ?? null,
        jobFunction: body.jobFunction !== undefined ? ((body.jobFunction as never) ?? null) : (existing.jobFunction as never) ?? null,
        wechat: body.wechat ?? existing.wechat ?? null,
        phone: body.phone ?? existing.phone ?? null,
        email: body.email ?? existing.email ?? null,
        notes: body.notes ?? existing.notes ?? null,
        quickContext: arc.quickContext as never,
        relationVector: arc.relationVector as never,
        archetype: arc.archetype,
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

      const resolvedFullName = String(form.get('fullName') ?? form.get('name') ?? '').trim()
      const resolvedCompanyName = String(form.get('companyName') ?? form.get('company') ?? '').trim()
      const resolvedJobTitle = String(form.get('jobTitle') ?? form.get('title') ?? '').trim()
      const resolvedIndustry = String(form.get('industry') ?? '').trim()

      // When roleArchetype is passed, derive relationRole via mapping
      const formRoleArchetype = form.get('roleArchetype') ? String(form.get('roleArchetype')) as RoleArchetype : null
      const formRelationRole = formRoleArchetype
        ? (mapArchetypeToRole(formRoleArchetype) ?? existing.relationRole)
        : (String(form.get('relationRole') ?? '') || existing.relationRole)

      const spiritAnimalValue = form.get('spiritAnimal') ? String(form.get('spiritAnimal')) : null
      const temperatureValue = form.get('temperature') ? (String(form.get('temperature')) as Temperature) : null
      const selectedCompanyId = form.get('companyId') ? String(form.get('companyId')) : ''
      let linkedCompanyId: string | null = null
      let companyNameForContact: string | null = resolvedCompanyName || null
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

      const arc = buildArcForContact({
        roleArchetype: formRoleArchetype ?? (existing.roleArchetype as RoleArchetype) ?? 'BINDER',
        quickContext: {
          scene: (String(form.get('quickScene') || '') as QuickContext['scene']) || undefined,
          frequency: (String(form.get('quickFrequency') || '') as QuickContext['frequency']) || undefined,
          temperature: (String(form.get('quickTemperature') || '') as QuickContext['temperature']) || undefined,
        },
        temperature: temperatureValue,
      })

      await db.contact.update({
        where: { id: params.id },
        data: {
          name: resolvedFullName,
          fullName: resolvedFullName,
          relationRole: (formRelationRole ?? null) as never,
          roleArchetype: (formRoleArchetype as never) ?? (existing.roleArchetype as never) ?? null,
          tags: tagArr.length > 0 ? JSON.stringify(tagArr) : null,
          industry: resolvedIndustry || null,
          companyName: resolvedCompanyName,
          jobTitle: resolvedJobTitle,
          spiritAnimal: spiritAnimalValue as never,
          temperature: temperatureValue,
          trustLevel: form.get('trustLevel') ? Number(form.get('trustLevel')) : null,
          company: companyNameForContact,
          companyId: linkedCompanyId,
          title: form.get('title') ? String(form.get('title')) : (resolvedJobTitle || null),
          jobPosition: form.get('jobPosition') ? String(form.get('jobPosition')) as never : null,
          gender: form.get('gender') ? String(form.get('gender')) as never : null,
          age: form.get('age') ? Number(form.get('age')) : null,
          city: form.get('city') ? String(form.get('city')) : null,
          firstMetYear: form.get('firstMetYear') ? Number(form.get('firstMetYear')) : null,
          personalRelation: form.get('personalRelation') ? String(form.get('personalRelation')) as never : null,
          reciprocityLevel: form.get('reciprocityLevel') ? Number(form.get('reciprocityLevel')) : null,
          friendLinks: form.getAll('friendLinks').map((v) => String(v)),
          companyProfile: form.get('companyProfile') ? String(form.get('companyProfile')) : null,
          companyScale: form.get('companyScale') ? String(form.get('companyScale')) as never : null,
          industryL1: form.get('industryL1') ? String(form.get('industryL1')) : null,
          industryL2: form.get('industryL2') ? String(form.get('industryL2')) : null,
          jobFunction: form.get('jobFunction') ? String(form.get('jobFunction')) as never : null,
          influence: form.get('influence') ? String(form.get('influence')) as never : null,
          networkingNeeds: form.get('networkingNeed') ? [String(form.get('networkingNeed')) as never] : existing.networkingNeeds,
          valueScore: form.get('valueScore') ? String(form.get('valueScore')) as never : null,
          potentialProjects: form.get('potentialProjects') ? String(form.get('potentialProjects')) : null,
          socialPosition: form.get('socialPosition') ? String(form.get('socialPosition')) : null,
          hobbies: form.get('hobbies') ? String(form.get('hobbies')) : null,
          personalNotes: form.get('personalNotes') ? String(form.get('personalNotes')) : null,
          companyAddress: form.get('companyAddress') ? String(form.get('companyAddress')) : null,
          personalAddress: form.get('personalAddress') ? String(form.get('personalAddress')) : null,
          wechat: form.get('wechat') ? String(form.get('wechat')) : null,
          phone: form.get('phone') ? String(form.get('phone')) : null,
          email: form.get('email') ? String(form.get('email')) : null,
          notes: form.get('notes') ? String(form.get('notes')) : null,
          quickContext: arc.quickContext as never,
          relationVector: arc.relationVector as never,
          archetype: arc.archetype,
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
