import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'

/**
 * DELETE /api/contacts/clear-all
 * 删除当前用户的所有联系人（测试数据清理）
 */
export async function DELETE() {
  try {
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

    // 获取该用户的所有联系人 ID
    const contacts = await db.contact.findMany({
      where: { userId },
      select: { id: true },
    })

    if (contacts.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有联系人要删除',
        count: 0,
      })
    }

    const contactIds = contacts.map((c) => c.id)

    // 先删除所有关系（因为 ContactRelation 依赖 Contact）
    await db.contactRelation.deleteMany({
      where: {
        OR: [
          { contactIdA: { in: contactIds } },
          { contactIdB: { in: contactIds } },
        ],
      },
    })

    // 再删除所有交互记录
    await db.interaction.deleteMany({
      where: { contactId: { in: contactIds } },
    })

    // 最后删除联系人
    const result = await db.contact.deleteMany({
      where: { userId },
    })

    return NextResponse.json({
      success: true,
      message: `成功删除 ${result.count} 个联系人`,
      count: result.count,
    })
  } catch (error) {
    console.error('DELETE /api/contacts/clear-all 错误:', error)
    return NextResponse.json(
      { error: '删除失败: ' + String(error) },
      { status: 500 },
    )
  }
}
