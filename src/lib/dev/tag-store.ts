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
  categories: [],
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
