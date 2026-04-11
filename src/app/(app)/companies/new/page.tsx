export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import CompanyForm from './CompanyForm'

export default async function NewCompanyPage() {
  let userId = ''
  let contacts: { id: string; name: string }[] = []

  try {
    userId = await getAuthUserId()

    if (userId) {
      contacts = await db.contact.findMany({
        where: { userId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }).catch(() => [])
    }
  } catch {
    // DB 不可用时降级，表单仍可渲染
  }

  return <CompanyForm contacts={contacts} />
}
