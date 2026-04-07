// PeopleMine — TypeScript 类型定义

// ─── 保留类型（用于映射函数和兼容） ──────────────────────────

/** @deprecated 仅用于映射函数，业务代码请使用 RoleArchetype */
export type RelationRole = 'BIG_INVESTOR' | 'GATEWAY' | 'ADVISOR' | 'THERMOMETER' | 'LIGHTHOUSE' | 'COMRADE'

/** @deprecated 仅用于映射函数，业务代码请使用 SpiritAnimalNew */
export type SpiritAnimal = 'LION' | 'FOX' | 'BEAR' | 'CHAMELEON' | 'EAGLE' | 'DOLPHIN' | 'OWL' | 'SKUNK'

// ─── 核心类型（正式使用） ──────────────────────────────────

export type Temperature = 'COLD' | 'WARM' | 'HOT'

export type InteractionType = 'MEETING' | 'CALL' | 'EMAIL' | 'MESSAGE' | 'EVENT' | 'OTHER'

export const TEMPERATURE_LABELS: Record<Temperature, string> = {
  COLD: '冷',
  WARM: '温',
  HOT:  '热',
}

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  MEETING: '会面',
  CALL:    '电话',
  EMAIL:   '邮件',
  MESSAGE: '消息',
  EVENT:   '活动',
  OTHER:   '其他',
}

export type QuickScene = 'FAMILY' | 'WORK' | 'PARTNER' | 'SOCIAL' | 'TRANSACTIONAL'
export type QuickFrequency = 'LOW' | 'MEDIUM' | 'HIGH'

export interface QuickContext {
  scene: QuickScene
  frequency: QuickFrequency
  temperature: Temperature
}

export interface RelationVector {
  trust: number
  powerDelta: number
  goalAlignment: number
  emotionalVolatility: number
  reciprocity: number
  boundaryStability: number
  confidence: number
  updatedAt: string
}

export const QUICK_SCENE_LABELS: Record<QuickScene, string> = {
  FAMILY: '家庭/亲友',
  WORK: '工作同事',
  PARTNER: '亲密关系',
  SOCIAL: '泛社交',
  TRANSACTIONAL: '交易/合作',
}

export const QUICK_FREQUENCY_LABELS: Record<QuickFrequency, string> = {
  LOW: '低频',
  MEDIUM: '中频',
  HIGH: '高频',
}

// ─── 企业类型（Company 模型使用） ──────────────────────────

export type CompanyScale = 'STARTUP' | 'SME' | 'MID' | 'LARGE' | 'LISTED'

export const COMPANY_SCALE_LABELS: Record<CompanyScale, { name: string; desc: string; color: string }> = {
  STARTUP: { name: '初创',   desc: '<50人',    color: 'bg-gray-100 text-gray-700 border-gray-200' },
  SME:     { name: '中小型', desc: '50-300人', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  MID:     { name: '中型',   desc: '300-1000人', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  LARGE:   { name: '大型',   desc: '1000人+',  color: 'bg-gray-100 text-gray-700 border-gray-200' },
  LISTED:  { name: '上市',   desc: 'A股/港股/美股', color: 'bg-gray-100 text-gray-700 border-gray-200' },
}

// ─── 社交需求 ─────────────────────────────────────────────

export type NetworkingNeed =
  | 'BUSINESS_EXPANSION'
  | 'INTRODUCTIONS'
  | 'FRIENDSHIP'
  | 'SOCIAL'
  | 'CASUAL_CHAT'

export const NETWORKING_NEED_LABELS: Record<NetworkingNeed, string> = {
  BUSINESS_EXPANSION: '拓展业务',
  INTRODUCTIONS: '认识更多朋友/引荐',
  FRIENDSHIP: '朋友关系',
  SOCIAL: '社交拓圈',
  CASUAL_CHAT: '闲聊陪伴',
}

// ─── 新字段类型定义 ────────────────────────────────────────

export type Gender = 'MALE' | 'FEMALE'

export type PersonalRelation = 'INTIMATE' | 'FAMILIAR' | 'NORMAL' | 'ACQUAINTANCE'

export type CompanyScaleNew = 'MILLION' | 'TEN_MILLION' | 'HUNDRED_MILLION' | 'BILLION' | 'TEN_BILLION'

export type JobPosition = 'FOUNDER' | 'PARTNER' | 'GENERAL_MANAGER' | 'VP' | 'DIRECTOR' | 'MANAGER' | 'OTHER'

export type JobFunction = 'MANAGEMENT' | 'INVESTMENT' | 'SALES' | 'ENGINEER' | 'MARKETING' | 'BUSINESS_DEV' | 'ADMIN' | 'OTHER'

export type InfluenceLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export type SpiritAnimalNew = 'TIGER' | 'PEACOCK' | 'OWL' | 'KOALA'

export type RoleArchetype = 'BREAKER' | 'EVANGELIST' | 'ANALYST' | 'BINDER'

export type ValueLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: '男',
  FEMALE: '女',
}

export const PERSONAL_RELATION_LABELS: Record<PersonalRelation, string> = {
  INTIMATE: '亲密',
  FAMILIAR: '熟悉',
  NORMAL: '普通',
  ACQUAINTANCE: '一面之缘',
}

export const COMPANY_SCALE_NEW_LABELS: Record<CompanyScaleNew, string> = {
  MILLION: '百万级',
  TEN_MILLION: '千万级',
  HUNDRED_MILLION: '亿级',
  BILLION: '十亿级',
  TEN_BILLION: '百亿级',
}

export const JOB_POSITION_LABELS: Record<JobPosition, string> = {
  FOUNDER: '创始人',
  PARTNER: '合伙人',
  GENERAL_MANAGER: '总经理',
  VP: '副总裁',
  DIRECTOR: '总监',
  MANAGER: '经理',
  OTHER: '其他',
}

export const JOB_FUNCTION_LABELS: Record<JobFunction, string> = {
  MANAGEMENT: '管理层',
  INVESTMENT: '投资',
  SALES: '销售',
  ENGINEER: '工程师',
  MARKETING: '市场',
  BUSINESS_DEV: '招商',
  ADMIN: '行政',
  OTHER: '其他',
}

export const INFLUENCE_LEVEL_LABELS: Record<InfluenceLevel, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
}

export const SPIRIT_ANIMAL_NEW_LABELS: Record<SpiritAnimalNew, { name: string; emoji: string; trait: string; style: string }> = {
  TIGER:   { name: '老虎',   emoji: '🐯', trait: '强势、果决、开拓型',     style: '直接推进、敢于决策' },
  PEACOCK: { name: '孔雀',   emoji: '🦚', trait: '感染力强、善于表达',     style: '自然拉近关系、社交达人' },
  OWL:     { name: '猫头鹰', emoji: '🦉', trait: '深度分析、冷静理性',     style: '低调深刻、善于观察' },
  KOALA:   { name: '考拉',   emoji: '🐨', trait: '稳重可靠、温和包容',     style: '值得信赖、慢热但真诚' },
}

export const ROLE_ARCHETYPE_LABELS: Record<RoleArchetype, { name: string; desc: string; journeyRole: string }> = {
  BREAKER:    { name: '破局者', desc: '能带来关键资源或突破口',     journeyRole: '核心目标节点' },
  EVANGELIST: { name: '布道者', desc: '人脉广泛，善于引荐连接',     journeyRole: '关键路径中转站' },
  ANALYST:    { name: '分析师', desc: '提供行业洞察与专业建议',     journeyRole: '决策支撑节点' },
  BINDER:     { name: '粘合剂', desc: '情感支持与协作伙伴',         journeyRole: '关系维护/协作节点' },
}

export const VALUE_LEVEL_LABELS: Record<ValueLevel, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  EXTREME: '极高',
}

// 一级行业选项
export const INDUSTRY_L1_OPTIONS = [
  '互联网科技',
  '金融',
  '教育',
  '医疗健康',
  '制造业',
  '房地产',
  '零售',
  '文化娱乐',
  '能源',
  '农业',
  '其他',
]

// 二级行业映射（示例）
export const INDUSTRY_L2_MAP: Record<string, string[]> = {
  '互联网科技': ['人工智能', '云计算', '大数据', '电商', '社交网络', '游戏', '其他'],
  '金融': ['银行', '证券', '保险', '基金', '支付', '其他'],
  '教育': ['K12', '高等教育', '职业培训', '在线教育', '其他'],
  '医疗健康': ['医院', '制药', '医疗器械', '互联网医疗', '其他'],
  '制造业': ['汽车', '电子', '机械', '化工', '其他'],
  '房地产': ['住宅', '商业地产', '物业管理', '其他'],
  '零售': ['超市', '便利店', '电商', '其他'],
  '文化娱乐': ['影视', '音乐', '出版', '其他'],
  '能源': ['石油', '天然气', '新能源', '其他'],
  '农业': ['种植', '养殖', '农产品加工', '其他'],
  '其他': ['其他'],
}

// ─── 新旧标签映射函数 ────────────────────────────────────────

export function mapRoleToArchetype(role: RelationRole | null | undefined): RoleArchetype | null {
  if (!role) return null
  const map: Record<RelationRole, RoleArchetype> = {
    BIG_INVESTOR: 'BREAKER',
    GATEWAY: 'EVANGELIST',
    ADVISOR: 'ANALYST',
    THERMOMETER: 'BINDER',
    LIGHTHOUSE: 'BREAKER',
    COMRADE: 'BINDER',
  }
  return map[role] ?? null
}

export function mapArchetypeToRole(archetype: RoleArchetype | null | undefined): RelationRole | null {
  if (!archetype) return null
  const map: Record<RoleArchetype, RelationRole> = {
    BREAKER: 'BIG_INVESTOR',
    EVANGELIST: 'GATEWAY',
    ANALYST: 'ADVISOR',
    BINDER: 'COMRADE',
  }
  return map[archetype] ?? null
}

export function mapAnimalOldToNew(old: SpiritAnimal | null | undefined): SpiritAnimalNew | null {
  if (!old) return null
  const map: Record<SpiritAnimal, SpiritAnimalNew> = {
    LION: 'TIGER', FOX: 'TIGER', EAGLE: 'TIGER',
    DOLPHIN: 'PEACOCK', CHAMELEON: 'PEACOCK',
    OWL: 'OWL',
    BEAR: 'KOALA', SKUNK: 'KOALA',
  }
  return map[old] ?? null
}

export function mapAnimalNewToOld(animal: SpiritAnimalNew | null | undefined): SpiritAnimal | null {
  if (!animal) return null
  const map: Record<SpiritAnimalNew, SpiritAnimal> = {
    TIGER: 'LION', PEACOCK: 'DOLPHIN', OWL: 'OWL', KOALA: 'BEAR',
  }
  return map[animal] ?? null
}

