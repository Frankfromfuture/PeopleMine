export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import NewContactForm from './NewContactForm'
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

export default async function NewContactPage() {
  let userId = ''
  let savedTags: string[] = []
  let companies: Array<{ id: string; name: string }> = []

  try {
    userId = await getAuthUserId()

    if (userId) {
      const [user, companyList] = await Promise.all([
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
      savedTags = parseSavedTagOptions(user?.industry ?? null)
      companies = companyList
    }
  } catch {
    // DB 不可用时降级到默认标签，表单仍可渲染
  }

  const devTags = process.env.NODE_ENV === 'development' ? flattenTags(loadTagConfig()) : []
  const initialTagOptions = Array.from(new Set([...DEFAULT_TAG_OPTIONS, ...devTags, ...savedTags]))

  return (
    <NewContactForm
      initialTagOptions={initialTagOptions}
      initialCompanies={companies}
      tagConfig={process.env.NODE_ENV === 'development' ? loadTagConfig() : null}
    />
  )
}
