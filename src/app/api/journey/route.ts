import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ journeys: [] })
}

export async function POST() {
  return NextResponse.json({ error: '未实现' }, { status: 501 })
}
