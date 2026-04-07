export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import { COMPANY_SCALE_LABELS, ROLE_ARCHETYPE_LABELS } from '@/types'
import type { CompanyScale, Temperature, RoleArchetype } from '@/types'
import { ARCHETYPE_STYLES } from '@/components/RoleArchetypeTag'

const TEMP_LABELS: Record<Temperature, { label: string; color: string }> = {
  COLD: { label: '冷', color: 'bg-gray-100 text-gray-700' },
  WARM: { label: '温', color: 'bg-gray-100 text-gray-700' },
  HOT:  { label: '热', color: 'bg-gray-100 text-gray-700' },
}

const ROLE_STYLE: Record<RoleArchetype, string> = ARCHETYPE_STYLES

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const userId = await getAuthUserId()

  const company = await db.company.findFirst({
    where: { id, userId },
    include: {
      contacts: { select: { id: true, name: true, roleArchetype: true, title: true } },
      relationsA: { include: { companyB: { select: { id: true, name: true, industry: true, scale: true } } } },
      relationsB: { include: { companyA: { select: { id: true, name: true, industry: true, scale: true } } } },
    },
  }).catch(() => null)

  if (!company) notFound()

  const tags = parseJsonArray(company.tags)
  const investors = parseJsonArray(company.investors)
  const upstreams = parseJsonArray(company.upstreams)
  const downstreams = parseJsonArray(company.downstreams)
  const scaleInfo = company.scale ? COMPANY_SCALE_LABELS[company.scale as CompanyScale] : null

  const relatedCompanies = [
    ...company.relationsA.map((r) => ({ ...r.companyB, desc: r.relationDesc })),
    ...company.relationsB.map((r) => ({ ...r.companyA, desc: r.relationDesc })),
  ]

  return (
    <div className="min-h-full px-8 py-7">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/dashboard" className="hover:text-gray-600 transition-colors">首页</Link>
        <span>/</span>
        <Link href="/companies" className="hover:text-gray-600 transition-colors">企业数据库</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{company.name}</span>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Header card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-2xl font-bold text-gray-700"
                style={{ opacity: 0.4 + (company.energyScore / 100) * 0.6 }}
              >
                {company.name.slice(0, 1)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-semibold text-gray-900">{company.name}</h1>
                  {scaleInfo && (
                    <span className={`px-2 py-0.5 text-xs rounded border font-medium ${scaleInfo.color}`}>
                      {scaleInfo.name}
                    </span>
                  )}
                  {company.temperature && (
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${TEMP_LABELS[company.temperature as Temperature].color}`}>
                      {TEMP_LABELS[company.temperature as Temperature].label}
                    </span>
                  )}
                </div>
                {company.industry && <p className="text-sm text-gray-500">{company.industry}</p>}
                {company.mainBusiness && <p className="text-sm text-gray-600 mt-1">{company.mainBusiness}</p>}
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-gray-600 hover:underline mt-1 block"
                  >
                    {company.website}
                  </a>
                )}
              </div>
            </div>
            <Link
              href={`/companies/${id}/edit`}
              className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              编辑
            </Link>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {tags.map((t) => (
                <span key={t} className="px-2.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{t}</span>
              ))}
            </div>
          )}

          {/* Energy + Familiarity */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 mb-1">能量值</p>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-400 rounded-full" style={{ width: `${company.energyScore}%` }} />
                </div>
                <span className="text-xs text-gray-500">{company.energyScore}</span>
              </div>
            </div>
            {company.familiarityLevel && (
              <div>
                <p className="text-xs text-gray-400 mb-1">熟悉程度</p>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className={`w-2 h-4 rounded-full ${i <= company.familiarityLevel! ? 'bg-gray-400' : 'bg-gray-200'}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Capital & Ecosystem */}
        {(company.founderName || investors.length > 0 || upstreams.length > 0 || downstreams.length > 0) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">资本与生态</h2>
            <div className="space-y-3">
              {company.founderName && (
                <div className="flex items-start gap-3">
                  <span className="text-xs text-gray-400 w-20 flex-shrink-0 pt-0.5">创始人</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">{company.founderName}</span>
                    {company.founderContactId && (
                      <Link href={`/contacts/${company.founderContactId}`}
                        className="text-xs text-gray-600 hover:underline"
                      >
                        → 查看人脉
                      </Link>
                    )}
                  </div>
                </div>
              )}
              {investors.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="text-xs text-gray-400 w-20 flex-shrink-0 pt-0.5">投资机构</span>
                  <div className="flex flex-wrap gap-1.5">
                    {investors.map((inv) => (
                      <span key={inv} className="px-2 py-0.5 text-xs bg-gray-50 text-gray-700 border border-gray-200 rounded">{inv}</span>
                    ))}
                  </div>
                </div>
              )}
              {upstreams.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="text-xs text-gray-400 w-20 flex-shrink-0 pt-0.5">上游</span>
                  <div className="flex flex-wrap gap-1.5">
                    {upstreams.map((u) => (
                      <span key={u} className="px-2 py-0.5 text-xs bg-gray-50 text-gray-700 border border-gray-200 rounded">{u}</span>
                    ))}
                  </div>
                </div>
              )}
              {downstreams.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="text-xs text-gray-400 w-20 flex-shrink-0 pt-0.5">下游</span>
                  <div className="flex flex-wrap gap-1.5">
                    {downstreams.map((d) => (
                      <span key={d} className="px-2 py-0.5 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded">{d}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Linked contacts */}
        {company.contacts.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              关联人脉 <span className="text-gray-400 font-normal">({company.contacts.length})</span>
            </h2>
            <div className="space-y-2">
              {company.contacts.map((c) => {
                const roleInfo = c.roleArchetype ? ROLE_ARCHETYPE_LABELS[c.roleArchetype as RoleArchetype] : null
                return (
                  <Link
                    key={c.id}
                    href={`/contacts/${c.id}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                      {c.name.slice(0, 1)}
                    </div>
                    <span className="text-sm text-gray-700 flex-1">{c.name}</span>
                    {c.title && <span className="text-xs text-gray-400">{c.title}</span>}
                    {roleInfo && (
                      <span className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${ROLE_STYLE[c.roleArchetype as RoleArchetype]}`}>
                        {roleInfo.name}
                      </span>
                    )}
                    <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Related companies */}
        {relatedCompanies.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">关联企业</h2>
            <div className="space-y-2">
              {relatedCompanies.map((rc) => (
                <Link
                  key={rc.id}
                  href={`/companies/${rc.id}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-600">
                    {rc.name.slice(0, 1)}
                  </div>
                  <span className="text-sm text-gray-700 flex-1">{rc.name}</span>
                  {rc.industry && <span className="text-xs text-gray-400">{rc.industry}</span>}
                  {rc.desc && <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{rc.desc}</span>}
                  <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {company.notes && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">备注</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{company.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
