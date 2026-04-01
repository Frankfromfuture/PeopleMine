import fs from 'fs'
import path from 'path'

export interface TagSubcategory {
  id: string
  name: string
  tags: string[]
}

export interface TagCategory {
  id: string
  name: string
  subcategories: TagSubcategory[]
}

export interface TagConfig {
  categories: TagCategory[]
}

const CONFIG_PATH = path.join(process.cwd(), 'src/data/dev/tag-config.json')

const DEFAULT_TAG_CONFIG: TagConfig = {
  categories: [
    {
      id: 'cat-industry',
      name: '行业',
      subcategories: [
        { id: 'sub-tech', name: '科技', tags: ['AI', '互联网', '区块链', '芯片'] },
        { id: 'sub-finance', name: '金融', tags: ['投资', 'VC', '银行'] },
        { id: 'sub-health', name: '医疗', tags: ['医疗', '健康', '生物医药'] },
        { id: 'sub-edu', name: '教育', tags: ['教育', '培训', '在线教育'] },
      ],
    },
    {
      id: 'cat-function',
      name: '职能',
      subcategories: [
        { id: 'sub-product', name: '产品与设计', tags: ['产品', '设计', 'UX'] },
        { id: 'sub-ops', name: '运营与市场', tags: ['运营', '市场', '增长'] },
        { id: 'sub-tech-func', name: '技术开发', tags: ['前端', '后端', '数据', '算法'] },
        { id: 'sub-biz', name: '商务', tags: ['销售', '商务', 'BD'] },
      ],
    },
  ],
}

export function loadTagConfig(): TagConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
    return JSON.parse(raw) as TagConfig
  } catch {
    return DEFAULT_TAG_CONFIG
  }
}

export function saveTagConfig(config: TagConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
}

export function flattenTags(config: TagConfig): string[] {
  const tags: string[] = []
  for (const cat of config.categories) {
    for (const sub of cat.subcategories) {
      tags.push(...sub.tags)
    }
  }
  return [...new Set(tags)]
}
