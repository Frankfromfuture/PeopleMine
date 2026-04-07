import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUserId } from '@/lib/session'

function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getAuthUserId()
    const body = await req.json()
    const level = Number(body.level)

    if (!level || level < 1 || level > 5) {
      return NextResponse.json({ error: '升温等级必须为 1-5' }, { status: 400 })
    }

    const existing = await db.contact.findFirst({
      where: { id: params.id, userId },
    })
    if (!existing) {
      return NextResponse.json({ error: '联系人不存在' }, { status: 404 })
    }

    const today = formatDate(new Date())
    const fires = '🔥'.repeat(level)

    // Accumulate: append new entries to existing tags (never overwrite)
    const currentTags = parseTags(existing.tags)
    const newTags = [
      ...currentTags,
      `关系升温${fires} ${today}`,
      `近期关系维护时间:${today}`,
    ]

    const contact = await db.contact.update({
      where: { id: params.id },
      data: {
        tags: JSON.stringify(newTags),
        lastContactedAt: new Date(),
      },
    })

    return NextResponse.json({ contact })
  } catch (err) {
    console.error('[warm-up POST]', err)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
