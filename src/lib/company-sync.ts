import { db } from '@/lib/db'

function normalizeCompanyName(name: string): string {
  return name.trim().toLowerCase()
}

export async function syncCompaniesFromContacts(userId: string): Promise<void> {
  if (!userId) return

  const [contacts, existingCompanies] = await Promise.all([
    db.contact.findMany({
      where: { userId, company: { not: null } },
      select: { company: true },
    }),
    db.company.findMany({
      where: { userId },
      select: { id: true, name: true },
    }),
  ])

  const companyNameSet = new Set<string>()
  for (const row of contacts) {
    const name = (row.company ?? '').trim()
    if (name) companyNameSet.add(name)
  }

  const existingMap = new Map<string, { id: string; name: string }>()
  for (const company of existingCompanies) {
    existingMap.set(normalizeCompanyName(company.name), company)
  }

  for (const name of companyNameSet) {
    const key = normalizeCompanyName(name)
    let company = existingMap.get(key)

    if (!company) {
      const created = await db.company.create({
        data: {
          userId,
          name,
          tags: JSON.stringify([]),
          energyScore: 50,
        },
        select: { id: true, name: true },
      })
      company = created
      existingMap.set(key, created)
    }

    await db.contact.updateMany({
      where: {
        userId,
        companyId: null,
        company: { equals: name, mode: 'insensitive' },
      },
      data: {
        companyId: company.id,
        company: company.name,
      },
    })
  }
}
