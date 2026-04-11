import OpenAI from 'openai'
import { DecompositionPlan } from './types'

function getAIClient(): OpenAI | null {
  const qwenKey = process.env.QWEN_API_KEY
  if (!qwenKey) return null
  return new OpenAI({
    apiKey: qwenKey,
    baseURL: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  })
}

function buildDecomposePrompt(goal: string): string {
  return `用户的人脉拓展目标是：

"${goal}"

请为此目标设计3种明显不同策略的实现方案（方案A、B、C），每个方案2-3个步骤。
三个方案需有明显差异，例如：快速直达型、迂回铺垫型、借势放大型。

严格输出JSON（不含任何额外文字或markdown）：
{
  "plans": [
    {
      "id": "A",
      "title": "方案名称（4字以内）",
      "summary": "一句话特征总结（≤20字）",
      "steps": [
        { "id": 1, "label": "步骤名（4字以内）", "description": "具体行动（≤30字）" },
        { "id": 2, "label": "步骤名（4字以内）", "description": "具体行动（≤30字）" }
      ],
      "difficulty": "easy",
      "successRate": 75,
      "strategy": "此方案适用场景及核心优势（≤40字）"
    },
    {
      "id": "B",
      "title": "...",
      "summary": "...",
      "steps": [...],
      "difficulty": "medium",
      "successRate": 80,
      "strategy": "..."
    },
    {
      "id": "C",
      "title": "...",
      "summary": "...",
      "steps": [...],
      "difficulty": "hard",
      "successRate": 65,
      "strategy": "..."
    }
  ]
}`
}

export async function decomposeGoal(goal: string): Promise<DecompositionPlan[]> {
  const client = getAIClient()

  if (!client) {
    return generateFallbackPlans(goal)
  }

  try {
    const response = await client.chat.completions.create({
      model: 'qwen3.5-flash',
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: '你是专业的人脉策略顾问。只输出JSON，不含任何额外文字、markdown代码块或其他符号。',
        },
        { role: 'user', content: buildDecomposePrompt(goal) },
      ],
    })

    let text = (response.choices[0].message.content || '')
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(text)
    const plans = (parsed.plans || []) as DecompositionPlan[]
    if (plans.length === 0) throw new Error('empty plans')
    return plans
  } catch (err) {
    console.error('[decompose] AI failed, using fallback:', err)
    return generateFallbackPlans(goal)
  }
}

function generateFallbackPlans(goal: string): DecompositionPlan[] {
  void goal
  return [
    {
      id: 'A',
      title: '直接突破',
      summary: '最短路径直达，高效但需强关系基础',
      steps: [
        { id: 1, label: '锁定核心人', description: '识别与目标最近的高价值联系人' },
        { id: 2, label: '直接接触', description: '通过现有关系建立直接连接，快速推进' },
      ],
      difficulty: 'hard',
      successRate: 62,
      strategy: '适合已有强关系基础、时间紧迫的场景，减少中间环节',
    },
    {
      id: 'B',
      title: '迂回铺垫',
      summary: '先建信任，多步铺垫，成功率更稳',
      steps: [
        { id: 1, label: '建立信任', description: '通过中间人先建立信任基础，降低陌生感' },
        { id: 2, label: '价值展示', description: '展示你的价值和诚意，为对方提供参考点' },
        { id: 3, label: '目标达成', description: '水到渠成地实现最终目标' },
      ],
      difficulty: 'medium',
      successRate: 78,
      strategy: '适合关系基础薄弱、目标门槛较高的场景，步步为营',
    },
    {
      id: 'C',
      title: '借势放大',
      summary: '多线并进，借助多节点形成合力',
      steps: [
        { id: 1, label: '多线布局', description: '同时激活多个不同圈层的联系人' },
        { id: 2, label: '资源聚合', description: '让多方力量形成合力，提升可信度' },
        { id: 3, label: '精准收网', description: '在最佳时机达成目标，最大化成功率' },
      ],
      difficulty: 'medium',
      successRate: 83,
      strategy: '适合目标复杂、需要多方资源背书的场景，全面布局',
    },
  ]
}
