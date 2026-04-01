import { RelationRole, Temperature } from '@/types'

/**
 * 中文常见姓氏
 */
const SURNAMES = [
  '王', '李', '张', '刘', '陈', '杨', '黄', '赵', '吴', '周', '徐', '孙', '朱', '郭', '何',
  '高', '林', '郑', '谢', '唐', '许', '韦', '冯', '段', '宋', '茅', '苏', '卢', '蒋', '魏',
  '邓', '余', '曾', '彭', '曹', '萧', '田', '董', '袁', '潘', '於', '江', '薛', '叶', '阎',
  '余', '邹', '傅', '皮', '卓', '齐', '康', '伍', '余', '元', '卜', '顾', '孟', '平', '黎',
]

/**
 * 常见名字库
 */
const GIVEN_NAMES = [
  '子轩', '浩宇', '俊杰', '子涵', '浩然', '子晟', '博文', '浩轩', '亚飞', '思浩',
  '思言', '思翔', '思颜', '思语', '思云', '佳欣', '梦琦', '思琪', '子琪', '思晴',
  '妍希', '思欣', '语欣', '思颖', '佳颖', '思倩', '子晴', '思琦', '思琴', '思雨',
  '明', '光', '华', '建', '国', '强', '军', '涛', '鹏', '超', '辉', '刚', '勇',
  '峰', '磊', '伟', '斌', '云', '翔', '洋', '源', '鸿', '伦', '阳', '昊', '成',
]

/**
 * 行业分类及相关标签
 */
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
    companies: ['小红书', '知乎', '美团', '滴滴', '瑞幸', '蕾哈娜', '完美日记', '花西子'],
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
    companies: ['华大基因', '丁香园', '寿司医生', '诺华', '强生', '阿斯利康', '医院'],
    titles: ['医生', '研究员', '产品经理', '健康顾问', '生物学家', '临床医学'],
  },
}

/**
 * 关系角色分布（权重）
 */
const ROLE_DISTRIBUTION = {
  BIG_INVESTOR: 0.15,
  GATEWAY: 0.25,
  ADVISOR: 0.20,
  THERMOMETER: 0.15,
  LIGHTHOUSE: 0.15,
  COMRADE: 0.10,
}

/**
 * 随机选择数组中的一个元素
 */
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * 随机选择多个元素（不重复）
 */
function randomPickMultiple<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, arr.length))
}

/**
 * 生成随机中文名字
 */
export function generateRandomName(): string {
  const surname = randomPick(SURNAMES)
  const givenName = randomPick(GIVEN_NAMES)
  return surname + givenName
}

/**
 * 生成随机行业和相关数据
 */
function getRandomIndustryData(): {
  industry: string
  tag: string[]
  companies: string[]
  titles: string[]
} {
  const category = randomPick(Object.keys(INDUSTRY_TAGS))
  const data = INDUSTRY_TAGS[category]
  return {
    industry: randomPick(data.industries),
    tag: data.baseTag,
    companies: data.companies,
    titles: data.titles,
  }
}

/**
 * 选择关系角色（根据权重）
 */
function selectRelationRole(): RelationRole {
  const roles = Object.entries(ROLE_DISTRIBUTION)
  const random = Math.random()
  let cumulative = 0

  for (const [role, weight] of roles) {
    cumulative += weight
    if (random <= cumulative) {
      return role as RelationRole
    }
  }

  return 'COMRADE'
}

/**
 * 生成随机标签
 */
function generateRandomTags(
  baseTags: string[],
  tagVariability: number, // 0-100
): string[] {
  const count = Math.floor(Math.random() * 3) + 1 // 1-3 个标签

  if (tagVariability === 0) {
    // 完全固定
    return baseTags.slice(0, count)
  }

  if (tagVariability === 100) {
    // 完全随机
    const allTags = Object.values(INDUSTRY_TAGS)
      .flatMap((d) => d.baseTag)
    return randomPickMultiple(allTags, count)
  }

  // 混合：baseTag 占 (100 - variability)% 的权重
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    if (Math.random() * 100 < 100 - tagVariability) {
      // 使用 base tag
      result.push(randomPick(baseTags))
    } else {
      // 使用其他 tag
      const allOtherTags = Object.values(INDUSTRY_TAGS)
        .flatMap((d) => d.baseTag)
      result.push(randomPick(allOtherTags))
    }
  }

  return [...new Set(result)] // 去重
}

/**
 * 生成随机温度
 */
function generateRandomTemperature(): Temperature | null {
  const random = Math.random() * 100
  if (random < 70) return null // 70% 概率无温度
  if (random < 80) return 'HOT'
  if (random < 90) return 'WARM'
  return 'COLD'
}

/**
 * 生成随机信任度
 */
function generateRandomTrustLevel(): number | null {
  const random = Math.random() * 100
  if (random < 60) return null // 60% 概率无信任度

  return Math.floor(Math.random() * 5) + 1 // 1-5
}

/**
 * 生成随机能量值
 */
function generateRandomEnergyScore(): number {
  return Math.floor(Math.random() * 61) + 20 // 20-80
}

/**
 * 生成完整的随机联系人
 */
export function generateRandomContact(tagVariability: number = 50): {
  name: string
  relationRole: RelationRole
  tags: string[]
  energyScore: number
  temperature: Temperature | null
  trustLevel: number | null
  company: string | null
  title: string | null
  notes: string | null
} {
  const name = generateRandomName()
  const industryData = getRandomIndustryData()
  const completenessRandom = Math.random() * 100

  // 数据完整度随机
  const hasCompany = completenessRandom > 20
  const hasTitle = completenessRandom > 15

  return {
    name,
    relationRole: selectRelationRole(),
    tags: generateRandomTags(industryData.tag, tagVariability),
    energyScore: generateRandomEnergyScore(),
    temperature: generateRandomTemperature(),
    trustLevel: generateRandomTrustLevel(),
    company: hasCompany ? randomPick(industryData.companies) : null,
    title: hasTitle ? randomPick(industryData.titles) : null,
    notes: `自动生成的测试数据，行业：${industryData.industry}`,
  }
}

/**
 * 生成多个随机联系人
 */
export function generateRandomContacts(
  count: number,
  tagVariability: number = 50,
): ReturnType<typeof generateRandomContact>[] {
  return Array.from({ length: count }, () =>
    generateRandomContact(tagVariability),
  )
}
