import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId()
    const name = new URL(req.url).searchParams.get('name')?.trim()

    if (!name) {
      return NextResponse.json({ contacts: [] })
    }

    const contacts = await db.contact.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: name, mode: 'insensitive' } },
          { fullName: { contains: name, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        fullName: true,
        company: true,
        companyName: true,
        jobTitle: true,
        title: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({ contacts })
  } catch {
    return NextResponse.json({ contacts: [] })
  }
}
