export type IndustryRule = {
  industry: string
  strong: string[]
  weak: string[]
}

export const INDUSTRY_RULES: IndustryRule[] = [
  {
    industry: '人工智能',
    strong: ['ai', 'aigc', '大模型', 'llm', '机器学习', '深度学习', '计算机视觉', '自然语言处理', 'nlu', 'nlp', '智能体', 'agent'],
    weak: ['算法', '训练', '推理', '模型', 'prompt'],
  },
  {
    industry: '企业服务（ToB/SaaS）',
    strong: ['saas', 'crm', 'erp', 'hr saas', '企业服务', '协同办公', '低代码', '云办公'],
    weak: ['to b', 'tob', '企业数字化', '工作流', '中台'],
  },
  {
    industry: '互联网科技',
    strong: ['互联网', 'it', '软件', 'app', '平台', '云计算', '大数据', '前端', '后端', '开发者', '技术社区'],
    weak: ['科技', '程序员', '产品经理', '运营', '增长'],
  },
  {
    industry: '金融',
    strong: ['金融', '银行', '证券', '基金', '保险', '财富管理', '投行', '量化', '私募', '风控'],
    weak: ['理财', '投资', '资管', '交易'],
  },
  {
    industry: '医疗健康',
    strong: ['医疗', '医药', '医院', '生物医药', '医疗器械', '健康管理', '互联网医疗', '制药'],
    weak: ['临床', '康复', '药', '诊所'],
  },
  {
    industry: '教育',
    strong: ['教育', '学校', '教培', '职业教育', 'k12', '高教', '在线教育', '留学'],
    weak: ['课程', '老师', '培训', '辅导'],
  },
  {
    industry: '消费零售',
    strong: ['零售', '快消', '消费品', '品牌', '新消费', '商超', '连锁'],
    weak: ['门店', '导购', '会员体系', '私域'],
  },
  {
    industry: '电商与跨境',
    strong: ['电商', '跨境电商', '淘宝', '天猫', '京东', '拼多多', '抖音电商', '亚马逊', 'shopify'],
    weak: ['直播带货', '选品', '店铺运营'],
  },
  {
    industry: '物流与供应链',
    strong: ['物流', '供应链', '仓储', '冷链', '货运', '配送', '快递'],
    weak: ['履约', '干线', '运输'],
  },
  {
    industry: '制造业',
    strong: ['制造', '工业', '工厂', '智能制造', '工业互联网', '机械', '自动化', '电子制造'],
    weak: ['产线', '设备', '质检'],
  },
  {
    industry: '汽车与出行',
    strong: ['汽车', '新能源车', '智能驾驶', '出行', '网约车', '车联网', '充电桩'],
    weak: ['整车', '4s', '驾驶辅助'],
  },
  {
    industry: '房地产与建筑',
    strong: ['房地产', '地产', '建筑', '工程', '物业', '家装', '建材'],
    weak: ['土木', '施工', '楼盘'],
  },
  {
    industry: '能源与环保',
    strong: ['能源', '新能源', '光伏', '风电', '储能', '电力', '环保', '碳中和'],
    weak: ['节能', '减排', '清洁能源'],
  },
  {
    industry: '文化传媒',
    strong: ['传媒', '广告', '公关', '内容', '短视频', '自媒体', 'mcn', '影视', '出版'],
    weak: ['传播', '品牌营销', '文案'],
  },
  {
    industry: '游戏',
    strong: ['游戏', '手游', '端游', '发行', '游戏研发', '电竞'],
    weak: ['unity', '虚幻', '玩法', '美术'],
  },
  {
    industry: '法律与咨询',
    strong: ['法律', '律所', '律师', '咨询', '管理咨询', '战略咨询', '审计', '税务'],
    weak: ['合规', '尽调', '法务'],
  },
  {
    industry: '政府与公共服务',
    strong: ['政府', '公共服务', '事业单位', '国企', '城投', '公共管理'],
    weak: ['政务', '民生', '公共治理'],
  },
  {
    industry: '农业与食品',
    strong: ['农业', '农产品', '食品', '餐饮供应链', '食品加工', '生鲜'],
    weak: ['种植', '养殖', '餐饮'],
  },
  {
    industry: '旅游与酒店',
    strong: ['旅游', '酒店', '文旅', '民宿', '旅行社'],
    weak: ['景区', '会展', '度假'],
  },
]

type IndustryScore = {
  industry: string
  score: number
  strongHits: number
}

function normalizeText(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ')
}

function normalizeTag(input: string): string {
  return normalizeText(input).replace(/\s+/g, '')
}

export function inferFromTags(tags: string[]): string {
  const normalizedTags = Array.from(
    new Set(tags.map((tag) => normalizeTag(tag)).filter(Boolean)),
  )

  if (normalizedTags.length === 0) return '其他'

  const scores: IndustryScore[] = INDUSTRY_RULES.map((rule) => {
    let score = 0
    let strongHits = 0

    const industryNorm = normalizeTag(rule.industry)
    const strongMatched = new Set<string>()
    const weakMatched = new Set<string>()

    for (const tag of normalizedTags) {
      if (tag === industryNorm) {
        score += 4
      }

      for (const keyword of rule.strong) {
        const keywordNorm = normalizeTag(keyword)
        if (!keywordNorm || strongMatched.has(keywordNorm)) continue
        if (tag.includes(keywordNorm)) {
          strongMatched.add(keywordNorm)
          score += 3
          strongHits += 1
        }
      }

      for (const keyword of rule.weak) {
        const keywordNorm = normalizeTag(keyword)
        if (!keywordNorm || weakMatched.has(keywordNorm)) continue
        if (tag.includes(keywordNorm)) {
          weakMatched.add(keywordNorm)
          score += 1
        }
      }
    }

    return {
      industry: rule.industry,
      score,
      strongHits,
    }
  })

  scores.sort((a, b) => b.score - a.score)
  const best = scores[0]
  if (!best || best.score < 3) return '其他'

  const tied = scores.filter((s) => s.score === best.score)
  if (tied.length === 1) return best.industry

  tied.sort((a, b) => b.strongHits - a.strongHits)
  if (tied.length >= 2 && tied[0].strongHits === tied[1].strongHits) {
    return '其他'
  }

  return tied[0].industry
}
