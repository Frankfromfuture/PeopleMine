export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import CompaniesTable from './CompaniesTable'
import { syncCompaniesFromContacts } from '@/lib/company-sync'

export default async function CompaniesPage() {
  let userId = ''
  let companies: Awaited<ReturnType<typeof db.company.findMany>> = []
  let dbError: string | null = null

  try {
    userId = await getAuthUserId()
  } catch (err) {
    dbError = err instanceof Error ? err.message : '数据库连接失败'
  }

  if (userId) {
    try {
      await syncCompaniesFromContacts(userId)
      companies = await db.company.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          industry: true,
          scale: true,
          tags: true,
          temperature: true,
          energyScore: true,
          familiarityLevel: true,
          mainBusiness: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          contacts: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
      })
    } catch (err) {
      dbError = err instanceof Error ? err.message : '数据库连接失败'
    }
  }

  return (
    <div className="min-h-full">
      {dbError && (
        <div className="bg-amber-50 border-b border-amber-200 px-8 py-4">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">⚠️ 数据库暂时不可用：</span> {dbError}
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Supabase 闲置连接被回收，刷新页面即可恢复。
          </p>
        </div>
      )}

      <div className="px-8 py-7">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">企业数据库</h1>
          <Link
            href="/companies/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            新增企业
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <CompaniesTable companies={companies as never} />
        </div>
      </div>
    </div>
  )
}
