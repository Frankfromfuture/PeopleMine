import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendOtp, generateOtp } from '@/lib/sms'
import { PHONE_REGEX, OTP_EXPIRE_MINUTES, OTP_RATE_LIMIT_SECONDS } from '@/lib/constants'

const IS_DEV = process.env.NODE_ENV !== 'production'

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()

    if (!phone || !PHONE_REGEX.test(phone)) {
      return NextResponse.json({ error: '手机号格式不正确' }, { status: 400 })
    }

    // All environments share the same rate limit to avoid unlimited OTP growth.
    const recentOtp = await db.phoneOtp.findFirst({
      where: {
        phone,
        createdAt: { gt: new Date(Date.now() - OTP_RATE_LIMIT_SECONDS * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (recentOtp) {
      const waitSeconds =
        OTP_RATE_LIMIT_SECONDS - Math.floor((Date.now() - recentOtp.createdAt.getTime()) / 1000)
      return NextResponse.json({ error: `请等待 ${waitSeconds} 秒后重试` }, { status: 429 })
    }

    const expiresAt = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000)
    const code = IS_DEV ? '000000' : generateOtp()

    await db.phoneOtp.create({ data: { phone, code, expiresAt } })

    if (!IS_DEV) {
      await sendOtp(phone, code)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[send-otp]', err)
    return NextResponse.json({ error: '发送失败，请稍后重试' }, { status: 500 })
  }
}
