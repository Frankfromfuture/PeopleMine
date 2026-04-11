import { NextRequest, NextResponse } from 'next/server'
import { loadRelationStrengthConfig, saveRelationStrengthConfig } from '@/lib/dev/relation-strength-persistence'

export async function GET() {
  const config = loadRelationStrengthConfig()
  return NextResponse.json({ config })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    saveRelationStrengthConfig(body)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 })
  }
}
