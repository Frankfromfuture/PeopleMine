import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'
import NewContactForm from '../../new/NewContactForm'

export default async function EditContactPage({ params }: { params: { id: string } }) {
  const userId = await getAuthUserId()

  const [contact, allContacts] = await Promise.all([
    db.contact.findFirst({
      where: { id: params.id, userId },
    }),
    db.contact.findMany({
      where: { userId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])
  if (!contact) notFound()

  return (
    <NewContactForm
      mode="edit"
      allContacts={allContacts}
      initialContact={{
        id: contact.id,
        name: contact.name,
        fullName: contact.fullName,
        gender: contact.gender as never,
        age: contact.age,
        firstMetYear: contact.firstMetYear,
        personalRelation: contact.personalRelation as never,
        reciprocityLevel: contact.reciprocityLevel,
        friendLinks: contact.friendLinks,
        companyName: contact.companyName,
        company: contact.company,
        companyProfile: contact.companyProfile,
        companyScale: contact.companyScale as never,
        industry: contact.industry,
        industryL1: contact.industryL1,
        industryL2: contact.industryL2,
        title: contact.title,
        jobTitle: contact.jobTitle,
        jobPosition: contact.jobPosition as never,
        jobFunction: contact.jobFunction as never,
        influence: contact.influence as never,
        networkingNeeds: contact.networkingNeeds as never,
        spiritAnimal: contact.spiritAnimal as never,
        roleArchetype: contact.roleArchetype as never,
        chemistryScore: contact.chemistryScore,
        valueScore: contact.valueScore as never,
        potentialProjects: contact.potentialProjects,
        socialPosition: contact.socialPosition,
        hobbies: contact.hobbies,
        personalNotes: contact.personalNotes,
        notes: contact.notes,
        wechat: contact.wechat,
        phone: contact.phone,
        email: contact.email,
        companyAddress: contact.companyAddress,
        personalAddress: contact.personalAddress,
      }}
    />
  )
}
