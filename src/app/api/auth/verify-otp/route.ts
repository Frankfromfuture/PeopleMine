import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json()

    if (!phone || !code) {
      return NextResponse.json({ error: '缺少手机号或验证码' }, { status: 400 })
    }

    const otp = await db.phoneOtp.findFirst({
      where: {
        phone,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otp) {
      return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 })
    }

    // Remove older OTP rows for this phone so the table stays clean.
    await db.phoneOtp.deleteMany({ where: { phone } })

    const now = new Date()
    const user = await db.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    })
    const isNew = now.getTime() - user.createdAt.getTime() < 5000

    const session = await getSession()
    session.userId = user.id
    session.phone = user.phone
    await session.save()

    return NextResponse.json({ success: true, isNew })
  } catch (err) {
    console.error('[verify-otp]', err)
    return NextResponse.json({ error: '验证失败，请稍后重试' }, { status: 500 })
  }
}
