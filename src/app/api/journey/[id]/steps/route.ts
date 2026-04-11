import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { JourneyPathData, StepStatus, StepExecutionStatus } from '@/lib/journey/types'
import { InteractionType } from '@/types'

export const dynamic = 'force-dynamic'

async function resolveUserId(): Promise<string> {
  try {
    const { userId } = await requireAuth()
    return userId
  } catch {
    if (process.env.NODE_ENV !== 'development') throw new Error('UNAUTHORIZED')
    const c = await db.contact.findFirst({ select: { userId: true }, orderBy: { createdAt: 'desc' } })
    if (c) return c.userId
    const u = await db.user.findFirst({ select: { id: true } })
    if (u) return u.id
    throw new Error('No user found')
  }
}

const VALID_STATUSES: StepExecutionStatus[] = ['pending', 'in_progress', 'done', 'skipped', 'failed']
const VALID_INTERACTION_TYPES: InteractionType[] = ['MEETING', 'CALL', 'EMAIL', 'MESSAGE', 'EVENT', 'OTHER']

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await resolveUserId()
    const { id } = await params

    const body = await req.json() as {
      contactId: string
      status: StepExecutionStatus
      note?: string | null
      interactionType?: InteractionType | null
    }

    const { contactId, status, note = null, interactionType = null } = body

    if (!contactId || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 })
    }
    if (interactionType && !VALID_INTERACTION_TYPES.includes(interactionType)) {
      return NextResponse.json({ error: '互动类型无效' }, { status: 400 })
    }

    // Ownership check
    const journey = await db.journey.findFirst({
      where: { id, userId },
      select: { id: true, pathData: true },
    })
    if (!journey) {
      return NextResponse.json({ error: '未找到' }, { status: 404 })
    }

    // Update stepStatuses inside pathData
    const pathData = journey.pathData as unknown as JourneyPathData
    const existing = pathData.stepStatuses ?? []
    const idx = existing.findIndex((s) => s.contactId === contactId)
    const newStatus: StepStatus = {
      contactId,
      status,
      note: note ?? null,
      updatedAt: new Date().toISOString(),
      interactionType: interactionType ?? null,
    }

    const stepStatuses =
      idx >= 0
        ? existing.map((s, i) => (i === idx ? newStatus : s))
        : [...existing, newStatus]

    const updatedPathData = { ...pathData, stepStatuses }

    // Write to DB
    await db.journey.update({
      where: { id },
      data: { pathData: updatedPathData as never },
    })

    // Side effects when marking done
    if (status === 'done') {
      // Log interaction
      if (interactionType) {
        await db.interaction.create({
          data: {
            contactId,
            type: interactionType,
            content: note || '完成航程步骤',
            date: new Date(),
          },
        })
      }
      // Update lastContactedAt
      await db.contact.update({
        where: { id: contactId },
        data: { lastContactedAt: new Date() },
      })
    }

    return NextResponse.json({ stepStatuses })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
