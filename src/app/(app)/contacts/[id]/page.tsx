export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
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
 return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : []
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

 const contact = await db.contact.findFirst({
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
 }).catch(() => null)

 if (!contact) notFound()

 const tags = parseJsonArray(contact.tags)
 const quickContext = parseQuickContext(contact.quickContext)
 const relationVector = parseRelationVector(contact.relationVector)
 const displayName = contact.fullName ?? contact.name
 const displayCompany = contact.companyName ?? contact.company
 const displayTitle = contact.jobTitle ?? contact.title
 const relatedContacts = [
 ...contact.relationsA.map((r) => ({ id: r.contactB.id, name: r.contactB.name, relationRole: r.contactB.roleArchetype, desc: r.relationDesc })),
 ...contact.relationsB.map((r) => ({ id: r.contactA.id, name: r.contactA.name, relationRole: r.contactA.roleArchetype, desc: r.relationDesc })),
 ]

 return (
 <div className="min-h-full px-8 py-7">
 <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
 <Link href="/dashboard" className="hover:text-gray-600 transition-colors">首页</Link>
 <span>/</span>
 <Link href="/contacts" className="hover:text-gray-600 transition-colors">人脉数据库</Link>
 <span>/</span>
 <span className="text-gray-700 font-medium">{displayName}</span>
 </div>

 <div className="max-w-3xl space-y-6">
 <div className="bg-white rounded-xl border border-gray-200 p-6">
 <div className="flex items-start justify-between gap-4">
 <div className="flex items-start gap-4">
 <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold border ${ROLE_STYLE[contact.roleArchetype as RoleArchetype]}`}>
 {(displayName).slice(0,1)}
 </div>
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <h1 className="text-xl font-semibold text-gray-900">{displayName}</h1>
 <span className={`px-2 py-0.5 text-xs rounded border font-medium ${ROLE_STYLE[contact.roleArchetype as RoleArchetype]}`}>
 {ROLE_ARCHETYPE_LABELS[contact.roleArchetype as RoleArchetype]?.name}
 </span>
 {contact.temperature && (
 <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${TEMP_STYLE[contact.temperature as Temperature]}`}>
 {TEMPERATURE_LABELS[contact.temperature as Temperature]}
 </span>
 )}
 </div>
 {(displayCompany || displayTitle || contact.jobPosition) && (
 <p className="text-sm text-gray-500 mt-1">{[contact.jobPosition, displayTitle, displayCompany].filter(Boolean).join(' · ')}</p>
 )}
 {contact.spiritAnimal && (
 <p className="text-sm text-gray-500 mt-1">气场动物：{SPIRIT_ANIMAL_NEW_LABELS[contact.spiritAnimal as SpiritAnimalNew]?.name}</p>
 )}
 {contact.archetype && (
 <p className="text-sm text-gray-600 mt-1">关系原型：{contact.archetype}</p>
 )}
 </div>
 </div>
 <Link
 href={`/contacts/${contact.id}/edit`}
 className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
 >
 编辑
 </Link>
 </div>

 {tags.length >0 && (
 <div className="flex flex-wrap gap-1.5 mt-4">
 {tags.map((tag) => (
 <span key={tag} className="px-2.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{tag}</span>
 ))}
 </div>
 )}

 <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 text-sm">
 <div>
 <p className="text-xs text-gray-400 mb-1">信任度</p>
 <p className="text-gray-700">{contact.trustLevel ? `★`.repeat(contact.trustLevel) : '未设置'}</p>
 </div>
 <div>
 <p className="text-xs text-gray-400 mb-1">能量值</p>
 <p className="text-gray-700">{contact.energyScore}</p>
 </div>
 <div>
 <p className="text-xs text-gray-400 mb-1">上次联系</p>
 <p className="text-gray-700">{contact.lastContactedAt ? new Date(contact.lastContactedAt).toLocaleDateString('zh-CN') : '未记录'}</p>
 </div>
 <div>
 <p className="text-xs text-gray-400 mb-1">入库时间</p>
 <p className="text-gray-700">{new Date(contact.createdAt).toLocaleDateString('zh-CN')}</p>
 </div>
 </div>

 {(quickContext || relationVector) && (
 <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
 <h3 className="text-sm font-semibold text-gray-700">ARC 关系画像</h3>
 {quickContext && (
 <div className="grid grid-cols-3 gap-2 text-xs">
 <div className="px-2.5 py-2 rounded-lg bg-gray-50 border border-gray-100">
 <p className="text-gray-400 mb-1">关系场景</p>
 <p className="text-gray-700 font-medium">{QUICK_SCENE_LABELS[quickContext.scene]}</p>
 </div>
 <div className="px-2.5 py-2 rounded-lg bg-gray-50 border border-gray-100">
 <p className="text-gray-400 mb-1">互动频率</p>
 <p className="text-gray-700 font-medium">{QUICK_FREQUENCY_LABELS[quickContext.frequency]}</p>
 </div>
 <div className="px-2.5 py-2 rounded-lg bg-gray-50 border border-gray-100">
 <p className="text-gray-400 mb-1">快录温度</p>
 <p className="text-gray-700 font-medium">{TEMPERATURE_LABELS[quickContext.temperature as Temperature]}</p>
 </div>
 </div>
 )}
 {relationVector && (
 <div className="grid grid-cols-3 gap-2 text-xs">
 <div className="px-2.5 py-2 rounded-lg bg-gray-50 border border-gray-100">
 <p className="text-gray-500 mb-1">信任强度</p>
 <p className="text-gray-700 font-semibold">{relationVector.trust}</p>
 </div>
 <div className="px-2.5 py-2 rounded-lg bg-gray-50 border border-gray-100">
 <p className="text-gray-500 mb-1">目标一致</p>
 <p className="text-gray-700 font-semibold">{relationVector.goalAlignment}</p>
 </div>
 <div className="px-2.5 py-2 rounded-lg bg-gray-50 border border-gray-100">
 <p className="text-gray-500 mb-1">互惠对等</p>
 <p className="text-gray-700 font-semibold">{relationVector.reciprocity}</p>
 </div>
 <div className="px-2.5 py-2 rounded-lg bg-gray-50 border border-gray-100">
 <p className="text-gray-500 mb-1">权力差</p>
 <p className="text-gray-700 font-semibold">{relationVector.powerDelta}</p>
 </div>
 <div className="px-2.5 py-2 rounded-lg bg-gray-50 border border-gray-100">
 <p className="text-gray-500 mb-1">情绪波动</p>
 <p className="text-gray-700 font-semibold">{relationVector.emotionalVolatility}</p>
 </div>
 <div className="px-2.5 py-2 rounded-lg bg-gray-50 border border-gray-100">
 <p className="text-gray-500 mb-1">边界稳定</p>
 <p className="text-gray-700 font-semibold">{relationVector.boundaryStability}</p>
 </div>
 </div>
 )}
 </div>
 )}
 </div>

 {(contact.wechat || contact.phone || contact.email) && (
 <div className="bg-white rounded-xl border border-gray-200 p-6">
 <h2 className="text-sm font-semibold text-gray-700 mb-4">联系方式</h2>
 <div className="space-y-2 text-sm">
 {contact.wechat && <p><span className="text-gray-400 mr-2">微信</span><span className="text-gray-700">{contact.wechat}</span></p>}
 {contact.phone && <p><span className="text-gray-400 mr-2">电话</span><span className="text-gray-700">{contact.phone}</span></p>}
 {contact.email && <p><span className="text-gray-400 mr-2">邮箱</span><span className="text-gray-700">{contact.email}</span></p>}
 </div>
 </div>
 )}

 {contact.linkedCompany && (
 <div className="bg-white rounded-xl border border-gray-200 p-6">
 <h2 className="text-sm font-semibold text-gray-700 mb-3">所属企业</h2>
 <Link href={`/companies/${contact.linkedCompany.id}`} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-700">
 <span>{contact.linkedCompany.name}</span>
 <span>→</span>
 </Link>
 </div>
 )}

 {relatedContacts.length >0 && (
 <div className="bg-white rounded-xl border border-gray-200 p-6">
 <h2 className="text-sm font-semibold text-gray-700 mb-4">关系链接</h2>
 <div className="space-y-2">
 {relatedContacts.map((item) => (
 <Link
 key={`${contact.id}-${item.id}`}
 href={`/contacts/${item.id}`}
 className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
 >
 <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
 {item.name.slice(0,1)}
 </div>
 <span className="text-sm text-gray-700 flex-1">{item.name}</span>
 <span className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${ROLE_STYLE[item.relationRole as RoleArchetype]}`}>
 {ROLE_ARCHETYPE_LABELS[item.relationRole as RoleArchetype]?.name}
 </span>
 {item.desc && <span className="text-xs text-gray-400">{item.desc}</span>}
 </Link>
 ))}
 </div>
 </div>
 )}

 {contact.notes && (
 <div className="bg-white rounded-xl border border-gray-200 p-6">
 <h2 className="text-sm font-semibold text-gray-700 mb-2">备注</h2>
 <p className="text-sm text-gray-600 whitespace-pre-wrap">{contact.notes}</p>
 </div>
 )}
 </div>
 </div>
 )
}
