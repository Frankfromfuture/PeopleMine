import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import type { RoleArchetype } from '@/types'
import { mapArchetypeToRole } from '@/types'

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}
export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId()
    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role')
    const archetype = searchParams.get('archetype')
    const animal = searchParams.get('animal')

    const contacts = await db.contact.findMany({
      where: {
        userId,
        ...(role ? { roleArchetype: role as never } : {}),
        ...(archetype ? { roleArchetype: archetype as never } : {}),
        ...(animal ? { spiritAnimal: animal as never } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    const responseContacts = contacts.map((contact) => ({
      ...contact,
      tier1: {
        basic: {
          fullName: contact.fullName ?? contact.name,
          companyName: contact.companyName ?? contact.company ?? '',
          industry: contact.industry ?? '',
          jobTitle: contact.jobTitle ?? contact.title ?? '',
          companyProfile: {
            size: contact.tier1CompanySize,
            stage: contact.tier1CompanyStage,
            website: contact.tier1CompanyWebsite,
            confidence: contact.tier1CompanyAiConfidence,
            source: contact.tier1CompanyAiSource,
          },
        },
        analysis: {
          networkingNeeds: contact.networkingNeeds,
          personalityType: contact.personalityType,
          personalityLabel: contact.personalityLabel,
          chemistryScore: contact.chemistryScore,
          valueScore: contact.valueScore,
          valueReason: contact.valueReason,
        },
        notes: {
          summary: contact.noteSummary ?? contact.notes,
          circles: contact.circles,
          interests: contact.interests,
          careTopics: contact.careTopics,
          potentialProjects: contact.potentialProjects,
        },
      },
    }))

    return NextResponse.json({ contacts: responseContacts })
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
          // 新字段
          fullName: String(fd.get('fullName') ?? ''),
          gender: fd.get('gender') ? String(fd.get('gender')) : null,
          age: fd.get('age') ? Number(fd.get('age')) : null,
          city: fd.get('city') ? String(fd.get('city')) : null,
          firstMetYear: fd.get('firstMetYear') ? Number(fd.get('firstMetYear')) : null,
          personalRelation: fd.get('personalRelation') ? String(fd.get('personalRelation')) : null,
          reciprocityLevel: fd.get('reciprocityLevel') ? Number(fd.get('reciprocityLevel')) : null,
          friendLinks: fd.getAll('friendLinks').map((v) => String(v)),
          companyName: String(fd.get('companyName') ?? ''),
          companyProfile: fd.get('companyProfile') ? String(fd.get('companyProfile')) : null,
          companyScale: fd.get('companyScale') ? String(fd.get('companyScale')) : null,
          industryL1: fd.get('industryL1') ? String(fd.get('industryL1')) : null,
          industryL2: fd.get('industryL2') ? String(fd.get('industryL2')) : null,
          jobPosition: fd.get('jobPosition') ? String(fd.get('jobPosition')) : null,
          jobFunction: fd.get('jobFunction') ? String(fd.get('jobFunction')) : null,
          influence: fd.get('influence') ? String(fd.get('influence')) : null,
          networkingNeed: fd.get('networkingNeed') ? String(fd.get('networkingNeed')) : null,
          spiritAnimal: fd.get('spiritAnimal') ? String(fd.get('spiritAnimal')) : null,
          roleArchetype: fd.get('roleArchetype') ? String(fd.get('roleArchetype')) : null,
          chemistryScore: fd.get('chemistryScore') ? Number(fd.get('chemistryScore')) : null,
          valueScore: fd.get('valueScore') ? String(fd.get('valueScore')) : null,
          potentialProjects: fd.get('potentialProjects') ? String(fd.get('potentialProjects')) : null,
          socialPosition: fd.get('socialPosition') ? String(fd.get('socialPosition')) : null,
          hobbies: fd.get('hobbies') ? String(fd.get('hobbies')) : null,
          personalNotes: fd.get('personalNotes') ? String(fd.get('personalNotes')) : null,
          notes: fd.get('notes') ? String(fd.get('notes')) : null,
          phone: fd.get('phone') ? String(fd.get('phone')) : null,
          wechat: fd.get('wechat') ? String(fd.get('wechat')) : null,
          email: fd.get('email') ? String(fd.get('email')) : null,
          companyAddress: fd.get('companyAddress') ? String(fd.get('companyAddress')) : null,
          personalAddress: fd.get('personalAddress') ? String(fd.get('personalAddress')) : null,
        }))

    const fullName = asString(body.fullName)
    const companyName = asString(body.companyName)

    if (!fullName || !companyName) {
      return NextResponse.json({ error: '姓名和公司名称为必填项' }, { status: 400 })
    }

    const contact = await db.contact.create({
      data: {
        userId,
        name: fullName,
        fullName,
        gender: (body.gender as never) ?? null,
        age: body.age ? Number(body.age) : null,
        city: body.city ?? null,
        firstMetYear: body.firstMetYear ? Number(body.firstMetYear) : null,
        personalRelation: (body.personalRelation as never) ?? null,
        reciprocityLevel: body.reciprocityLevel ? Number(body.reciprocityLevel) : null,
        friendLinks: Array.isArray(body.friendLinks) ? body.friendLinks : [],
        companyName,
        company: companyName,
        companyProfile: body.companyProfile ?? null,
        companyScale: (body.companyScale as never) ?? null,
        industry: body.industryL2 || body.industryL1 || null,
        industryL1: body.industryL1 ?? null,
        industryL2: body.industryL2 ?? null,
        jobPosition: (body.jobPosition as never) ?? null,
        jobFunction: (body.jobFunction as never) ?? null,
        influence: (body.influence as never) ?? null,
        networkingNeeds: body.networkingNeed ? [body.networkingNeed as never] : [],
        spiritAnimal: (body.spiritAnimal as never) ?? null,
        roleArchetype: (body.roleArchetype as never) ?? null,
        chemistryScore: body.chemistryScore ? Number(body.chemistryScore) : null,
        valueScore: (body.valueScore as never) ?? null,
        potentialProjects: body.potentialProjects ?? null,
        socialPosition: body.socialPosition ?? null,
        hobbies: body.hobbies ?? null,
        personalNotes: body.personalNotes ?? null,
        notes: body.notes ?? null,
        phone: body.phone ?? null,
        wechat: body.wechat ?? null,
        email: body.email ?? null,
        companyAddress: body.companyAddress ?? null,
        personalAddress: body.personalAddress ?? null,
        energyScore: 50,
        relationRole: mapArchetypeToRole(body.roleArchetype as RoleArchetype) ?? 'COMRADE',
      },
    })

    if (!isJson) {
      return NextResponse.redirect(new URL('/contacts', req.url), { status: 303 })
    }
    return NextResponse.json({ contact }, { status: 201 })
  } catch (err) {
    console.error('[contacts POST]', err)
    return NextResponse.json({ error: '创建失败', detail: String(err) }, { status: 500 })
  }
}
