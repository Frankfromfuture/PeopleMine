export const dynamic = 'force-dynamic'

import Link from 'next/link'
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

  // ── auth ──────────────────────────────────────────────────
  let userId = ''
  let dbError: string | null = null
  try {
    userId = await getAuthUserId()
  } catch (err) {
    dbError = err instanceof Error ? err.message : '数据库连接失败'
  }

  // ── data ──────────────────────────────────────────────────
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

  type CompanyRow = { id: string; name: string; industry: string | null; scale: string | null; tags: string | null; temperature: string | null; energyScore: number; familiarityLevel: number | null; mainBusiness: string | null; notes: string | null; createdAt: Date; updatedAt: Date; contacts: { id: string; name: string }[] }
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
      {/* ── DB error banner ── */}
      {dbError && (
        <div className="bg-gray-50 border-b border-gray-200 px-8 py-4">
          <p className="text-sm text-gray-800">
            <span className="font-semibold">⚠️ 数据库暂时不可用：</span> {dbError}
          </p>
          <p className="text-xs text-gray-700 mt-1">数据库连接失败，刷新页面即可恢复。</p>
        </div>
      )}

      <div className="px-8 py-7">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-text-primary">资源数据库</h1>

            {/* ── Toggle tabs ── */}
            <div className="flex items-center bg-app-surface rounded-lg p-1 gap-0.5">
              <Link
                href="/resources?type=contacts"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  isContacts
                    ? 'bg-white/90 text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-gray-700'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                人脉
              </Link>
              <Link
                href="/resources?type=companies"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  !isContacts
                    ? 'bg-white/90 text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-gray-700'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                企业
              </Link>
            </div>
          </div>

          {/* ── Add button ── */}
          {isContacts ? (
            <Link
              href="/contacts/new"
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              新增联系人
            </Link>
          ) : (
            <Link
              href="/companies/new"
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              新增企业
            </Link>
          )}
        </div>

        {/* ── Table ── */}
        <div className="bg-white/90 rounded-xl border border-line-standard overflow-hidden">
          {isContacts
            ? <ContactsTable contacts={contacts} />
            : <CompaniesTable companies={companies as never} />
          }
        </div>
      </div>
    </div>
  )
}
