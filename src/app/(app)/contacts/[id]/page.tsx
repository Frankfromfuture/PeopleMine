export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import PageShell from '@/components/PageShell'
import { getAuthUserId } from '@/lib/session'
import {
  QUICK_FREQUENCY_LABELS,
  QUICK_SCENE_LABELS,
  ROLE_ARCHETYPE_LABELS,
  SPIRIT_ANIMAL_NEW_LABELS,
  TEMPERATURE_LABELS,
} from '@/types'
import type { QuickContext, RoleArchetype, SpiritAnimalNew, Temperature } from '@/types'
import { ARCHETYPE_STYLES } from '@/components/RoleArchetypeTag'

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []
  } catch {
    return []
  }
}

function parseQuickContext(raw: unknown): QuickContext | null {
  if (!raw || typeof raw !== 'object') return null
  const src = raw as Record<string, unknown>
  if (typeof src.scene !== 'string' || typeof src.frequency !== 'string' || typeof src.temperature !== 'string') {
    return null
  }
  return {
    scene: src.scene as QuickContext['scene'],
    frequency: src.frequency as QuickContext['frequency'],
    temperature: src.temperature as QuickContext['temperature'],
  }
}

function parseRelationVector(raw: unknown) {
  if (!raw || typeof raw !== 'object') return null
  return raw as {
    trust: number
    powerDelta: number
    goalAlignment: number
    emotionalVolatility: number
    reciprocity: number
    boundaryStability: number
    confidence: number
  }
}

const ROLE_STYLE: Record<RoleArchetype, string> = ARCHETYPE_STYLES

const TEMP_STYLE: Record<Temperature, string> = {
  HOT: 'bg-gray-100 text-gray-700',
  WARM: 'bg-gray-100 text-gray-700',
  COLD: 'bg-gray-100 text-gray-700',
}

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const userId = await getAuthUserId()

  const contact = await db.contact
    .findFirst({
      where: { id: params.id, userId },
      include: {
        linkedCompany: {
          select: { id: true, name: true },
        },
        relationsA: {
          include: {
            contactB: { select: { id: true, name: true, roleArchetype: true } },
          },
        },
        relationsB: {
          include: {
            contactA: { select: { id: true, name: true, roleArchetype: true } },
          },
        },
      },
    })
    .catch(() => null)

  if (!contact) notFound()

  const tags = parseJsonArray(contact.tags)
  const quickContext = parseQuickContext(contact.quickContext)
  const relationVector = parseRelationVector(contact.relationVector)
  const displayName = contact.fullName ?? contact.name
  const displayCompany = contact.companyName ?? contact.company
  const displayTitle = contact.jobTitle ?? contact.title
  const relatedContacts = [
    ...contact.relationsA.map((relation) => ({
      id: relation.contactB.id,
      name: relation.contactB.name,
      relationRole: relation.contactB.roleArchetype,
      desc: relation.relationDesc,
    })),
    ...contact.relationsB.map((relation) => ({
      id: relation.contactA.id,
      name: relation.contactA.name,
      relationRole: relation.contactA.roleArchetype,
      desc: relation.relationDesc,
    })),
  ]

  return (
    <PageShell
      items={[
        { label: '首页', href: '/dashboard' },
        { label: '人脉资产', href: '/contacts' },
        { label: displayName },
      ]}
      title={displayName}
      summary="查看联系人的关系画像、企业上下文、ARC 快照以及关联人脉。"
      hints={[
        '详情页现在沿用统一题头与自适应工作台容器。',
        '这里适合继续阅读联系人画像，再进入编辑或关联人脉。',
        '内容区会随着可用宽度伸缩，但保持稳定留白。',
      ]}
      contentClassName="items-start"
    >
      <div className="w-full max-w-4xl space-y-6">
        <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-xl border text-2xl font-bold ${ROLE_STYLE[contact.roleArchetype as RoleArchetype]}`}
              >
                {displayName.slice(0, 1)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold text-gray-900">{displayName}</h1>
                  <span
                    className={`rounded border px-2 py-0.5 text-xs font-medium ${ROLE_STYLE[contact.roleArchetype as RoleArchetype]}`}
                  >
                    {ROLE_ARCHETYPE_LABELS[contact.roleArchetype as RoleArchetype]?.name}
                  </span>
                  {contact.temperature ? (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TEMP_STYLE[contact.temperature as Temperature]}`}>
                      {TEMPERATURE_LABELS[contact.temperature as Temperature]}
                    </span>
                  ) : null}
                </div>

                {(displayCompany || displayTitle || contact.jobPosition) && (
                  <p className="mt-1 text-sm text-gray-500">
                    {[contact.jobPosition, displayTitle, displayCompany].filter(Boolean).join(' / ')}
                  </p>
                )}
                {contact.spiritAnimal ? (
                  <p className="mt-1 text-sm text-gray-500">
                    气场动物：{SPIRIT_ANIMAL_NEW_LABELS[contact.spiritAnimal as SpiritAnimalNew]?.name}
                  </p>
                ) : null}
                {contact.archetype ? <p className="mt-1 text-sm text-gray-600">关系原型：{contact.archetype}</p> : null}
              </div>
            </div>

            <Link
              href={`/contacts/${contact.id}/edit`}
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

          <div className="mt-4 grid gap-4 border-t border-gray-100 pt-4 text-sm sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs text-gray-400">信任程度</p>
              <p className="text-gray-700">{contact.trustLevel ? '★'.repeat(contact.trustLevel) : '未设置'}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-400">能量值</p>
              <p className="text-gray-700">{contact.energyScore}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-400">上次联系</p>
              <p className="text-gray-700">
                {contact.lastContactedAt ? new Date(contact.lastContactedAt).toLocaleDateString('zh-CN') : '未记录'}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-400">入库时间</p>
              <p className="text-gray-700">{new Date(contact.createdAt).toLocaleDateString('zh-CN')}</p>
            </div>
          </div>

          {quickContext || relationVector ? (
            <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-700">ARC 关系画像</h3>
              {quickContext ? (
                <div className="grid gap-2 text-xs md:grid-cols-3">
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2">
                    <p className="mb-1 text-gray-400">关系场景</p>
                    <p className="font-medium text-gray-700">{QUICK_SCENE_LABELS[quickContext.scene]}</p>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2">
                    <p className="mb-1 text-gray-400">互动频率</p>
                    <p className="font-medium text-gray-700">{QUICK_FREQUENCY_LABELS[quickContext.frequency]}</p>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2">
                    <p className="mb-1 text-gray-400">快录温度</p>
                    <p className="font-medium text-gray-700">
                      {TEMPERATURE_LABELS[quickContext.temperature as Temperature]}
                    </p>
                  </div>
                </div>
              ) : null}

              {relationVector ? (
                <div className="grid gap-2 text-xs md:grid-cols-3">
                  {[
                    ['信任强度', relationVector.trust],
                    ['目标一致', relationVector.goalAlignment],
                    ['互惠对等', relationVector.reciprocity],
                    ['权力差', relationVector.powerDelta],
                    ['情绪波动', relationVector.emotionalVolatility],
                    ['边界稳定', relationVector.boundaryStability],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2">
                      <p className="mb-1 text-gray-500">{label}</p>
                      <p className="font-semibold text-gray-700">{value}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {contact.wechat || contact.phone || contact.email ? (
          <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">联系方式</h2>
            <div className="space-y-2 text-sm">
              {contact.wechat ? <p><span className="mr-2 text-gray-400">微信</span><span className="text-gray-700">{contact.wechat}</span></p> : null}
              {contact.phone ? <p><span className="mr-2 text-gray-400">电话</span><span className="text-gray-700">{contact.phone}</span></p> : null}
              {contact.email ? <p><span className="mr-2 text-gray-400">邮箱</span><span className="text-gray-700">{contact.email}</span></p> : null}
            </div>
          </div>
        ) : null}

        {contact.linkedCompany ? (
          <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">所属企业</h2>
            <Link
              href={`/companies/${contact.linkedCompany.id}`}
              className="inline-flex items-center gap-2 text-sm text-gray-600 transition hover:text-gray-800"
            >
              <span>{contact.linkedCompany.name}</span>
              <span>→</span>
            </Link>
          </div>
        ) : null}

        {relatedContacts.length > 0 ? (
          <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">关系链接</h2>
            <div className="space-y-2">
              {relatedContacts.map((item) => (
                <Link
                  key={`${contact.id}-${item.id}`}
                  href={`/contacts/${item.id}`}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-gray-50"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                    {item.name.slice(0, 1)}
                  </div>
                  <span className="flex-1 text-sm text-gray-700">{item.name}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${ROLE_STYLE[item.relationRole as RoleArchetype]}`}>
                    {ROLE_ARCHETYPE_LABELS[item.relationRole as RoleArchetype]?.name}
                  </span>
                  {item.desc ? <span className="text-xs text-gray-400">{item.desc}</span> : null}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {contact.notes ? (
          <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <h2 className="mb-2 text-sm font-semibold text-gray-700">备注</h2>
            <p className="whitespace-pre-wrap text-sm text-gray-600">{contact.notes}</p>
          </div>
        ) : null}
      </div>
    </PageShell>
  )
}
