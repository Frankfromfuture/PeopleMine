import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import { generateRandomContacts } from '@/lib/test-data-generator'

/**
 * POST /api/contacts/generate-random
 * 生成指定数量的随机联系人
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { count = 10, tagVariability = 50 } = body

    // 验证参数
    if (!Number.isInteger(count) || count < 1 || count > 500) {
      return NextResponse.json(
        { error: '生成数量必须在 1-500 之间' },
        { status: 400 },
      )
    }

    if (!Number.isInteger(tagVariability) || tagVariability < 0 || tagVariability > 100) {
      return NextResponse.json(
        { error: '标签波动性必须在 0-100 之间' },
        { status: 400 },
      )
    }

    // 认证
    userId = await getAuthUserId()

    // 生成随机联系人数据
    const randomContacts = generateRandomContacts(count, tagVariability)

    // 顺序创建（避免超时）
    const pairs: Array<{ original: typeof randomContacts[0]; created: Awaited<ReturnType<typeof db.contact.create>> }> = []
    for (const contact of randomContacts) {
      try {
        const created = await db.contact.create({
          data: {
            userId,
            name: contact.name,
            relationRole: contact.relationRole,
            spiritAnimal: contact.spiritAnimal,
            tags: contact.tags.length > 0 ? JSON.stringify(contact.tags) : null,
            energyScore: contact.energyScore,
            temperature: contact.temperature,
            trustLevel: contact.trustLevel,
            company: contact.company,
            title: contact.title,
            wechat: contact.wechat,
            phone: contact.phone,
            email: contact.email,
            notes: contact.notes,
          },
        })
        pairs.push({ original: contact, created })
      } catch (error) {
        console.error('创建单个联系人失败:', error)
        // 继续创建下一个
      }
    }

    // Create companies for contacts that have a company name, deduplicated
    const companyMap = new Map<string, string>() // companyName -> companyId
    for (const { original, created } of pairs) {
      if (!created.company) continue

      let companyId = companyMap.get(created.company)
      if (!companyId) {
        try {
          const existing = await db.company.findFirst({ where: { userId, name: created.company } })
          if (existing) {
            companyId = existing.id
            await db.company.update({
              where: { id: existing.id },
              data: {
                industry: existing.industry ?? original.companyIndustry ?? null,
                scale: existing.scale ?? ((original.companyScale as never) ?? null),
                mainBusiness: existing.mainBusiness ?? original.companyMainBusiness ?? null,
                website: existing.website ?? original.companyWebsite ?? null,
                founderName: existing.founderName ?? original.companyFounderName ?? null,
                investors: existing.investors ?? (original.companyInvestors.length ? JSON.stringify(original.companyInvestors) : null),
                upstreams: existing.upstreams ?? (original.companyUpstreams.length ? JSON.stringify(original.companyUpstreams) : null),
                downstreams: existing.downstreams ?? (original.companyDownstreams.length ? JSON.stringify(original.companyDownstreams) : null),
                tags: existing.tags ?? (original.companyTags.length ? JSON.stringify(original.companyTags) : JSON.stringify(original.tags ?? [])),
                familiarityLevel: existing.familiarityLevel ?? original.companyFamiliarityLevel,
                temperature: existing.temperature ?? original.companyTemperature,
                energyScore: existing.energyScore ?? original.companyEnergyScore,
                notes: existing.notes ?? original.notes,
              },
            }).catch(() => {})
          } else {
            const company = await db.company.create({
              data: {
                userId,
                name: created.company,
                industry: original.companyIndustry ?? null,
                scale: (original.companyScale as never) ?? null,
                mainBusiness: original.companyMainBusiness ?? null,
                website: original.companyWebsite ?? null,
                founderName: original.companyFounderName ?? null,
                investors: original.companyInvestors.length ? JSON.stringify(original.companyInvestors) : null,
                upstreams: original.companyUpstreams.length ? JSON.stringify(original.companyUpstreams) : null,
                downstreams: original.companyDownstreams.length ? JSON.stringify(original.companyDownstreams) : null,
                tags: original.companyTags.length ? JSON.stringify(original.companyTags) : JSON.stringify(original.tags ?? []),
                familiarityLevel: original.companyFamiliarityLevel,
                temperature: original.companyTemperature,
                energyScore: original.companyEnergyScore,
                notes: original.notes,
              },
            })
            companyId = company.id
          }
          companyMap.set(created.company, companyId)
        } catch { /* skip */ }
      }

      if (companyId) {
        await db.contact.update({ where: { id: created.id }, data: { companyId } }).catch(() => {})
      }
    }

    const createdContacts = pairs.map((p) => p.created)

    return NextResponse.json({
      success: true,
      message: `成功生成 ${count} 个随机联系人`,
      count: createdContacts.length,
      contacts: createdContacts.map((c) => ({
        id: c.id,
        name: c.name,
        relationRole: c.relationRole,
        company: c.company,
        title: c.title,
      })),
    })
  } catch (error) {
    console.error('POST /api/contacts/generate-random 错误:', error)
    return NextResponse.json(
      { error: '生成失败: ' + String(error) },
      { status: 500 },
    )
  }
}
