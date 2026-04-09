import Link from 'next/link'
import { db } from '@/lib/db'
import PageHeader from '@/components/PageHeader'
import { getAuthUserId } from '@/lib/session'
import CompaniesTable from './CompaniesTable'
import { syncCompaniesFromContacts } from '@/lib/company-sync'

export default async function CompaniesPage() {
  let userId = ''
  type CompanyRow = {
    id: string
    name: string
    industry: string | null
    scale: string | null
    tags: string | null
    temperature: string | null
    energyScore: number
    familiarityLevel: number | null
    mainBusiness: string | null
    notes: string | null
    createdAt: Date
    updatedAt: Date
    contacts: { id: string; name: string }[]
  }
  let companies: CompanyRow[] = []
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
        <div className="border-b border-gray-200 bg-gray-50 px-8 py-4">
          <p className="text-sm text-gray-800">
            <span className="font-semibold">数据库暂时不可用：</span> {dbError}
          </p>
          <p className="mt-1 text-xs text-gray-700">数据库连接失败，刷新页面即可恢复。</p>
        </div>
      )}

      <div className="px-8 py-7">
        <PageHeader
          items={[
            { label: '首页', href: '/dashboard' },
            { label: '企业资产' },
          ]}
          title="企业资产"
          summary="集中查看由联系人沉淀出的企业资产，便于从公司维度继续拓展关系网络。"
          hints={[
            '企业数据会基于联系人信息自动同步生成。',
            '这里适合从公司视角查看能量、熟悉度和关联联系人。',
            '右侧按钮可继续新增企业或补充更多组织信息。',
          ]}
          actions={
            <Link
              href="/companies/new"
              className="flex items-center gap-1.5 rounded-2xl bg-[#A04F47] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#A04F47]/90"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              新增企业
            </Link>
          }
        />

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <CompaniesTable companies={companies as never} />
        </div>
      </div>
    </div>
  )
}
