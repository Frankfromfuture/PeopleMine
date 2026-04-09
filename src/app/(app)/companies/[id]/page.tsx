export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import PageShell from '@/components/PageShell'
import { getAuthUserId } from '@/lib/session'
import { COMPANY_SCALE_LABELS, ROLE_ARCHETYPE_LABELS } from '@/types'
import type { CompanyScale, RoleArchetype, Temperature } from '@/types'
import { ARCHETYPE_STYLES } from '@/components/RoleArchetypeTag'

const TEMP_LABELS: Record<Temperature, { label: string; color: string }> = {
  COLD: { label: '冷', color: 'bg-gray-100 text-gray-700' },
  WARM: { label: '温', color: 'bg-gray-100 text-gray-700' },
  HOT: { label: '热', color: 'bg-gray-100 text-gray-700' },
}

const ROLE_STYLE: Record<RoleArchetype, string> = ARCHETYPE_STYLES

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getAuthUserId()

  const company = await db.company
    .findFirst({
      where: { id, userId },
      include: {
        contacts: { select: { id: true, name: true, roleArchetype: true, title: true } },
        relationsA: { include: { companyB: { select: { id: true, name: true, industry: true, scale: true } } } },
        relationsB: { include: { companyA: { select: { id: true, name: true, industry: true, scale: true } } } },
      },
    })
    .catch(() => null)

  if (!company) notFound()

  const tags = parseJsonArray(company.tags)
  const investors = parseJsonArray(company.investors)
  const upstreams = parseJsonArray(company.upstreams)
  const downstreams = parseJsonArray(company.downstreams)
  const scaleInfo = company.scale ? COMPANY_SCALE_LABELS[company.scale as CompanyScale] : null
  const relatedCompanies = [
    ...company.relationsA.map((relation) => ({ ...relation.companyB, desc: relation.relationDesc })),
    ...company.relationsB.map((relation) => ({ ...relation.companyA, desc: relation.relationDesc })),
  ]

  return (
    <PageShell
      items={[
        { label: '首页', href: '/dashboard' },
        { label: '企业资产', href: '/companies' },
        { label: company.name },
      ]}
      title={company.name}
      summary="查看企业规模、生态关系、关联人脉以及后续可继续追踪的上下游信息。"
      hints={[
        '详情页已经接入统一题头和全宽工作区容器。',
        '这里适合沿着企业继续跳转到联系人或关联公司。',
        '内容容器会在不同分辨率下保持稳定边距和阅读节奏。',
      ]}
      contentClassName="items-start"
    >
      <div className="w-full max-w-4xl space-y-6">
        <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 text-2xl font-bold text-gray-700"
                style={{ opacity: 0.4 + (company.energyScore / 100) * 0.6 }}
              >
                {company.name.slice(0, 1)}
              </div>
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold text-gray-900">{company.name}</h1>
                  {scaleInfo ? (
                    <span className={`rounded border px-2 py-0.5 text-xs font-medium ${scaleInfo.color}`}>
                      {scaleInfo.name}
                    </span>
                  ) : null}
                  {company.temperature ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${TEMP_LABELS[company.temperature as Temperature].color}`}
                    >
                      {TEMP_LABELS[company.temperature as Temperature].label}
                    </span>
                  ) : null}
                </div>
                {company.industry ? <p className="text-sm text-gray-500">{company.industry}</p> : null}
                {company.mainBusiness ? <p className="mt-1 text-sm text-gray-600">{company.mainBusiness}</p> : null}
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-xs text-gray-600 hover:underline"
                  >
                    {company.website}
                  </a>
                ) : null}
              </div>
            </div>

            <Link
              href={`/companies/${id}/edit`}
              className="rounded-2xl border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
            >
              编辑
            </Link>
          </div>

          {tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-6 border-t border-gray-100 pt-4">
            <div>
              <p className="mb-1 text-xs text-gray-400">能量值</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-gray-400" style={{ width: `${company.energyScore}%` }} />
                </div>
                <span className="text-xs text-gray-500">{company.energyScore}</span>
              </div>
            </div>

            {company.familiarityLevel ? (
              <div>
                <p className="mb-1 text-xs text-gray-400">熟悉程度</p>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <div
                      key={index}
                      className={`h-4 w-2 rounded-full ${
                        index <= company.familiarityLevel! ? 'bg-gray-400' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {company.founderName || investors.length > 0 || upstreams.length > 0 || downstreams.length > 0 ? (
          <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">资本与生态</h2>
            <div className="space-y-3">
              {company.founderName ? (
                <div className="flex items-start gap-3">
                  <span className="w-20 shrink-0 pt-0.5 text-xs text-gray-400">创始人</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">{company.founderName}</span>
                    {company.founderContactId ? (
                      <Link href={`/contacts/${company.founderContactId}`} className="text-xs text-gray-600 hover:underline">
                        查看人脉
                      </Link>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {investors.length > 0 ? (
                <div className="flex items-start gap-3">
                  <span className="w-20 shrink-0 pt-0.5 text-xs text-gray-400">投资机构</span>
                  <div className="flex flex-wrap gap-1.5">
                    {investors.map((investor) => (
                      <span key={investor} className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700">
                        {investor}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {upstreams.length > 0 ? (
                <div className="flex items-start gap-3">
                  <span className="w-20 shrink-0 pt-0.5 text-xs text-gray-400">上游</span>
                  <div className="flex flex-wrap gap-1.5">
                    {upstreams.map((item) => (
                      <span key={item} className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {downstreams.length > 0 ? (
                <div className="flex items-start gap-3">
                  <span className="w-20 shrink-0 pt-0.5 text-xs text-gray-400">下游</span>
                  <div className="flex flex-wrap gap-1.5">
                    {downstreams.map((item) => (
                      <span
                        key={item}
                          className="rounded border border-[#A04F47]/20 bg-[#A04F47]/8 px-2 py-0.5 text-xs text-[#A04F47]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {company.contacts.length > 0 ? (
          <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">
              关联人脉 <span className="font-normal text-gray-400">({company.contacts.length})</span>
            </h2>
            <div className="space-y-2">
              {company.contacts.map((contact) => {
                const roleInfo = contact.roleArchetype
                  ? ROLE_ARCHETYPE_LABELS[contact.roleArchetype as RoleArchetype]
                  : null

                return (
                  <Link
                    key={contact.id}
                    href={`/contacts/${contact.id}`}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-gray-50"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                      {contact.name.slice(0, 1)}
                    </div>
                    <span className="flex-1 text-sm text-gray-700">{contact.name}</span>
                    {contact.title ? <span className="text-xs text-gray-400">{contact.title}</span> : null}
                    {roleInfo ? (
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${ROLE_STYLE[contact.roleArchetype as RoleArchetype]}`}>
                        {roleInfo.name}
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          </div>
        ) : null}

        {relatedCompanies.length > 0 ? (
          <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">关联企业</h2>
            <div className="space-y-2">
              {relatedCompanies.map((companyItem) => (
                <Link
                  key={companyItem.id}
                  href={`/companies/${companyItem.id}`}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-gray-50"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 text-xs font-bold text-gray-600">
                    {companyItem.name.slice(0, 1)}
                  </div>
                  <span className="flex-1 text-sm text-gray-700">{companyItem.name}</span>
                  {companyItem.industry ? <span className="text-xs text-gray-400">{companyItem.industry}</span> : null}
                  {companyItem.desc ? (
                    <span className="rounded bg-gray-50 px-2 py-0.5 text-xs text-gray-500">{companyItem.desc}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {company.notes ? (
          <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <h2 className="mb-2 text-sm font-semibold text-gray-700">备注</h2>
            <p className="whitespace-pre-wrap text-sm text-gray-600">{company.notes}</p>
          </div>
        ) : null}
      </div>
    </PageShell>
  )
}
