export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import CompanyForm from '../../new/CompanyForm'

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const userId = await getAuthUserId()

  const [company, contacts] = await Promise.all([
    db.company.findFirst({ where: { id, userId } }).catch(() => null),
    db.contact.findMany({ where: { userId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }).catch(() => []),
  ])

  if (!company) notFound()

  const initial = {
    id: company.id,
    name: company.name,
    mainBusiness: company.mainBusiness,
    website: company.website,
    scale: company.scale,
    industry: company.industry,
    tags: parseJsonArray(company.tags),
    founderName: company.founderName,
    founderContactId: company.founderContactId,
    investors: parseJsonArray(company.investors),
    upstreams: parseJsonArray(company.upstreams),
    downstreams: parseJsonArray(company.downstreams),
    familiarityLevel: company.familiarityLevel,
    temperature: company.temperature,
    energyScore: company.energyScore,
    notes: company.notes,
  }

  return <CompanyForm initialCompany={initial} contacts={contacts} mode="edit" />
}
