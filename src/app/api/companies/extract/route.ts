import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

// POST /api/companies/extract — AI extract company info from raw text
export async function POST(req: NextRequest) {
  const body: { text: string } = await req.json()
  const { text } = body

  if (!text?.trim()) {
    return NextResponse.json({ error: '请提供公司资料文本' }, { status: 400 })
  }

  const prompt = `你是一个企业信息提取助手。从以下公司资料文本中提取结构化信息。

资料文本：
${text}

请提取以下字段（没有的填 null）：
- name: 公司名称
- mainBusiness: 主营业务（一句话描述）
- industry: 所在行业
- scale: 公司规模（只能是 STARTUP/SME/MID/LARGE/LISTED 之一，STARTUP<50人，SME=50-300人，MID=300-1000人，LARGE=1000+人，LISTED=上市公司）
- website: 官网（如有）
- founderName: 创始人姓名（如有）
- investors: 投资机构列表（数组，如有）
- upstreams: 上游合作方列表（数组，如有）
- downstreams: 下游客户/合作方列表（数组，如有）
- tags: 行业标签关键词（数组，3-6个）

只返回 JSON 对象，不要任何解释文字。`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('AI 未返回有效 JSON')

    const extracted = JSON.parse(jsonMatch[0])
    return NextResponse.json({ extracted })
  } catch (err) {
    console.error('AI extract error:', err)
    return NextResponse.json({ error: 'AI 提取失败，请手动填写' }, { status: 500 })
  }
}
