/**
 * 人脉标签迁移脚本
 *
 * 功能：
 * 1. 将旧 relationRole → roleArchetype（如果 roleArchetype 尚未设置）
 * 2. 清空旧字段：relationRole, tags, tagV2
 *
 * 运行方式：
 *   npx ts-node --project tsconfig.json prisma/scripts/migrate-tags.ts
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as never)

const ROLE_TO_ARCHETYPE: Record<string, string> = {
  BIG_INVESTOR: 'BREAKER',
  LIGHTHOUSE:   'BREAKER',
  GATEWAY:      'EVANGELIST',
  ADVISOR:      'ANALYST',
  THERMOMETER:  'BINDER',
  COMRADE:      'BINDER',
}

async function main() {
  const contacts = await prisma.contact.findMany({
    select: { id: true, relationRole: true, roleArchetype: true },
  })

  console.log(`共 ${contacts.length} 条联系人，开始迁移...`)

  let migrated = 0
  let kept = 0
  let cleared = 0

  for (const c of contacts) {
    const targetArchetype = c.roleArchetype
      ?? (c.relationRole ? ROLE_TO_ARCHETYPE[c.relationRole] ?? null : null)

    await prisma.contact.update({
      where: { id: c.id },
      data: {
        roleArchetype: targetArchetype as never ?? null,
        // 清空旧字段
        relationRole: null,
        tags: null,
      },
    })

    if (!c.roleArchetype && targetArchetype) migrated++
    else if (c.roleArchetype) kept++
    else cleared++
  }

  console.log(`✅ 完成`)
  console.log(`   从 relationRole 迁移到 roleArchetype：${migrated} 条`)
  console.log(`   已有 roleArchetype 保留：${kept} 条`)
  console.log(`   无标签数据清空：${cleared} 条`)
  console.log(`   旧字段（relationRole / tags）已全部清空`)
}

main()
  .catch((e) => {
    console.error('迁移失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
