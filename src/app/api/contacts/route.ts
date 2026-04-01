import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'

function normalizeTagLibrary(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  return Array.from(
    new Set(
      input
        .map((v) => (typeof v === 'string' ? v.trim() : ''))
        .filter(Boolean),
    ),
  )
}

function parseJsonArray(raw: FormDataEntryValue | null): unknown[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(String(raw))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function parseManualTags(raw: unknown): string[] {
  if (typeof raw !== 'string') return []
  return Array.from(
    new Set(
      raw
        .split(/[,\uff0c\u3001;\n]/)
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  )
}

async function getRequestUserId() {
  try {
    const { userId } = await requireAuth()
    return userId
  } catch {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('未登录')
    }
    // 开发模式：使用固定的 demo 用户 ID
    return 'dev-user'
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getRequestUserId()
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
    const userId = await getRequestUserId()
    const contentType = req.headers.get('content-type') ?? ''
    const isJson = contentType.includes('application/json')
    const body = isJson
      ? await req.json()
      : await req.formData().then((fd) => ({
          name: String(fd.get('name') ?? ''),
          relationRole: String(fd.get('relationRole') ?? ''),
          tags: fd.getAll('tags').map((v) => String(v)),
          spiritAnimal: fd.get('spiritAnimal') ? String(fd.get('spiritAnimal')) : null,
          company: fd.get('company') ? String(fd.get('company')) : null,
          title: fd.get('title') ? String(fd.get('title')) : null,
          jobPosition: fd.get('jobPosition') ? String(fd.get('jobPosition')) : null,
          phone: fd.get('phone') ? String(fd.get('phone')) : null,
          wechat: fd.get('wechat') ? String(fd.get('wechat')) : null,
          email: fd.get('email') ? String(fd.get('email')) : null,
          notes: fd.get('notes') ? String(fd.get('notes')) : null,
          trustLevel: fd.get('trustLevel') ? Number(fd.get('trustLevel')) : null,
          temperature: fd.get('temperature') ? String(fd.get('temperature')) : null,
          tagLibrary: parseJsonArray(fd.get('tagLibrary')),
          manualTags: fd.get('manualTags') ? String(fd.get('manualTags')) : '',
        }))

    console.log('[contacts POST] received body:', JSON.stringify(body))
    console.log('[contacts POST] userId:', userId)

    if (!body.name || !body.relationRole) {
      return NextResponse.json({ error: '请填写姓名并选择关系角色' }, { status: 400 })
    }

    const manualTags = parseManualTags(body.manualTags)
    const mergedTags = Array.from(
      new Set([...(Array.isArray(body.tags) ? body.tags : []), ...manualTags]),
    )

    // 确保用户存在
    try {
      await db.user.create({
        data: {
          id: userId,
          phone: userId === 'dev-user' ? '13800138000' : userId,
          name: userId === 'dev-user' ? 'Demo 用户' : undefined,
        },
      })
    } catch {
      // 用户已存在，忽略
    }

    const contact = await db.contact.create({
      data: {
        userId,
        name: body.name,
        relationRole: body.relationRole,
        tags: mergedTags.length > 0 ? JSON.stringify(mergedTags) : null,
        spiritAnimal: body.spiritAnimal ?? null,
        company: body.company ?? null,
        title: body.title ?? null,
        jobPosition: body.jobPosition ?? null,
        phone: body.phone ?? null,
        wechat: body.wechat ?? null,
        email: body.email ?? null,
        industry: body.industry ?? null,
        notes: body.notes ?? null,
        energyScore: 50,
      },
    })

    const tagLibrary = normalizeTagLibrary([...(Array.isArray(body.tagLibrary) ? body.tagLibrary : []), ...manualTags])
    if (tagLibrary.length > 0) {
      await db.user.update({
        where: { id: userId },
        data: { industry: JSON.stringify(tagLibrary) },
      })
    }

    if (!isJson) {
      return NextResponse.redirect(new URL('/contacts', req.url), { status: 303 })
    }
    return NextResponse.json({ contact }, { status: 201 })
  } catch (err) {
    console.error('[contacts POST]', err)
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
