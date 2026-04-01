import { NextRequest, NextResponse } from 'next/server'
import { loadFormulaConfig, computeScores, FormulaConfig } from '@/lib/dev/formula-store'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Dev only' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const goal: string = body.goal ?? ''
    const formulaConfig: FormulaConfig = body.formulaConfig ?? loadFormulaConfig()

    // Load dev user contacts
    const devUser = await db.user.findUnique({ where: { phone: '13800138000' } })
    if (!devUser) return NextResponse.json({ error: 'No dev user found — generate test data first' }, { status: 404 })

    const contacts = await db.contact.findMany({ where: { userId: devUser.id } })
    const relations = await db.contactRelation.findMany({
      where: {
        OR: [
          { contactA: { userId: devUser.id } },
          { contactB: { userId: devUser.id } },
        ],
      },
    })

    const contactInputs = contacts.map((c) => {
      let tags: string[] = []
      try { tags = JSON.parse(c.tags ?? '[]') } catch { tags = [] }
      return {
        id: c.id,
        name: c.name,
        relationRole: c.relationRole,
        energyScore: c.energyScore,
        trustLevel: c.trustLevel,
        temperature: c.temperature,
        lastContactedAt: c.lastContactedAt,
        tags,
        company: c.company,
        title: c.title,
      }
    })

    const results = computeScores(contactInputs, relations, goal, formulaConfig)

    return NextResponse.json({ goal, results, total: results.length })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
