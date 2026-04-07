import { RoleArchetype, Temperature, SpiritAnimalNew, mapArchetypeToRole } from '@/types'

const COMPANY_SCALE_BY_CATEGORY: Record<string, Array<'STARTUP' | 'SME' | 'MID' | 'LARGE'>> = {
  tech: ['STARTUP', 'SME', 'MID', 'LARGE', 'LARGE'],
  finance: ['SME', 'MID', 'LARGE', 'LARGE'],
  business: ['STARTUP', 'SME', 'SME', 'MID'],
  education: ['SME', 'MID', 'LARGE'],
  media: ['STARTUP', 'SME', 'SME'],
  healthcare: ['STARTUP', 'SME', 'MID'],
}

const SPIRIT_ANIMALS: SpiritAnimalNew[] = ['TIGER', 'PEACOCK', 'OWL', 'KOALA']

const SURNAMES = [
  '王', '李', '张', '刘', '陈', '杨', '黄', '赵', '吴', '周', '徐', '孙', '朱', '郭', '何',
  '高', '林', '郑', '谢', '唐', '许', '韦', '冯', '段', '宋', '茅', '苏', '卢', '蒋', '魏',
  '邓', '余', '曾', '彭', '曹', '萧', '田', '董', '袁', '潘', '於', '江', '薛', '叶', '阎',
  '余', '邹', '傅', '皮', '卓', '齐', '康', '伍', '余', '元', '卜', '顾', '孟', '平', '黎',
]

const GIVEN_NAMES = [
  '子轩', '浩宇', '俊杰', '子涵', '浩然', '子晟', '博文', '浩轩', '亚飞', '思浩',
  '思言', '思翔', '思颜', '思语', '思云', '佳欣', '梦琦', '思琪', '子琪', '思晴',
  '妍希', '思欣', '语欣', '思颖', '佳颖', '思倩', '子晴', '思琦', '思琴', '思雨',
  '明', '光', '华', '建', '国', '强', '军', '涛', '鹏', '超', '辉', '刚', '勇',
  '峰', '磊', '伟', '斌', '云', '翔', '洋', '源', '鸿', '伦', '阳', '昊', '成',
]

const INDUSTRY_TAGS: Record<string, {
  industries: string[]
  baseTag: string[]
  companies: string[]
  titles: string[]
}> = {
  tech: {
    industries: ['科技', '互联网', '软件', 'AI', '数据'],
    baseTag: ['技术', '产品', 'AI', '互联网', '创新', '编程'],
    companies: ['字节跳动', '腾讯', '阿里', 'OpenAI', 'Google', 'Meta', '小米', '华为', 'B站', '抖音'],
    titles: ['工程师', '产品经理', 'CEO', 'CTO', '架构师', '数据科学家', '算法工程师', '全栈开发'],
  },
  finance: {
    industries: ['金融', '投资', '基金', '银行', '保险'],
    baseTag: ['投资', '资本', '融资', '金融', '财务', '风险'],
    companies: ['红杉资本', '高瓴资本', '腾讯投资', '真格基金', '晨兴资本', 'IDG', '平安银行', '招商银行'],
    titles: ['投资经理', '融资顾问', '财务总监', '基金经理', '分析师', '投资合伙人'],
  },
  business: {
    industries: ['商业', '运营', '品牌', '营销', '消费'],
    baseTag: ['营销', '运营', '品牌', '商业', '增长'],
    companies: ['小红书', '知乎', '美团', '滴滴', '瑞幸', '完美日记', '花西子'],
    titles: ['运营总监', '营销经理', '品牌负责人', '增长黑客', '业务开发', '商务总监'],
  },
  education: {
    industries: ['教育', '培训', '科研', '学术'],
    baseTag: ['教育', '学术', '知识', '研究', '教学'],
    companies: ['清华大学', '北大', 'MIT', '斯坦福', '新东方', '好未来', '网易云课堂', '得到'],
    titles: ['教授', '讲师', '研究员', '教育总监', '课程设计师', '学术负责人'],
  },
  media: {
    industries: ['媒体', '内容', '出版', '影视', '设计'],
    baseTag: ['内容', '创意', '设计', '视觉', '文化'],
    companies: ['新华社', '人民日报', '优酷', '爱奇艺', '网易', '财经杂志', '设计公司'],
    titles: ['编辑', '记者', '导演', '设计师', '内容运营', '创意总监', '视觉设计'],
  },
  healthcare: {
    industries: ['医疗', '健康', '制药', '生物'],
    baseTag: ['医疗', '健康', '科学', '生命', '创新'],
    companies: ['华大基因', '丁香园', '诺华', '强生', '阿斯利康', '医院'],
    titles: ['医生', '研究员', '产品经理', '健康顾问', '生物学家', '临床医学'],
  },
}

const ROLE_DISTRIBUTION: Record<RoleArchetype, number> = {
  BREAKER: 0.25,
  EVANGELIST: 0.30,
  ANALYST: 0.20,
  BINDER: 0.25,
}

function generateRandomSpiritAnimal(): SpiritAnimalNew | null {
  if (Math.random() < 0.4) return null
  return randomPick(SPIRIT_ANIMALS)
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomPickMultiple<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, arr.length))
}

export function generateRandomName(): string {
  const surname = randomPick(SURNAMES)
  const givenName = randomPick(GIVEN_NAMES)
  return surname + givenName
}

function getRandomIndustryData(): {
  industry: string
  category: string
  tag: string[]
  companies: string[]
  titles: string[]
} {
  const category = randomPick(Object.keys(INDUSTRY_TAGS))
  const data = INDUSTRY_TAGS[category]
  return {
    industry: randomPick(data.industries),
    category,
    tag: data.baseTag,
    companies: data.companies,
    titles: data.titles,
  }
}

function selectRoleArchetype(): RoleArchetype {
  const roles = Object.entries(ROLE_DISTRIBUTION)
  const random = Math.random()
  let cumulative = 0

  for (const [role, weight] of roles) {
    cumulative += weight
    if (random <= cumulative) {
      return role as RoleArchetype
    }
  }

  return 'BINDER'
}

function generateRandomTags(baseTags: string[], tagVariability: number): string[] {
  const count = Math.floor(Math.random() * 3) + 1

  if (tagVariability === 0) return baseTags.slice(0, count)

  if (tagVariability === 100) {
    const allTags = Object.values(INDUSTRY_TAGS).flatMap((d) => d.baseTag)
    return randomPickMultiple(allTags, count)
  }

  const result: string[] = []
  for (let i = 0; i < count; i++) {
    if (Math.random() * 100 < 100 - tagVariability) {
      result.push(randomPick(baseTags))
    } else {
      const allOtherTags = Object.values(INDUSTRY_TAGS).flatMap((d) => d.baseTag)
      result.push(randomPick(allOtherTags))
    }
  }

  return [...new Set(result)]
}

function generateRandomTemperature(): Temperature | null {
  const random = Math.random() * 100
  if (random < 70) return null
  if (random < 80) return 'HOT'
  if (random < 90) return 'WARM'
  return 'COLD'
}

function generateRandomTrustLevel(): number | null {
  if (Math.random() * 100 < 60) return null
  return Math.floor(Math.random() * 5) + 1
}

function generateRandomEnergyScore(): number {
  return Math.floor(Math.random() * 61) + 20
}

export function generateRandomContact(tagVariability: number = 50): {
  name: string
  roleArchetype: RoleArchetype
  relationRole: string
  spiritAnimal: SpiritAnimalNew | null
  tags: string[]
  energyScore: number
  temperature: Temperature | null
  trustLevel: number | null
  company: string | null
  title: string | null
  notes: string | null
  wechat: string | null
  phone: string | null
  email: string | null
  companyIndustry: string | null
  companyScale: 'STARTUP' | 'SME' | 'MID' | 'LARGE' | null
  companyMainBusiness: string | null
  companyWebsite: string | null
  companyFounderName: string | null
  companyInvestors: string[]
  companyUpstreams: string[]
  companyDownstreams: string[]
  companyTags: string[]
  companyTemperature: Temperature | null
  companyFamiliarityLevel: number | null
  companyEnergyScore: number
} {
  const name = generateRandomName()
  const industryData = getRandomIndustryData()
  const completenessRandom = Math.random() * 100

  const hasCompany = completenessRandom > 20
  const hasTitle = completenessRandom > 15

  const companyName = hasCompany ? randomPick(industryData.companies) : null
  const scaleOptions = COMPANY_SCALE_BY_CATEGORY[industryData.category] ?? ['STARTUP', 'SME', 'MID', 'LARGE']
  const companyScale = hasCompany ? randomPick(scaleOptions) : null
  const companyMainBusiness = hasCompany
    ? `${industryData.industry}领域${randomPick(['产品研发', '业务运营', '平台服务', '解决方案', '技术创新'])}`
    : null

  const spiritAnimal = generateRandomSpiritAnimal()
  const phoneTail = Math.floor(1000 + Math.random() * 9000)
  const mobile = `13${Math.floor(100000000 + Math.random() * 900000000)}`
  const emailLocal = `user${phoneTail}`
  const domain = randomPick(['qq.com', '163.com', 'gmail.com', 'outlook.com'])

  const companyTags = hasCompany ? generateRandomTags(industryData.tag, tagVariability) : []
  const ecosystemPool = Object.values(INDUSTRY_TAGS).flatMap((d) => d.companies)

  const archetype = selectRoleArchetype()

  return {
    name,
    roleArchetype: archetype,
    relationRole: mapArchetypeToRole(archetype) ?? 'COMRADE',
    spiritAnimal,
    tags: generateRandomTags(industryData.tag, tagVariability),
    energyScore: generateRandomEnergyScore(),
    temperature: generateRandomTemperature(),
    trustLevel: generateRandomTrustLevel(),
    company: companyName,
    title: hasTitle ? randomPick(industryData.titles) : null,
    notes: `自动生成的测试数据，行业：${industryData.industry}`,
    wechat: Math.random() < 0.75 ? `wx_${emailLocal}` : null,
    phone: Math.random() < 0.8 ? mobile : null,
    email: Math.random() < 0.7 ? `${emailLocal}@${domain}` : null,
    companyIndustry: hasCompany ? industryData.industry : null,
    companyScale,
    companyMainBusiness,
    companyWebsite: hasCompany ? `https://www.${(companyName || 'company').replace(/\s+/g, '').toLowerCase()}.com` : null,
    companyFounderName: hasCompany && Math.random() < 0.6 ? generateRandomName() : null,
    companyInvestors: hasCompany ? randomPickMultiple(ecosystemPool, Math.floor(Math.random() * 3)) : [],
    companyUpstreams: hasCompany ? randomPickMultiple(ecosystemPool, Math.floor(Math.random() * 3) + 1) : [],
    companyDownstreams: hasCompany ? randomPickMultiple(ecosystemPool, Math.floor(Math.random() * 3) + 1) : [],
    companyTags,
    companyTemperature: hasCompany ? generateRandomTemperature() : null,
    companyFamiliarityLevel: hasCompany ? generateRandomTrustLevel() : null,
    companyEnergyScore: hasCompany ? generateRandomEnergyScore() : 50,
  }
}

export function generateRandomContacts(count: number, tagVariability: number = 50): ReturnType<typeof generateRandomContact>[] {
  return Array.from({ length: count }, () => generateRandomContact(tagVariability))
}
