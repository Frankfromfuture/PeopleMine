import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'

/**
 * DELETE /api/contacts/clear-all
 * 删除当前用户的所有联系人（测试数据清理）
 */
export async function DELETE() {
  try {
    // 认证
    userId = await getAuthUserId()

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

    // 人物清空后，连带清空该用户企业及企业关系
    const companies = await db.company.findMany({
      where: { userId },
      select: { id: true },
    })
    const companyIds = companies.map((c) => c.id)

    if (companyIds.length > 0) {
      await db.companyRelation.deleteMany({
        where: {
          OR: [
            { companyIdA: { in: companyIds } },
            { companyIdB: { in: companyIds } },
          ],
        },
      })
    }

    const deletedCompanies = await db.company.deleteMany({
      where: { userId },
    })

    return NextResponse.json({
      success: true,
      message: `成功删除 ${result.count} 个联系人，${deletedCompanies.count} 个企业`,
      count: result.count,
      companyCount: deletedCompanies.count,
    })
  } catch (error) {
    console.error('DELETE /api/contacts/clear-all 错误:', error)
    return NextResponse.json(
      { error: '删除失败: ' + String(error) },
      { status: 500 },
    )
  }
}
