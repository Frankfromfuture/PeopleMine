import { NextResponse, NextRequest } from 'next/server'
import { decomposeGoal } from '@/lib/journey/decompose'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { goal } = body

    if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
      return NextResponse.json({ error: '目标不能为空' }, { status: 400 })
    }

    const plans = await decomposeGoal(goal.trim())
    return NextResponse.json({ plans })
  } catch (error) {
    console.error('POST /api/journey/decompose 错误:', error)
    return NextResponse.json({ error: '目标拆解失败' }, { status: 500 })
  }
}
