export const dynamic = 'force-dynamic'

import Link from "next/link"
import { db } from "@/lib/db"
import { getAuthUserId } from "@/lib/session"
import ContactsTable from "./ContactsTable"

export default async function ContactsPage() {
  const userId = await getAuthUserId()

  let contacts: Array<{
    id: string
    name: string
    relationRole: 'BIG_INVESTOR' | 'GATEWAY' | 'ADVISOR' | 'THERMOMETER' | 'LIGHTHOUSE' | 'COMRADE'
    tags: string | null
    temperature: 'COLD' | 'WARM' | 'HOT' | null
    trustLevel: number | null
    company: string | null
    title: string | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    lastContactedAt: Date | null
  }> = []
  let dbError = null

  try {
    const result = await db.contact.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        relationRole: true,
        tags: true,
        temperature: true,
        trustLevel: true,
        company: true,
        title: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        lastContactedAt: true,
      },
    })
    contacts = result
  } catch (error) {
    dbError = error instanceof Error ? error.message : '数据库连接失败'
    console.error('数据库错误:', error)
  }

  return (
    <div className="min-h-full">
      {/* ── Database error warning ── */}
      {dbError && (
        <div className="bg-amber-50 border-b border-amber-200 px-8 py-4">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">⚠️ 数据库暂时不可用：</span> {dbError}
          </p>
          <p className="text-xs text-amber-700 mt-1">
            数据库连接失败，刷新页面即可恢复。
          </p>
        </div>
      )}

      <div className="px-8 py-7">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">人脉数据库</h1>
        <Link
          href="/contacts/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          新增联系人
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <ContactsTable contacts={contacts} />
      </div>
      </div>
    </div>
  )
}
