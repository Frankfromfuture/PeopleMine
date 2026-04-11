export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import NewContactForm from './NewContactForm'

export default async function NewContactPage({
  searchParams,
}: {
  searchParams?: { name?: string }
}) {
  let userId = ''
  let allContacts: Array<{ id: string; name: string }> = []

  try {
    userId = await getAuthUserId()

    if (userId) {
      allContacts = await db.contact.findMany({
        where: { userId },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      })
    }
  } catch {
    // DB 不可用时降级，表单仍可渲染
  }

  const prefillName = searchParams?.name?.trim() || undefined

  return (
    <NewContactForm
      allContacts={allContacts}
      initialContact={prefillName ? { fullName: prefillName } : undefined}
    />
  )
}
