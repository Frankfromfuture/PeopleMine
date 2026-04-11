export const dynamic = 'force-dynamic'

import Link from 'next/link'
import PageHeader from '@/components/PageHeader'
import { getAuthUserId } from '@/lib/session'
import ContactsTable from '../contacts/ContactsTable'
import CompaniesTable from '../companies/CompaniesTable'
import { syncCompaniesFromContacts } from '@/lib/company-sync'
import { db } from '@/lib/db'

type Props = {
  searchParams: Promise<{ type?: string; role?: string }>
}

export default async function ResourcesPage({ searchParams }: Props) {
  const params = await searchParams
  const type = params.type === 'companies' ? 'companies' : 'contacts'
  const roleFilter = params.role ?? null

  let userId = ''
  let dbError: string | null = null

  try {
    userId = await getAuthUserId()
  } catch (err) {
    dbError = err instanceof Error ? err.message : '数据库连接失败'
  }

  let contacts: Array<{
    id: string
    name: string
    roleArchetype: 'BREAKER' | 'EVANGELIST' | 'ANALYST' | 'BINDER' | null
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

  if (userId && !dbError) {
    try {
      if (type === 'contacts') {
        contacts = await db.contact.findMany({
          where: {
            userId,
            ...(roleFilter ? { roleArchetype: roleFilter as never } : {}),
          },
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            name: true,
            roleArchetype: true,
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
      } else {
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
      }
    } catch (err) {
      dbError = err instanceof Error ? err.message : '数据库连接失败'
    }
  }

  const isContacts = type === 'contacts'

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

      <div className="px-6 py-4 lg:px-8">
        <PageHeader
          items={[
            { label: '首页', href: '/dashboard' },
            { label: '资源数据库' },
          ]}
          title="资源数据库"
          summary="在联系人与企业视图间快速切换，统一从资源角度筛选、浏览并继续沉淀资产。"
          hints={[
            '支持在联系人与企业两个资源视图之间快速切换。',
            '联系人视图可叠加角色筛选，企业视图会保持同一排序逻辑。',
            '新增入口与列表操作均保持和资产页一致的工作节奏。',
          ]}
        />

        <div className="mt-1 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-gray-200 bg-white px-3.5 py-3">
          <div className="flex items-center rounded-xl border border-gray-200 bg-[#fafaf9] p-1">
            <Link
              href="/resources?type=contacts"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                isContacts ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              人脉
            </Link>
            <Link
              href="/resources?type=companies"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                !isContacts ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              企业
            </Link>
          </div>

          <Link
            href={isContacts ? '/contacts/new' : '/companies/new'}
            className="flex items-center gap-1.5 rounded-2xl bg-[#A04F47] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#A04F47]/90"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {isContacts ? '新增联系人' : '新增企业'}
          </Link>
        </div>

        <div className="mt-1 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {isContacts ? <ContactsTable contacts={contacts} /> : <CompaniesTable companies={companies as never} />}
        </div>
      </div>
    </div>
  )
}
