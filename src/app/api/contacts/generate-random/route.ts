import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { generateRandomContacts } from '@/lib/test-data-generator'

/**
 * POST /api/contacts/generate-random
 * 生成指定数量的随机联系人
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { count = 10, tagVariability = 50 } = body

    // 验证参数
    if (!Number.isInteger(count) || count < 1 || count > 500) {
      return NextResponse.json(
        { error: '生成数量必须在 1-500 之间' },
        { status: 400 },
      )
    }

    if (!Number.isInteger(tagVariability) || tagVariability < 0 || tagVariability > 100) {
      return NextResponse.json(
        { error: '标签波动性必须在 0-100 之间' },
        { status: 400 },
      )
    }

    // 认证
    let userId: string
    try {
      const { userId: authUserId } = await requireAuth()
      userId = authUserId
    } catch {
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
          { error: '未登录' },
          { status: 401 },
        )
      }
      // 开发模式：使用固定的 demo 用户 ID
      userId = 'dev-user'
    }

    // 确保用户存在（开发模式）
    if (userId === 'dev-user') {
      try {
        await db.user.create({
          data: {
            id: userId,
            phone: '13800138000',
            name: 'Demo 用户',
          },
        })
      } catch {
        // 用户已存在，忽略
      }
    }

    // 生成随机联系人数据
    const randomContacts = generateRandomContacts(count, tagVariability)

    // 顺序创建（避免超时）
    const createdContacts = []
    for (const contact of randomContacts) {
      try {
        const created = await db.contact.create({
          data: {
            userId,
            name: contact.name,
            relationRole: contact.relationRole,
            tags: contact.tags.length > 0 ? JSON.stringify(contact.tags) : null,
            energyScore: contact.energyScore,
            temperature: contact.temperature,
            trustLevel: contact.trustLevel,
            company: contact.company,
            title: contact.title,
            notes: contact.notes,
          },
        })
        createdContacts.push(created)
      } catch (error) {
        console.error('创建单个联系人失败:', error)
        // 继续创建下一个
      }
    }

    return NextResponse.json({
      success: true,
      message: `成功生成 ${count} 个随机联系人`,
      count: createdContacts.length,
      contacts: createdContacts.map((c) => ({
        id: c.id,
        name: c.name,
        relationRole: c.relationRole,
        company: c.company,
        title: c.title,
      })),
    })
  } catch (error) {
    console.error('POST /api/contacts/generate-random 错误:', error)
    return NextResponse.json(
      { error: '生成失败: ' + String(error) },
      { status: 500 },
    )
  }
}
