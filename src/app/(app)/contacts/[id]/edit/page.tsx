import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import NewContactForm from '../../new/NewContactForm'
import { loadTagConfig, flattenTags } from '@/lib/dev/tag-store'

const DEFAULT_TAG_OPTIONS = ['AI', '互联网', '投资', '产品', '设计', '运营', '教育', '医疗']

function parseSavedTagOptions(raw: string | null) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.filter((v) => typeof v === 'string')
    return []
  } catch {
    return []
  }
}

export default async function EditContactPage({ params }: { params: { id: string } }) {
  const userId = await getAuthUserId()

  const [contact, user, companies] = await Promise.all([
    db.contact.findFirst({
      where: { id: params.id, userId },
      include: {
        linkedCompany: {
          select: { id: true, name: true },
        },
      },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { industry: true },
    }),
    db.company.findMany({
      where: { userId },
      select: { id: true, name: true },
      orderBy: { updatedAt: 'desc' },
    }),
  ])
  if (!contact) notFound()

  const saved = parseSavedTagOptions(user?.industry ?? null)
  const contactTags = parseSavedTagOptions(contact.tags)
  const devTags = process.env.NODE_ENV === 'development' ? flattenTags(loadTagConfig()) : []
  const initialTagOptions = Array.from(new Set([...DEFAULT_TAG_OPTIONS, ...devTags, ...saved, ...contactTags]))

  return (
    <NewContactForm
      mode="edit"
      initialTagOptions={initialTagOptions}
      initialCompanies={companies}
      tagConfig={process.env.NODE_ENV === 'development' ? loadTagConfig() : null}
      initialContact={{
        id: contact.id,
        name: contact.name,
        company: contact.company,
        companyId: contact.linkedCompany?.id ?? contact.companyId ?? null,
        title: contact.title,
        jobPosition: contact.jobPosition,
        trustLevel: contact.trustLevel,
        tags: contactTags,
        spiritAnimal: contact.spiritAnimal,
        relationRole: contact.relationRole,
        temperature: contact.temperature,
        wechat: contact.wechat,
        phone: contact.phone,
        email: contact.email,
        notes: contact.notes,
      }}
    />
  )
}
