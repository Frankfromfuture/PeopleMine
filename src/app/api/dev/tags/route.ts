import { NextRequest, NextResponse } from 'next/server'
import { loadTagConfig, saveTagConfig } from '@/lib/dev/tag-store'

function devOnly() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Dev only' }, { status: 403 })
  }
  return null
}

export async function GET() {
  const guard = devOnly()
  if (guard) return guard
  const config = loadTagConfig()
  return NextResponse.json(config)
}

export async function POST(req: NextRequest) {
  const guard = devOnly()
  if (guard) return guard
  try {
    const body = await req.json()
    saveTagConfig(body)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 })
  }
}
