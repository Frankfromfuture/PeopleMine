// PeopleMine — TypeScript 类型定义

export type SpiritAnimal = 'LION' | 'FOX' | 'BEAR' | 'CHAMELEON' | 'EAGLE' | 'DOLPHIN' | 'OWL' | 'SKUNK'

export type RelationRole = 'BIG_INVESTOR' | 'GATEWAY' | 'ADVISOR' | 'THERMOMETER' | 'LIGHTHOUSE' | 'COMRADE'

export type Temperature = 'COLD' | 'WARM' | 'HOT'

export type InteractionType = 'MEETING' | 'CALL' | 'EMAIL' | 'MESSAGE' | 'EVENT' | 'OTHER'

export const SPIRIT_ANIMAL_LABELS: Record<SpiritAnimal, { name: string; trait: string; style: string }> = {
  LION:      { name: '狮子',  trait: '强势、权威、领袖型',   style: '直接、发号施令、大局观' },
  FOX:       { name: '狐狸',  trait: '精明、圆滑、策略型',   style: '巧妙周旋、善于谈判' },
  BEAR:      { name: '熊',    trait: '稳重、可靠、信赖型',   style: '慢热但诚实、值得依赖' },
  CHAMELEON: { name: '变色龙', trait: '适应力强、多面型',    style: '见人说人话、灵活切换' },
  EAGLE:     { name: '鹰',    trait: '敏锐、远见、判断力强', style: '观察入微、一针见血' },
  DOLPHIN:   { name: '海豚',  trait: '亲和、感染力、社交型', style: '自然拉近关系、氛围制造者' },
  OWL:       { name: '猫头鹰', trait: '深沉、安静、知识型',  style: '低调但深刻、坐得住' },
  SKUNK:     { name: '臭鼬',  trait: '古怪、独特、反常规',   style: '感觉不好相处但随时惊喜' },
}

export const RELATION_ROLE_LABELS: Record<RelationRole, { name: string; desc: string; journeyRole: string }> = {
  BIG_INVESTOR: { name: '大金主',  desc: '能直接带来业务/资源',     journeyRole: '核心目标节点' },
  GATEWAY:      { name: '传送门',  desc: '认识很多人，能引荐你',    journeyRole: '关键路径中转站' },
  ADVISOR:      { name: '智囊',    desc: '给你提供行业洞察与建议',  journeyRole: '决策支撑节点' },
  THERMOMETER:  { name: '温度计',  desc: '情感支持、社交润滑剂',    journeyRole: '关系维护节点' },
  LIGHTHOUSE:   { name: '灯塔',    desc: '行业大佬，可仰望但难接近', journeyRole: '远期目标节点' },
  COMRADE:      { name: '战友',    desc: '能并肩作战的伙伴',        journeyRole: '协作节点' },
}

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
