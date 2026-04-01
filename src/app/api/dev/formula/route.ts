import { NextRequest, NextResponse } from 'next/server'
import { loadFormulaConfig, saveFormulaConfig } from '@/lib/dev/formula-store'

function devOnly() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Dev only' }, { status: 403 })
  }
  return null
}

export async function GET() {
  const guard = devOnly()
  if (guard) return guard
  const config = loadFormulaConfig()
  return NextResponse.json(config)
}

export async function POST(req: NextRequest) {
  const guard = devOnly()
  if (guard) return guard
  try {
    const body = await req.json()
    saveFormulaConfig(body)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 })
  }
}
