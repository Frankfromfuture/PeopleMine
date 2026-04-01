import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import NewContactForm from '../../new/NewContactForm'

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
  let userId: string
  try {
    ;({ userId } = await requireAuth())
  } catch {
    const devUser = await db.user.upsert({
      where: { phone: '13800138000' },
      update: { name: 'Demo 用户' },
      create: { phone: '13800138000', name: 'Demo 用户' },
    })
    userId = devUser.id
  }

  const [contact, user] = await Promise.all([
    db.contact.findFirst({
      where: { id: params.id, userId },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { industry: true },
    }),
  ])
  if (!contact) notFound()

  const saved = parseSavedTagOptions(user?.industry ?? null)
  const contactTags = parseSavedTagOptions(contact.tags)
  const initialTagOptions = Array.from(new Set([...DEFAULT_TAG_OPTIONS, ...saved, ...contactTags]))

  return (
    <NewContactForm
      mode="edit"
      initialTagOptions={initialTagOptions}
      initialContact={{
        id: contact.id,
        name: contact.name,
        company: contact.company,
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
