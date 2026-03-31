import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import NewContactForm from './NewContactForm'

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

export default async function NewContactPage() {
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

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { industry: true },
  })

  const saved = parseSavedTagOptions(user?.industry ?? null)
  const initialTagOptions = Array.from(new Set([...DEFAULT_TAG_OPTIONS, ...saved]))

  return <NewContactForm initialTagOptions={initialTagOptions} />
}
