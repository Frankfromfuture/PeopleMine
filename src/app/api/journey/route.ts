import { NextResponse, NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import {
  scoreAllContacts,
  selectTopContacts,
} from '@/lib/journey/scoring'
import {
  buildCandidatePaths,
} from '@/lib/journey/pathfinding'
import { analyzeJourneyWithClaude } from '@/lib/journey/prompt'
import { JourneyAnalysisResponse } from '@/lib/journey/types'

/**
 * GET /api/journey
 * 返回用户的历史航程分析
 */
export async function GET(request: NextRequest) {
  try {
    let userId: string

    try {
      const { userId: authUserId } = await requireAuth()
      userId = authUserId
    } catch {
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
          { error: '未登录' },
          { status: 401 },
        )
      }
      // 开发模式：使用固定的 demo 用户 ID
      userId = 'dev-user'
    }

    // 查询历史
    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get('limit') || '10'),
      50,
    )
    const offset = Math.max(
      parseInt(request.nextUrl.searchParams.get('offset') || '0'),
      0,
    )

    const journeys = await db.journey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    return NextResponse.json({
      journeys: journeys.map((j) => ({
        id: j.id,
        goal: j.goal,
        aiAnalysis: j.aiAnalysis,
        pathData: j.pathData,
        createdAt: j.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('GET /api/journey 错误:', error)
    return NextResponse.json(
      { error: '获取历史失败' },
      { status: 500 },
    )
  }
}

/**
 * POST /api/journey
 * 创建新的航程分析
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { goal } = body

    if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
      return NextResponse.json(
        { error: '目标不能为空' },
        { status: 400 },
      )
    }

    // 认证
    let userId: string
    try {
      const { userId: authUserId } = await requireAuth()
      userId = authUserId
    } catch {
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
          { error: '未登录' },
          { status: 401 },
        )
      }
      // 开发模式：使用固定的 demo 用户 ID
      userId = 'dev-user'
    }

    // 1. 加载用户的所有联系人和关系
    const contacts = await db.contact.findMany({
      where: { userId },
    })

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: '请先添加联系人后再进行航程分析', code: 'NO_CONTACTS' },
        { status: 400 },
      )
    }

    const relations = await db.contactRelation.findMany({
      where: {
        OR: [
          { contactIdA: { in: contacts.map((c) => c.id) } },
          { contactIdB: { in: contacts.map((c) => c.id) } },
        ],
      },
    })

    // 2. 计算多维评分
    const scoredContacts = scoreAllContacts(contacts, relations, goal)

    // 3. 选择 Top-15 联系人用于 Claude 分析
    const topContacts = selectTopContacts(scoredContacts, 15)

    // 4. 构建候选路径
    const candidatePaths = buildCandidatePaths(topContacts, relations)

    if (candidatePaths.length === 0) {
      return NextResponse.json(
        { error: '无法分析路径，请检查人脉数据' },
        { status: 400 },
      )
    }

    // 5. 检查 Claude API 是否配置
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI 服务未配置' },
        { status: 503 },
      )
    }

    // 6. 调用 Claude 进行深度分析
    let pathData
    try {
      pathData = await analyzeJourneyWithClaude(
        goal,
        topContacts,
        relations,
        candidatePaths,
      )
    } catch (claudeError) {
      console.error('Claude 分析失败:', claudeError)
      return NextResponse.json(
        { error: 'AI 分析失败: ' + String(claudeError) },
        { status: 503 },
      )
    }

    // 7. 保存到数据库
    const journey = await db.journey.create({
      data: {
        userId,
        goal,
        aiAnalysis: pathData.overallStrategy,
        pathData: JSON.parse(JSON.stringify(pathData)),
      },
    })

    // 8. 返回结果
    const response: JourneyAnalysisResponse = {
      journey: {
        id: journey.id,
        goal: journey.goal,
        aiAnalysis: journey.aiAnalysis,
        pathData: pathData,
        createdAt: journey.createdAt.toISOString(),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('POST /api/journey 错误:', error)
    return NextResponse.json(
      { error: '分析失败: ' + String(error) },
      { status: 500 },
    )
  }
}
