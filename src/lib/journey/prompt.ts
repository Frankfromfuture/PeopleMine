import OpenAI from 'openai'
import {
  ScoredContact,
  CandidatePath,
  JourneyPathData,
  PathStep,
  AlternativePath,
  MissingNode,
} from './types'
import { RelationRole } from '@/types'
import { ContactRelation } from '@prisma/client'

// 支持 Kimi API（兼容 OpenAI 格式）
const client = new OpenAI({
  apiKey: process.env.KIMI_API_KEY || process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.KIMI_API_KEY ? 'https://api.moonshot.cn/openai/v1' : undefined,
})

/**
 * 将联系人数据格式化为 Claude 可读的 JSON
 */
function formatContactsForPrompt(
  contacts: ScoredContact[],
): Record<string, string | number | string[] | null>[] {
  return contacts.map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    title: c.title,
    relationRole: c.relationRole,
    tags: c.tags.slice(0, 5), // 最多 5 个标签
    temperature: c.temperature,
    trustLevel: c.trustLevel,
    energyScore: c.energyScore,
    journeyScore: c.journeyScore.toFixed(2),
    relevanceScore: c.relevanceScore.toFixed(2),
    accessibilityScore: c.accessibilityScore.toFixed(2),
    centralityScore: c.centralityScore.toFixed(2),
    notes: (c.notes || '').substring(0, 100), // 最多 100 字
  }))
}

/**
 * 将人脉关系格式化为 Claude 可读的格式
 */
function formatRelationsForPrompt(
  relations: ContactRelation[],
  topContactIds: Set<string>,
): Record<string, string>[] {
  // 只保留涉及 Top-K 联系人的关系边，最多 30 条
  return relations
    .filter((r) => topContactIds.has(r.contactIdA) || topContactIds.has(r.contactIdB))
    .slice(0, 30)
    .map((r) => ({
      from: r.contactIdA,
      to: r.contactIdB,
      desc: r.relationDesc || '相识',
    }))
}

/**
 * 检测目标类别（简化版，与 scoring.ts 保持一致）
 */
function detectGoalCategory(goal: string): string {
  if (
    goal.includes('认识') ||
    goal.includes('介绍') ||
    goal.includes('引荐')
  ) {
    return 'introduction'
  } else if (
    goal.includes('资源') ||
    goal.includes('投资') ||
    goal.includes('融资')
  ) {
    return 'resource'
  } else if (
    goal.includes('建议') ||
    goal.includes('方向') ||
    goal.includes('策略')
  ) {
    return 'advice'
  } else if (
    goal.includes('合作') ||
    goal.includes('项目') ||
    goal.includes('一起')
  ) {
    return 'collaboration'
  } else if (
    goal.includes('行业') ||
    goal.includes('信息') ||
    goal.includes('洞察')
  ) {
    return 'information'
  }
  return 'other'
}

/**
 * 构建发送给 Claude 的提示词
 */
function buildPrompt(
  goal: string,
  scoredContacts: ScoredContact[],
  relations: ContactRelation[],
  candidatePaths: CandidatePath[],
): string {
  const topContactIds = new Set(scoredContacts.map((c) => c.id))
  const formattedContacts = formatContactsForPrompt(scoredContacts)
  const formattedRelations = formatRelationsForPrompt(relations, topContactIds)

  return `## 用户的人脉拓展目标
${goal}

## 用户的人脉网络概况
- 总联系人数：${scoredContacts.length}
- 已分析（Top-15）：${formattedContacts.length}
- 人脉关系边：${formattedRelations.length}

## 候选联系人（按综合评分 journeyScore 排序）
${JSON.stringify(formattedContacts, null, 2)}

## 人脉关系边（表示两人相识）
${JSON.stringify(formattedRelations, null, 2)}

## 系统预计算的候选路径（已排序）
${JSON.stringify(
  candidatePaths.slice(0, 5).map((p) => ({
    path: p.path,
    score: p.score.toFixed(3),
    roleSequence: p.roleSequence,
  })),
  null,
  2,
)}

## 任务说明
请作为一名专业的人脉策略顾问，基于上述数据进行深度分析，输出**严格的 JSON 格式**（不要 markdown 代码块或其他文字）。

你的分析应该包含：

1. **最优主路径选择**：从候选路径中选择或微调最佳路径，并为每个步骤提供具体的沟通建议
   - 开场白：具体可说的话（中文）
   - 核心信息：你想表达的核心诉求（中文）
   - 时机：什么时候最好联系（中文）
   - 注意事项：可能的风险或敏感点（中文，可为空）
   - 沟通渠道：建议用 wechat / call / meeting / email / event 中的哪一种

2. **备选路径**：提供 1-2 条备选路径及其适用场景（中文）

3. **缺失节点分析**：指出当前网络缺少什么类型的人脉，以及如何弥补

4. **整体策略摘要**：用 2-3 句话总结建议（中文）

5. **整体置信度**：0-1 的数字，表示你对这个方案的信心度

## 输出 JSON schema（必须严格遵守）
{
  "primaryPath": [
    {
      "contactId": "string",
      "contactName": "string",
      "hopIndex": 0,
      "introductionVia": null,
      "introductionViaName": null,
      "communicationAdvice": {
        "openingLine": "string",
        "keyMessage": "string",
        "timing": "string",
        "caution": "string or null",
        "channelSuggestion": "wechat|call|meeting|email|event"
      },
      "confidenceAtThisStep": 0.95
    }
  ],
  "alternativePaths": [
    {
      "pathId": "alt-1",
      "steps": [...same as primaryPath step format...],
      "score": 0.82,
      "rationale": "中文：为什么这是备选"
    }
  ],
  "missingNodes": [
    {
      "missingRole": "BIG_INVESTOR|GATEWAY|ADVISOR|THERMOMETER|LIGHTHOUSE|COMRADE",
      "roleName": "中文名称",
      "whyNeeded": "为什么对这个目标很重要",
      "howToFind": "建议在哪儿或怎么找这类人脉"
    }
  ],
  "overallStrategy": "中文：2-3 句总结性建议",
  "overallConfidence": 0.87
}

请确保输出是有效的 JSON，不要在前后添加任何文字或 markdown 符号。`
}

/**
 * 提取路径中的联系人名称（需要 Map）
 */
function getContactNameById(id: string, contacts: ScoredContact[]): string {
  return contacts.find((c) => c.id === id)?.name || id
}

/**
 * 调用 Claude API 进行航程分析
 * 返回完整的 JourneyPathData
 */
export async function analyzeJourneyWithClaude(
  goal: string,
  scoredContacts: ScoredContact[],
  relations: ContactRelation[],
  candidatePaths: CandidatePath[],
): Promise<JourneyPathData> {
  // 如果没有 API key，返回使用预计算数据的兜底结果（用于测试）
  if (!process.env.KIMI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    console.warn('未配置 KIMI_API_KEY 或 ANTHROPIC_API_KEY，使用预计算数据生成响应')
    return generateFallbackPathData(goal, scoredContacts, relations, candidatePaths)
  }

  const prompt = buildPrompt(goal, scoredContacts, relations, candidatePaths)

  let responseText = ''
  try {
    const isKimi = !!process.env.KIMI_API_KEY
    const response = await client.messages.create({
      model: isKimi ? 'moonshot-v1-8k' : 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system: '你是一名专业的人脉策略顾问，擅长分析社交网络并制定最优的人脉拓展路径。你的输出必须是严格的 JSON 格式，不包含任何额外文字、markdown 代码块或其他符号。',
    })

    // 提取响应文本
    if (response.content[0].type === 'text') {
      responseText = response.content[0].text
    }
  } catch (error) {
    console.error('AI API 错误:', error)
    throw new Error('AI 分析失败：' + String(error))
  }

  // 尝试解析 JSON
  let claudeOutput: Record<string, unknown>
  try {
    // 清理响应：移除可能的 markdown 代码块
    let cleanedResponse = responseText
    if (cleanedResponse.includes('```')) {
      cleanedResponse = cleanedResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
    }
    claudeOutput = JSON.parse(cleanedResponse)
  } catch (parseError) {
    console.error('JSON 解析失败:', parseError)
    console.error('原始响应:', responseText)
    throw new Error('AI 返回的格式无效，请重试')
  }

  // 将 Claude 输出转换为 JourneyPathData
  const goalCategory = detectGoalCategory(goal)
  const now = new Date().toISOString()

  // 构建 primaryPath
  const primaryPathSteps: PathStep[] = ((claudeOutput.primaryPath as unknown[]) || []).map(
    (step: unknown, index: number) => {
      const stepData = step as Record<string, unknown>
      const commAdvice = stepData.communicationAdvice as Record<string, unknown> || {}
      return {
        contactId: (stepData.contactId as string),
        contactName: (stepData.contactName as string) || getContactNameById((stepData.contactId as string), scoredContacts),
        hopIndex: (stepData.hopIndex as number) ?? index,
        introductionVia: (stepData.introductionVia as string) || null,
        introductionViaName: (stepData.introductionViaName as string) || null,
        communicationAdvice: {
          openingLine: (commAdvice.openingLine as string) || '你好',
          keyMessage: (commAdvice.keyMessage as string) || '',
          timing: (commAdvice.timing as string) || '尽早',
          caution: (commAdvice.caution as string) || null,
          channelSuggestion: (commAdvice.channelSuggestion as 'wechat' | 'call' | 'meeting' | 'email' | 'event') || 'wechat',
        },
        confidenceAtThisStep: (stepData.confidenceAtThisStep as number) ?? 0.8,
      }
    },
  )

  // 构建备选路径
  const alternativePathsList: AlternativePath[] = (
    (claudeOutput.alternativePaths as unknown[]) || []
  ).map((alt: unknown, index: number) => {
    const altData = alt as Record<string, unknown>
    const stepsArray = (altData.steps as unknown[]) || []
    return ({
      pathId: (altData.pathId as string) || `alt-${index + 1}`,
      steps: stepsArray.map((step: unknown, stepIndex: number) => {
        const stepData = step as Record<string, unknown>
        const commAdviceData = stepData.communicationAdvice as Record<string, unknown> || {}
        return {
          contactId: stepData.contactId as string,
          contactName: (stepData.contactName as string) || getContactNameById(stepData.contactId as string, scoredContacts),
          hopIndex: (stepData.hopIndex as number) ?? stepIndex,
          introductionVia: (stepData.introductionVia as string) || null,
          introductionViaName: (stepData.introductionViaName as string) || null,
          communicationAdvice: {
            openingLine: (commAdviceData.openingLine as string) || '',
            keyMessage: (commAdviceData.keyMessage as string) || '',
            timing: (commAdviceData.timing as string) || '',
            caution: (commAdviceData.caution as string) || null,
            channelSuggestion: (commAdviceData.channelSuggestion as 'wechat' | 'call' | 'meeting' | 'email' | 'event') || 'wechat',
          },
          confidenceAtThisStep: (stepData.confidenceAtThisStep as number) ?? 0.7,
        }
      }),
      score: (altData.score as number) ?? 0.8,
      rationale: (altData.rationale as string) || '备选方案',
    })
  })

  // 构建缺失节点列表
  const missingNodesList: MissingNode[] = ((claudeOutput.missingNodes as unknown[]) || []).map(
    (missing: unknown) => {
      const missingData = missing as Record<string, unknown>
      return ({
        missingRole: (missingData.missingRole as string) as RelationRole,
        roleName: (missingData.roleName as string) || '未知角色',
        whyNeeded: (missingData.whyNeeded as string) || '',
        howToFind: (missingData.howToFind as string) || '',
      })
    },
  )

  // 最终 JourneyPathData
  const pathData: JourneyPathData = {
    version: 1,
    meta: {
      goalCategory: goalCategory as 'introduction' | 'resource' | 'advice' | 'collaboration' | 'information' | 'other',
      totalContacts: scoredContacts.length,
      analyzedContacts: scoredContacts.length,
      computedAt: now,
      modelUsed: 'claude-haiku-4-5-20251001',
    },
    nodes: scoredContacts.map((c) => ({
      ...c,
      contactId: c.id,
      journeyRoleLabel: getRoleLabel(c.relationRole),
      isOnPrimaryPath: primaryPathSteps.some(
        (s) => s.contactId === c.id,
      ),
      isOnAnyPath:
        primaryPathSteps.some((s) => s.contactId === c.id) ||
        alternativePathsList.some((alt) =>
          alt.steps.some((s) => s.contactId === c.id),
        ),
    })),
    primaryPath: primaryPathSteps,
    alternativePaths: alternativePathsList,
    missingNodes: missingNodesList,
    overallStrategy:
      (claudeOutput.overallStrategy as string) || '基于分析，建议按优先级联系相关人脉。',
    overallConfidence: (claudeOutput.overallConfidence as number) ?? 0.75,
  }

  return pathData
}

/**
 * 获取角色的标签（中文标签）
 */
function getRoleLabel(role: RelationRole): string {
  const roleLabels: Record<RelationRole, string> = {
    BIG_INVESTOR: '核心目标节点',
    GATEWAY: '关键路径中转站',
    ADVISOR: '决策支撑节点',
    THERMOMETER: '关系维护节点',
    LIGHTHOUSE: '远期目标节点',
    COMRADE: '协作节点',
  }
  return roleLabels[role] || '网络节点'
}

/**
 * 兜底函数：当 Claude API 不可用时，使用预计算数据生成结果
 */
function generateFallbackPathData(
  goal: string,
  scoredContacts: ScoredContact[],
  relations: ContactRelation[],
  candidatePaths: CandidatePath[],
): JourneyPathData {
  const goalCategory = detectGoalCategory(goal)
  const now = new Date().toISOString()

  // 使用前 3 个候选路径
  const selectedPaths = candidatePaths.slice(0, 3)
  const primaryPath = selectedPaths[0]?.path || []

  // 构建 primary path steps
  const primaryPathSteps: PathStep[] = (primaryPath || []).map(
    (contactId, index) => {
      const contact = scoredContacts.find((c) => c.id === contactId)
      return {
        contactId,
        contactName: contact?.name || contactId,
        hopIndex: index,
        introductionVia: null,
        introductionViaName: null,
        communicationAdvice: {
          openingLine: `Hi ${contact?.name}, 我想向您了解一些关于${goal}的情况`,
          keyMessage: goal,
          timing: '最好在工作日下午3-4点联系',
          caution: null,
          channelSuggestion: 'wechat' as const,
        },
        confidenceAtThisStep: Math.max(0.6, 1.0 - index * 0.15),
      }
    },
  )

  // 构建备选路径
  const alternativePathsList: AlternativePath[] = selectedPaths
    .slice(1)
    .map((pathData, idx) => ({
      pathId: `alt-${idx + 1}`,
      steps: (pathData.path || []).map((contactId, stepIdx) => {
        const contact = scoredContacts.find((c) => c.id === contactId)
        return {
          contactId,
          contactName: contact?.name || contactId,
          hopIndex: stepIdx,
          introductionVia: null,
          introductionViaName: null,
          communicationAdvice: {
            openingLine: `Hello ${contact?.name}`,
            keyMessage: goal,
            timing: '工作日下午',
            caution: null,
            channelSuggestion: 'wechat' as const,
          },
          confidenceAtThisStep: Math.max(0.5, 0.85 - stepIdx * 0.15),
        }
      }),
      score: pathData.score,
      rationale: '基于网络拓扑和节点评分的备选方案',
    }))

  return {
    version: 1,
    meta: {
      goalCategory: goalCategory as 'introduction' | 'resource' | 'advice' | 'collaboration' | 'information' | 'other',
      totalContacts: scoredContacts.length,
      analyzedContacts: scoredContacts.length,
      computedAt: now,
      modelUsed: 'fallback-precomputed',
    },
    nodes: scoredContacts.map((contact) => ({
      ...contact,
      contactId: contact.id,
      journeyRoleLabel: getRoleLabel(contact.relationRole),
      isOnPrimaryPath: primaryPath.includes(contact.id),
      isOnAnyPath: selectedPaths.some((p) => p.path.includes(contact.id)),
    })),
    primaryPath: primaryPathSteps,
    alternativePaths: alternativePathsList,
    missingNodes: [],
    overallStrategy:
      '根据预计算的网络评分，以上路径代表了达成目标的最优方案。建议按顺序联系相关人脉。',
    overallConfidence: 0.7,
  }
}
