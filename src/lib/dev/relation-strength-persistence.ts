/**
 * 服务端专用 — 关系强度配置持久化
 * 使用 Node.js fs/path，只能在 API Route / Server Component 中导入
 */
import fs from 'fs'
import path from 'path'
import { DEFAULT_RELATION_STRENGTH_CONFIG } from './relation-strength-store'
import type { RelationStrengthConfig } from './relation-strength-store'

const CONFIG_PATH = path.join(process.cwd(), 'src/data/dev/relation-strength-config.json')

export function loadRelationStrengthConfig(): RelationStrengthConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<RelationStrengthConfig>
    return {
      ...DEFAULT_RELATION_STRENGTH_CONFIG,
      ...parsed,
      weights: { ...DEFAULT_RELATION_STRENGTH_CONFIG.weights, ...(parsed.weights ?? {}) },
      industryConfig: { ...DEFAULT_RELATION_STRENGTH_CONFIG.industryConfig, ...(parsed.industryConfig ?? {}) },
      recencyConfig: { ...DEFAULT_RELATION_STRENGTH_CONFIG.recencyConfig, ...(parsed.recencyConfig ?? {}) },
      universeConfig: { ...DEFAULT_RELATION_STRENGTH_CONFIG.universeConfig, ...(parsed.universeConfig ?? {}) },
      positionOrdinals: { ...DEFAULT_RELATION_STRENGTH_CONFIG.positionOrdinals, ...(parsed.positionOrdinals ?? {}) },
      roleComplementMatrix: parsed.roleComplementMatrix ?? DEFAULT_RELATION_STRENGTH_CONFIG.roleComplementMatrix,
      animalAffinityMatrix: parsed.animalAffinityMatrix ?? DEFAULT_RELATION_STRENGTH_CONFIG.animalAffinityMatrix,
      temperatureMatrix: parsed.temperatureMatrix ?? DEFAULT_RELATION_STRENGTH_CONFIG.temperatureMatrix,
      functionAffinityMatrix: parsed.functionAffinityMatrix ?? DEFAULT_RELATION_STRENGTH_CONFIG.functionAffinityMatrix,
    }
  } catch {
    return DEFAULT_RELATION_STRENGTH_CONFIG
  }
}

export function saveRelationStrengthConfig(cfg: RelationStrengthConfig): void {
  const dir = path.dirname(CONFIG_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8')
}
