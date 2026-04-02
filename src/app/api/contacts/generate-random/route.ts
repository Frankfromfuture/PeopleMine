import { NextResponse, NextRequest } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import { generateRandomContacts } from '@/lib/test-data-generator'
import { RelationRole, SpiritAnimal, Temperature } from '@/types'

type GeneratedContact = ReturnType<typeof generateRandomContacts>[number]
type AIContact = Partial<GeneratedContact> & { name?: string; relationRole?: RelationRole }

const ROLES: RelationRole[] = ['BIG_INVESTOR', 'GATEWAY', 'ADVISOR', 'THERMOMETER', 'LIGHTHOUSE', 'COMRADE']
const ANIMALS: Array<SpiritAnimal | null> = [null, 'LION', 'FOX', 'BEAR', 'CHAMELEON', 'EAGLE', 'DOLPHIN', 'OWL', 'SKUNK']
const TEMPS: Array<Temperature | null> = [null, 'HOT', 'WARM', 'COLD']

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label}_TIMEOUT`)), ms)
    promise.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      },
    )
  })
}

function parseJSON(text: string): unknown {
  const cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim()
  if (cleaned.startsWith('{') || cleaned.startsWith('[')) return JSON.parse(cleaned)
  const i = cleaned.indexOf('{')
  const j = cleaned.lastIndexOf('}')
  if (i >= 0 && j > i) return JSON.parse(cleaned.slice(i, j + 1))
  throw new Error('AI 返回非 JSON')
}

function normalizeRow(row: AIContact, i: number): GeneratedContact {
  return {
    name: String(row.name || `测试联系人${i + 1}`),
    relationRole: ROLES.includes(row.relationRole as RelationRole) ? (row.relationRole as RelationRole) : 'COMRADE',
    spiritAnimal: ANIMALS.includes((row.spiritAnimal ?? null) as SpiritAnimal | null)
      ? (row.spiritAnimal as SpiritAnimal | null)
      : null,
    tags: Array.isArray(row.tags) ? row.tags.map(String).slice(0, 8) : [],
    energyScore: clamp(Number(row.energyScore) || 50, 0, 100),
    temperature: TEMPS.includes((row.temperature ?? null) as Temperature | null)
      ? (row.temperature as Temperature | null)
      : null,
    trustLevel: row.trustLevel == null ? null : clamp(Number(row.trustLevel), 1, 5),
    company: row.company ? String(row.company) : null,
    title: row.title ? String(row.title) : null,
    notes: row.notes ? String(row.notes) : '自动生成的测试数据（AI）',
    wechat: row.wechat ? String(row.wechat) : null,
    phone: row.phone ? String(row.phone) : null,
    email: row.email ? String(row.email) : null,
    companyIndustry: row.companyIndustry ? String(row.companyIndustry) : null,
    companyScale: ['STARTUP', 'SME', 'MID', 'LARGE', 'LISTED'].includes(String(row.companyScale))
      ? (row.companyScale as GeneratedContact['companyScale'])
      : null,
    companyMainBusiness: row.companyMainBusiness ? String(row.companyMainBusiness) : null,
    companyWebsite: row.companyWebsite ? String(row.companyWebsite) : null,
    companyFounderName: row.companyFounderName ? String(row.companyFounderName) : null,
    companyInvestors: Array.isArray(row.companyInvestors) ? row.companyInvestors.map(String).slice(0, 4) : [],
    companyUpstreams: Array.isArray(row.companyUpstreams) ? row.companyUpstreams.map(String).slice(0, 4) : [],
    companyDownstreams: Array.isArray(row.companyDownstreams) ? row.companyDownstreams.map(String).slice(0, 4) : [],
    companyTags: Array.isArray(row.companyTags) ? row.companyTags.map(String).slice(0, 8) : [],
    companyTemperature: TEMPS.includes((row.companyTemperature ?? null) as Temperature | null)
      ? (row.companyTemperature as Temperature | null)
      : null,
    companyFamiliarityLevel:
      row.companyFamiliarityLevel == null ? null : clamp(Number(row.companyFamiliarityLevel), 1, 5),
    companyEnergyScore: clamp(Number(row.companyEnergyScore) || 50, 0, 100),
  }
}

async function aiGenerate(count: number, tagVariability: number): Promise<GeneratedContact[]> {
  const kimiKey = process.env.KIMI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!kimiKey && !anthropicKey) throw new Error('AI_KEY_MISSING')

  const prompt = `直接输出 JSON，不要思考过程，不要解释。随机生成 ${count} 条中国人脉联系人数据。\n规则：\n- relationRole 只能是：${ROLES.join(', ')}\n- spiritAnimal 可为 null 或：LION/FOX/BEAR/CHAMELEON/EAGLE/DOLPHIN/OWL/SKUNK\n- temperature/companyTemperature 只能是 HOT/WARM/COLD/null\n- trustLevel/companyFamiliarityLevel 为 1-5 或 null\n- energyScore/companyEnergyScore 为 0-100 整数\n- companyScale 只能是 STARTUP/SME/MID/LARGE/LISTED 或 null\n- tagVariability=${tagVariability}（0=标签聚焦行业，100=标签跨行业随机）\n- 姓名用真实中国人名，公司用真实或拟真中国公司名，职位用中文\n- notes 固定为”自动生成的测试数据（AI）”\n格式：{“contacts”:[{“name”:”...”,”relationRole”:”...”,”spiritAnimal”:null,”tags”:[“...”],”energyScore”:70,”temperature”:”WARM”,”trustLevel”:3,”company”:”...”,”title”:”...”,”notes”:”自动生成的测试数据（AI）”,”wechat”:null,”phone”:null,”email”:null,”companyIndustry”:”...”,”companyScale”:”MID”,”companyMainBusiness”:”...”,”companyWebsite”:null,”companyFounderName”:”...”,”companyInvestors”:[],”companyUpstreams”:[],”companyDownstreams”:[],”companyTags”:[],”companyTemperature”:”WARM”,”companyFamiliarityLevel”:3,”companyEnergyScore”:60}]}`

  let text = ''

  if (kimiKey) {
    const client = new OpenAI({ apiKey: kimiKey, baseURL: 'https://api.moonshot.cn/v1' })
    const res = await client.chat.completions.create({
      model: 'kimi-k2.5',
      temperature: 1,
      max_tokens: 8192,
      messages: [
        { role: 'system', content: '你只输出严格 JSON。' },
        { role: 'user', content: prompt },
      ],
    })
    text = String(res.choices[0]?.message?.content || '')
  } else {
    const client = new Anthropic({ apiKey: anthropicKey })
    const res = await client.messages.create({
      model: 'claude-opus-4-6',
      temperature: 1,
      max_tokens: 4096,
      system: '你只输出严格 JSON。',
      messages: [{ role: 'user', content: prompt }],
    })
    text = res.content.find((b) => b.type === 'text')?.text || ''
  }

  const parsed = parseJSON(text) as { contacts?: AIContact[] }
  const rows = Array.isArray(parsed.contacts) ? parsed.contacts : []
  if (rows.length === 0) throw new Error('AI_EMPTY')

  return rows.slice(0, count).map((row, i) => normalizeRow(row, i))
}

/**
 * POST /api/contacts/generate-random
 * 优先 AI 真随机，失败自动降级本地随机
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { count = 10, tagVariability = 50, useAI = true } = body

    if (!Number.isInteger(count) || count < 1 || count > 500) {
      return NextResponse.json({ error: '生成数量必须在 1-500 之间' }, { status: 400 })
    }
    if (!Number.isInteger(tagVariability) || tagVariability < 0 || tagVariability > 100) {
      return NextResponse.json({ error: '标签波动性必须在 0-100 之间' }, { status: 400 })
    }

    const userId = await getAuthUserId()

    let mode: 'ai' | 'fallback' = 'fallback'
    let randomContacts: GeneratedContact[] = []

    if (useAI) {
      try {
        randomContacts = await withTimeout(aiGenerate(count, tagVariability), 55000, 'AI_GENERATE')
        mode = 'ai'
      } catch (e) {
        console.warn('[generate-random] AI失败，降级本地随机:', e)
        randomContacts = generateRandomContacts(count, tagVariability)
      }
    } else {
      randomContacts = generateRandomContacts(count, tagVariability)
    }

    const pairs: Array<{ original: GeneratedContact; created: Awaited<ReturnType<typeof db.contact.create>> }> = []
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
      } catch (e) {
        console.error('[generate-random] 创建联系人失败，已跳过:', e)
      }
    }

    const companyMap = new Map<string, string>()
    for (const { original, created } of pairs) {
      if (!created.company) continue

      let companyId = companyMap.get(created.company)
      if (!companyId) {
        const existing = await db.company.findFirst({ where: { userId, name: created.company } })
        if (existing) {
          companyId = existing.id
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
      }

      await db.contact.update({ where: { id: created.id }, data: { companyId } }).catch(() => {})
    }

    const createdContacts = pairs.map((p) => p.created)

    return NextResponse.json({
      success: true,
      message: `成功生成 ${createdContacts.length} 个随机联系人（${mode === 'ai' ? 'AI 真随机' : '本地随机'}）`,
      count: createdContacts.length,
      mode,
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
    return NextResponse.json({ error: '生成失败: ' + String(error) }, { status: 500 })
  }
}
