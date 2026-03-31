import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await requireAuth()
    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role')
    const animal = searchParams.get('animal')

    const contacts = await db.contact.findMany({
      where: {
        userId,
        ...(role ? { relationRole: role as never } : {}),
        ...(animal ? { spiritAnimal: animal as never } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ contacts })
  } catch {
    return NextResponse.json({ contacts: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth()
    const body = await req.json()

    const contact = await db.contact.create({
      data: {
        userId,
        name: body.name,
        relationRole: body.relationRole,
        tags: body.tags ?? [],
        spiritAnimal: body.spiritAnimal ?? null,
        company: body.company ?? null,
        title: body.title ?? null,
        phone: body.phone ?? null,
        wechat: body.wechat ?? null,
        email: body.email ?? null,
        industry: body.industry ?? null,
        notes: body.notes ?? null,
        energyScore: 50,
      },
    })

    return NextResponse.json({ contact }, { status: 201 })
  } catch (err) {
    console.error('[contacts POST]', err)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
