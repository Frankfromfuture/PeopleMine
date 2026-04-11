import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'



export async function GET() {
  const userId = await getAuthUserId()
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      goal: true,
      selfTags: true,
      selfCompany: true,
      selfTitle: true,
      selfJobPosition: true,
      selfSpiritAnimal: true,
      selfBio: true,
    },
  })
  return NextResponse.json({ user: user ?? {} })
}

export async function PATCH(req: NextRequest) {
  const userId = await getAuthUserId()
  const body = await req.json()

  const user = await db.user.update({
    where: { id: userId },
    data: {
      name: body.name ?? undefined,
      goal: body.goal ?? undefined,
      selfTags: body.selfTags != null ? JSON.stringify(body.selfTags) : undefined,
      selfCompany: body.selfCompany ?? undefined,
      selfTitle: body.selfTitle ?? undefined,
      selfJobPosition: body.selfJobPosition ?? undefined,
      selfSpiritAnimal: body.selfSpiritAnimal ?? undefined,
      selfBio: body.selfBio ?? undefined,
    },
    select: {
      name: true,
      goal: true,
      selfTags: true,
      selfCompany: true,
      selfTitle: true,
      selfJobPosition: true,
      selfSpiritAnimal: true,
      selfBio: true,
    },
  })
  return NextResponse.json({ user })
}
