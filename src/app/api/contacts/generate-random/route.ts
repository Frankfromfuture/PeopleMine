import { NextResponse, NextRequest } from 'next/server'
import OpenAI from 'openai'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import type {
  RoleArchetype, SpiritAnimalNew, Temperature, Gender,
  CompanyScaleNew, JobPosition, JobFunction, PersonalRelation, ValueLevel,
} from '@/types'
import { buildArcForContact } from '@/lib/arc'

// ─── 类型定义 ───────────────────────────────────────────────────────────────

type GeneratedContact = {
  fullName: string
  gender: Gender
  firstMetYear: number
  companyName: string
  industryL1: string
  industryL2: string
  jobTitle: string
  jobPosition: JobPosition | null
  jobFunction: JobFunction | null
  roleArchetype: RoleArchetype
  spiritAnimal: SpiritAnimalNew | null
  personalRelation: PersonalRelation | null
  chemistryScore: number | null
  reciprocityLevel: number | null
  temperature: Temperature | null
  valueScore: ValueLevel | null
  notes: string | null
  wechat: string | null
  phone: string | null
  email: string | null
  energyScore: number
  // 企业附加信息
  companyIndustry: string
  companyScale: CompanyScaleNew | null
  companyMainBusiness: string | null
  companyWebsite: string | null
  companyFounderName: string | null
  companyInvestors: string[]
  companyTemperature: Temperature | null
  companyFamiliarityLevel: number | null
  companyEnergyScore: number
}

type AIContact = Partial<GeneratedContact> & { fullName?: string; roleArchetype?: RoleArchetype }

// ─── 常量 ───────────────────────────────────────────────────────────────────

const ROLES: RoleArchetype[]        = ['BREAKER', 'EVANGELIST', 'ANALYST', 'BINDER']
const GENDERS: Gender[]             = ['MALE', 'FEMALE']
const JOB_POSITIONS: JobPosition[]  = ['FOUNDER', 'PARTNER', 'GENERAL_MANAGER', 'VP', 'DIRECTOR', 'MANAGER', 'OTHER']
const JOB_FUNCTIONS: JobFunction[]  = ['MANAGEMENT', 'INVESTMENT', 'SALES', 'ENGINEER', 'MARKETING', 'BUSINESS_DEV', 'ADMIN', 'OTHER']
const ANIMALS: Array<SpiritAnimalNew | null> = [null, 'TIGER', 'PEACOCK', 'OWL', 'KOALA']
const TEMPS: Array<Temperature | null>       = [null, 'HOT', 'WARM', 'COLD']
const PERSONAL_RELATIONS: Array<PersonalRelation | null> = [null, 'INTIMATE', 'FAMILIAR', 'NORMAL', 'ACQUAINTANCE']
const COMPANY_SCALES: Array<CompanyScaleNew | null> = [null, 'MILLION', 'TEN_MILLION', 'HUNDRED_MILLION', 'BILLION', 'TEN_BILLION']
const VALUE_LEVELS: Array<ValueLevel | null> = [null, 'LOW', 'MEDIUM', 'HIGH', 'EXTREME']

// ─── 工具函数 ───────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label}_TIMEOUT`)), ms)
    promise.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) },
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

// ─── 数据规范化 ──────────────────────────────────────────────────────────────

function normalizeRow(row: AIContact, i: number): GeneratedContact {
  const archetype = ROLES.includes(row.roleArchetype as RoleArchetype)
    ? (row.roleArchetype as RoleArchetype)
    : 'BINDER'
  const gender = GENDERS.includes(row.gender as Gender) ? (row.gender as Gender) : (i % 2 === 0 ? 'MALE' : 'FEMALE')
  const firstMetYear = clamp(Number(row.firstMetYear) || new Date().getFullYear() - 1, 1990, new Date().getFullYear())
  const companyName = String(row.companyName || '').trim() || `测试企业${i + 1}`
  const jobTitle = String(row.jobTitle || '').trim() || '经理'
  const industryL1 = String(row.industryL1 || '').trim() || '互联网科技'
  const industryL2 = String(row.industryL2 || '').trim() || ''

  return {
    fullName: String(row.fullName || `测试联系人${i + 1}`),
    gender,
    firstMetYear,
    companyName,
    industryL1,
    industryL2,
    jobTitle,
    jobPosition: row.jobPosition && (JOB_POSITIONS as string[]).includes(row.jobPosition)
      ? (row.jobPosition as JobPosition) : null,
    jobFunction: row.jobFunction && (JOB_FUNCTIONS as string[]).includes(row.jobFunction)
      ? (row.jobFunction as JobFunction) : null,
    roleArchetype: archetype,
    spiritAnimal: ANIMALS.includes((row.spiritAnimal ?? null) as SpiritAnimalNew | null)
      ? (row.spiritAnimal as SpiritAnimalNew | null) : null,
    personalRelation: PERSONAL_RELATIONS.includes((row.personalRelation ?? null) as PersonalRelation | null)
      ? (row.personalRelation as PersonalRelation | null) : null,
    chemistryScore: row.chemistryScore == null ? null : clamp(Number(row.chemistryScore), 1, 5),
    reciprocityLevel: row.reciprocityLevel == null ? null : clamp(Number(row.reciprocityLevel), -2, 2),
    temperature: TEMPS.includes((row.temperature ?? null) as Temperature | null)
      ? (row.temperature as Temperature | null) : null,
    valueScore: VALUE_LEVELS.includes((row.valueScore ?? null) as ValueLevel | null)
      ? (row.valueScore as ValueLevel | null) : null,
    energyScore: clamp(Number(row.energyScore) || 50, 0, 100),
    notes: '自动生成的测试数据',
    wechat: row.wechat ? String(row.wechat) : null,
    phone: row.phone ? String(row.phone) : null,
    email: row.email ? String(row.email) : null,
    companyIndustry: String(row.companyIndustry || industryL1).trim() || industryL1,
    companyScale: COMPANY_SCALES.includes((row.companyScale ?? null) as CompanyScaleNew | null)
      ? (row.companyScale as CompanyScaleNew | null) : null,
    companyMainBusiness: row.companyMainBusiness ? String(row.companyMainBusiness) : null,
    companyWebsite: row.companyWebsite ? String(row.companyWebsite) : null,
    companyFounderName: row.companyFounderName ? String(row.companyFounderName) : null,
    companyInvestors: Array.isArray(row.companyInvestors) ? row.companyInvestors.map(String).slice(0, 4) : [],
    companyTemperature: TEMPS.includes((row.companyTemperature ?? null) as Temperature | null)
      ? (row.companyTemperature as Temperature | null) : null,
    companyFamiliarityLevel: row.companyFamiliarityLevel == null ? null : clamp(Number(row.companyFamiliarityLevel), 1, 5),
    companyEnergyScore: clamp(Number(row.companyEnergyScore) || 50, 0, 100),
  }
}

// ─── 写入数据库 ───────────────────────────────────────────────────────────────

async function createContact(userId: string, contact: GeneratedContact, createdAt?: Date) {
  const arc = buildArcForContact({
    roleArchetype: contact.roleArchetype,
    quickContext: {
      scene: 'WORK',
      frequency: 'MEDIUM',
      temperature: contact.temperature ?? 'WARM',
    },
    temperature: contact.temperature,
  })

  return await db.contact.create({
    data: {
      userId,
      ...(createdAt ? { createdAt } : {}),
      // ── 必填字段（说明逻辑：姓名、男女、首次认识时间、企业、行业、职位）
      name: contact.fullName,
      fullName: contact.fullName,
      gender: contact.gender as never,
      firstMetYear: contact.firstMetYear,
      companyName: contact.companyName,
      company: contact.companyName,
      industryL1: contact.industryL1,
      industryL2: contact.industryL2 || null,
      industry: contact.industryL2 || contact.industryL1,
      jobTitle: contact.jobTitle,
      title: contact.jobTitle,
      jobPosition: (contact.jobPosition as never) ?? null,
      jobFunction: (contact.jobFunction as never) ?? null,
      // ── 标签体系（新）
      roleArchetype: contact.roleArchetype as never,
      spiritAnimal: (contact.spiritAnimal as never) ?? null,
      // ── 关系维度
      personalRelation: (contact.personalRelation as never) ?? null,
      chemistryScore: contact.chemistryScore,
      reciprocityLevel: contact.reciprocityLevel,
      temperature: (contact.temperature as never) ?? null,
      valueScore: (contact.valueScore as never) ?? null,
      energyScore: contact.energyScore,
      // ── 联系方式
      wechat: contact.wechat,
      phone: contact.phone,
      email: contact.email,
      // ── 备注
      notes: contact.notes,
      // ── ARC 分析
      quickContext: arc.quickContext as never,
      relationVector: arc.relationVector as never,
      archetype: arc.archetype,
    },
  })
}

// ─── AI 生成 ──────────────────────────────────────────────────────────────────

// 每次调用时随机抽取的维度约束，防止模型输出千篇一律
const INDUSTRY_POOLS = [
  ['互联网科技', '人工智能', '云计算', 'SaaS', '网络安全'],
  ['金融', '私募股权', '投资银行', '保险科技', '量化交易'],
  ['医疗健康', '生物技术', '医疗器械', '远程医疗', '基因检测'],
  ['教育', '职业培训', '在线教育', 'K12', '高等教育'],
  ['制造业', '精密制造', '新能源设备', '工业自动化', '半导体'],
  ['房地产', '商业地产', '物业管理', '城市更新', '建筑设计'],
  ['零售', '跨境电商', '新零售', '快消品', '奢侈品'],
  ['文化娱乐', '游戏', '短视频', '音乐', '影视'],
  ['能源', '新能源', '储能', '光伏', '风电'],
  ['农业', '农业科技', '食品安全', '冷链物流', '农村电商'],
  ['物流', '供应链', '跨境物流', '即时配送', '仓储'],
  ['汽车', '新能源汽车', '自动驾驶', '车联网', '汽车零部件'],
  ['消费品', '美妆', '运动健身', '宠物经济', '健康食品'],
]

const CITY_POOL = ['北京', '上海', '深圳', '杭州', '广州', '成都', '武汉', '南京', '西安', '苏州', '重庆', '厦门']
const SURNAME_POOL = '王李张刘陈杨黄赵吴周徐孙马朱胡郭林何高梁郑罗宋谢唐韩曹许邓萧冯曾程蔡彭潘袁于董余苏叶吕魏蒋田杜丁沈姜范江傅钟卢汪戴崔任陆廖姚方金谷邹熊白孟秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戚莫孔向汤'

function randomSeed() {
  const surnames = SURNAME_POOL.split('')
  const industries = INDUSTRY_POOLS[Math.floor(Math.random() * INDUSTRY_POOLS.length)]
  const cities = Array.from({ length: 3 }, () => CITY_POOL[Math.floor(Math.random() * CITY_POOL.length)])
  const fiveNames = Array.from({ length: 5 }, () => surnames[Math.floor(Math.random() * surnames.length)])
  return {
    seed: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    industries,
    cities,
    fiveNames,
  }
}

async function aiGenerate(count: number, tagVariability: number, industryFilter?: string[]): Promise<GeneratedContact[]> {
  const qwenKey = process.env.QWEN_API_KEY
  if (!qwenKey) throw new Error('AI_KEY_MISSING')

  const { seed, industries, cities, fiveNames } = randomSeed()

  // 如果用户指定了行业，优先使用；否则用随机池
  const effectiveIndustries = industryFilter && industryFilter.length > 0 ? industryFilter : industries

  // 随机打乱角色分布，让每次生成的角色比例不同
  const roleHints = [...ROLES].sort(() => Math.random() - 0.5).join(' / ')

  const industryConstraint = industryFilter && industryFilter.length > 0
    ? `- 行业必须从以下范围选择（严格限定）：${industryFilter.join('、')}\n- industryL2 根据对应一级行业随机生成合理细分`
    : `- 行业参考（可突破）：${effectiveIndustries.join('、')}`

  const prompt = `随机种子：${seed}。直接输出 JSON，禁止输出任何思考过程或解释。

生成 ${count} 条中国职场人脉数据，要求真正随机多样，禁止出现雷同人名/公司/行业组合。

【本次随机约束】
- 姓氏参考（可突破）：${fiveNames.join('、')}
${industryConstraint}
- 城市分布参考：${cities.join('、')}
- roleArchetype 分布顺序：${roleHints}
- tagVariability=${tagVariability}（0=行业聚焦，100=极度多元）

【字段规则】
- 必填：fullName、gender、firstMetYear、companyName、industryL1、industryL2、jobTitle
- 非必填字段按 50%-80% 概率随机填写（null 表示用户未登记）
- roleArchetype 只能是：BREAKER / EVANGELIST / ANALYST / BINDER
- gender：MALE / FEMALE
- jobPosition：${JOB_POSITIONS.join(' / ')} 或 null
- jobFunction：${JOB_FUNCTIONS.join(' / ')} 或 null
- spiritAnimal：TIGER / PEACOCK / OWL / KOALA 或 null
- temperature / companyTemperature：HOT / WARM / COLD 或 null
- personalRelation：INTIMATE / FAMILIAR / NORMAL / ACQUAINTANCE 或 null
- chemistryScore：1-5 整数或 null
- reciprocityLevel：-2 到 +2 整数或 null
- valueScore：LOW / MEDIUM / HIGH / EXTREME 或 null
- energyScore：0-100 整数（不同人能量差异要大）
- companyScale：MILLION / TEN_MILLION / HUNDRED_MILLION / BILLION / TEN_BILLION 或 null
- companyFamiliarityLevel：1-5 整数或 null
- companyEnergyScore：0-100 整数
- firstMetYear：1995 到 ${new Date().getFullYear()} 的整数
- notes：固定为"自动生成的测试数据"

【多样性要求】
- 公司规模从初创到上市全部覆盖，不要全是大厂
- 职位级别要多样：从实习生/专员到董事长都要出现
- 性别比例尽量接近 1:1
- firstMetYear 跨度要大，覆盖不同年份
- 同一行业下的 industryL2 细分要各不相同

【输出格式】JSON 数组，外层用 contacts 键包裹，每条对象字段顺序不限：
{"contacts":[{...}, {...}]}`

  const client = new OpenAI({
    apiKey: qwenKey,
    baseURL: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  })

  const createCompletion = client.chat.completions.create as unknown as (params: {
    model: string
    stream?: boolean
    temperature?: number
    top_p?: number
    max_tokens?: number
    extra_body?: Record<string, unknown>
    messages: Array<{ role: 'system' | 'user'; content: string }>
  }) => Promise<{ choices?: Array<{ message?: { content?: string | null } }> }>

  const res = await createCompletion({
    model: 'qwen3.5-flash',
    stream: false,
    temperature: 1.1,
    top_p: 0.95,
    max_tokens: 8192,
    // 关闭 thinking 模式：让模型直接创作而非"分析后再输出"，输出更具随机性
    extra_body: { enable_thinking: false },
    messages: [
      { role: 'system', content: '你是一个数据生成器，只输出严格 JSON，不输出任何其他内容。' },
      { role: 'user', content: prompt },
    ],
  })

  const text = String(res.choices?.[0]?.message?.content || '')
  const parsed = parseJSON(text) as { contacts?: AIContact[] }
  const rows = Array.isArray(parsed.contacts) ? parsed.contacts : []
  if (rows.length === 0) throw new Error('AI_EMPTY')

  const normalized = rows.slice(0, count).map((row, i) => normalizeRow(row, i))
  if (normalized.length !== count) {
    throw new Error(`AI_COUNT_MISMATCH:${normalized.length}`)
  }
  return normalized
}

// ─── 路由处理 ─────────────────────────────────────────────────────────────────

/**
 * POST /api/contacts/generate-random
 *
 * 说明逻辑：
 * - 必填随机项：姓名、男女、首次认识时间、企业、行业（一级+二级）、职位
 * - 其余字段由 AI 按 50%-100% 完整度随机填写，模拟真实登记掌握程度
 * - tagVariability 越高，行业越多元；越低，行业越聚焦
 * - 生成数量严格校验：请求多少条就必须成功写入多少条
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { count = 10, tagVariability = 50, industryFilter } = body

    if (!Number.isInteger(count) || count < 1 || count > 500) {
      return NextResponse.json({ error: '生成数量必须在 1-500 之间' }, { status: 400 })
    }
    if (!Number.isInteger(tagVariability) || tagVariability < 0 || tagVariability > 100) {
      return NextResponse.json({ error: '标签波动性必须在 0-100 之间' }, { status: 400 })
    }
    const validatedIndustryFilter: string[] | undefined =
      Array.isArray(industryFilter) && industryFilter.length > 0
        ? industryFilter.map(String).slice(0, 11)
        : undefined

    const userId = await getAuthUserId()

    const randomContacts = await withTimeout(aiGenerate(count, tagVariability, validatedIndustryFilter), 120000, 'AI_GENERATE')

    // 为每个联系人生成过去一年内的随机登记时间（均匀分布）
    const now = Date.now()
    const oneYearMs = 365 * 24 * 60 * 60 * 1000
    const randomCreatedAt = () => new Date(now - Math.random() * oneYearMs)

    const createdContacts: Awaited<ReturnType<typeof db.contact.create>>[] = []
    let failedCreates = 0

    for (const contact of randomContacts) {
      try {
        const created = await createContact(userId, contact, randomCreatedAt())

        // 创建或关联企业记录
        if (contact.companyName) {
          try {
            const existing = await db.company.findFirst({ where: { userId, name: contact.companyName } })
            let companyId: string

            if (existing) {
              companyId = existing.id
            } else {
              const company = await db.company.create({
                data: {
                  userId,
                  name: contact.companyName,
                  industry: contact.companyIndustry || contact.industryL1 || null,
                  scale: (contact.companyScale as never) ?? null,
                  mainBusiness: contact.companyMainBusiness ?? null,
                  website: contact.companyWebsite ?? null,
                  founderName: contact.companyFounderName ?? null,
                  investors: contact.companyInvestors.length ? JSON.stringify(contact.companyInvestors) : null,
                  temperature: contact.companyTemperature,
                  familiarityLevel: contact.companyFamiliarityLevel,
                  energyScore: contact.companyEnergyScore,
                },
              })
              companyId = company.id
            }

            await db.contact.update({ where: { id: created.id }, data: { companyId } }).catch(() => {})
          } catch (companyErr) {
            console.warn('[generate-random] 企业关联失败（已忽略）:', companyErr)
          }
        }

        createdContacts.push(created)
      } catch (e) {
        failedCreates += 1
        console.error('[generate-random] 创建联系人失败，已跳过:', e)
      }
    }

    if (createdContacts.length !== count) {
      return NextResponse.json({
        error: `生成数量不一致：请求 ${count} 条，实际写入 ${createdContacts.length} 条，失败 ${failedCreates} 条`,
        count: createdContacts.length,
        failedCreates,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `成功生成 ${createdContacts.length} 个随机联系人（AI 真随机）`,
      count: createdContacts.length,
      contacts: createdContacts.map((c) => ({
        id: c.id,
        name: c.fullName ?? c.name,
        roleArchetype: c.roleArchetype,
        company: c.companyName ?? c.company,
        jobTitle: c.jobTitle ?? c.title,
        industryL1: c.industryL1,
        industryL2: c.industryL2,
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('AI_KEY_MISSING')) {
      return NextResponse.json({ error: 'Qwen API Key 未配置（请设置 QWEN_API_KEY）' }, { status: 503 })
    }
    if (error instanceof Error && error.message.includes('AI_GENERATE_TIMEOUT')) {
      return NextResponse.json({ error: 'AI 生成超时，请稍后重试（建议先用 10-30 条）' }, { status: 504 })
    }
    if (error instanceof Error && error.message.includes('AI_COUNT_MISMATCH')) {
      return NextResponse.json({ error: `AI 返回数量不足：${error.message}` }, { status: 502 })
    }
    console.error('POST /api/contacts/generate-random 错误:', error)
    return NextResponse.json({ error: '生成失败: ' + String(error) }, { status: 500 })
  }
}
