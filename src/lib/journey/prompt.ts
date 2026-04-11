import OpenAI from 'openai'
import {
  ScoredContact,
  CandidatePath,
  JourneyPathData,
  PathStep,
  AlternativePath,
  MissingNode,
  DecompositionPlan,
  NetworkExpansionSuggestion,
} from './types'
import { ROLE_ARCHETYPE_LABELS, RoleArchetype } from '@/types'
import { ContactRelation } from '@prisma/client'

//统一使用 Qwen 客户端（在函数调用时动态读取环境变量）
function getAIClient() {
 const qwenKey = process.env.QWEN_API_KEY

 if (!qwenKey) return null

 return {
 type: 'qwen' as const,
 client: new OpenAI({
 apiKey: qwenKey,
 baseURL: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
 }),
 }
}

/**
 * 将联系人数据格式化为 Claude 可读的 JSON
 */
function formatContactsForPrompt(
  contacts: ScoredContact[],
): Record<string, unknown>[] {
  return contacts.map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    title: c.title,
    roleArchetype: c.roleArchetype,
    archetype: c.archetype,
    tags: c.tags.slice(0, 5),
    temperature: c.temperature,
    trustLevel: c.trustLevel,
    energyScore: c.energyScore,
    journeyScore: c.journeyScore.toFixed(2),
    arcScore: c.arcScore.toFixed(2),
    relevanceScore: c.relevanceScore.toFixed(2),
    accessibilityScore: c.accessibilityScore.toFixed(2),
    centralityScore: c.centralityScore.toFixed(2),
    relationVector: c.relationVector
      ? {
          trust: c.relationVector.trust,
          powerDelta: c.relationVector.powerDelta,
          goalAlignment: c.relationVector.goalAlignment,
          emotionalVolatility: c.relationVector.emotionalVolatility,
          reciprocity: c.relationVector.reciprocity,
          boundaryStability: c.relationVector.boundaryStability,
        }
      : null,
    notes: (c.notes || '').substring(0, 100),
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

interface SelfProfile {
  name?: string | null
  goal?: string | null
  selfTags?: string | null
  selfCompany?: string | null
  selfTitle?: string | null
  selfJobPosition?: string | null
  selfSpiritAnimal?: string | null
  selfBio?: string | null
}

export interface CompanyContext {
  id: string
  name: string
  industry: string | null
  scale: string | null
  mainBusiness: string | null
  tags: string[]
  familiarityLevel: number | null
  temperature: string | null
  energyScore: number
  founderName: string | null
  investors: string[]
  linkedContactIds: string[] // 人脉库中关联该公司的联系人 ID
}

/**
 * 构建发送给 Claude 的提示词
 */
function buildPrompt(
  goal: string,
  scoredContacts: ScoredContact[],
  relations: ContactRelation[],
  candidatePaths: CandidatePath[],
  selfProfile?: SelfProfile,
  companies?: CompanyContext[],
  selectedPlan?: DecompositionPlan,
): string {
  const topContactIds = new Set(scoredContacts.map((c) => c.id))
  const formattedContacts = formatContactsForPrompt(scoredContacts)
  const formattedRelations = formatRelationsForPrompt(relations, topContactIds)

  let selfSection = ''
  if (selfProfile && (selfProfile.name || selfProfile.selfBio || selfProfile.selfTags)) {
    const tags = selfProfile.selfTags ? (() => { try { return JSON.parse(selfProfile.selfTags) } catch { return [] } })() : []
    selfSection = `
## 用户自身档案（航程起点）
- 姓名：${selfProfile.name || '未填写'}
- 公司：${selfProfile.selfCompany || '未填写'}
- 职位：${selfProfile.selfTitle || ''}${selfProfile.selfJobPosition ? `（${selfProfile.selfJobPosition}）` : ''}
- 行业标签：${tags.length > 0 ? tags.join('、') : '未填写'}
- 气场：${selfProfile.selfSpiritAnimal || '未选择'}
- 个人介绍：${selfProfile.selfBio || '未填写'}
- 长期目标：${selfProfile.goal || '未填写'}

请将「${selfProfile.name || '用户'}」作为人脉网络的起点，分析从 TA 出发到达目标所需的最优路径。`
  }

  // 企业资源部分
  let companySection = ''
  if (companies && companies.length > 0) {
    const formatted = companies.map((c) => ({
      id: c.id,
      name: c.name,
      industry: c.industry,
      scale: c.scale,
      mainBusiness: c.mainBusiness,
      tags: c.tags.slice(0, 5),
      familiarityLevel: c.familiarityLevel,
      temperature: c.temperature,
      energyScore: c.energyScore,
      founderName: c.founderName,
      investors: c.investors.slice(0, 3),
      linkedContactNames: c.linkedContactIds
        .map((cid) => scoredContacts.find((sc) => sc.id === cid)?.name)
        .filter(Boolean)
        .slice(0, 3),
    }))
    companySection = `
## 用户的企业资源网络（${companies.length} 家）
用户维护了以下企业关系，可作为目标分析的参考节点（考虑其相关联系人是否应优先出现在路径中）：
${JSON.stringify(formatted, null, 2)}

`
  }

  // 用户选定的拆解方案
  let planSection = ''
  if (selectedPlan) {
    const stepsText = selectedPlan.steps.map(s => `  步骤${s.id}「${s.label}」：${s.description}`).join('\n')
    planSection = `
## 用户选定的行动方案：方案${selectedPlan.id} —「${selectedPlan.title}」
- 方案特征：${selectedPlan.summary}
- 策略思路：${selectedPlan.strategy}
- 执行步骤：
${stepsText}

请在生成路径时，优先按照此方案的策略思路来选择和排序联系人节点。

`
  }

  return `## 用户的人脉拓展目标
${goal}
${planSection}${selfSection}${companySection}
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

1. **最优主路径选择**：从候选路径中选择或微调最佳路径，并为每个步骤提供：
   - keyTactic：1-2句话的关键攻略（告诉用户如何高效利用这位联系人）
   - expandedTactics：展开攻略（话术建议、助攻联系人、互惠关系、好感度提升）
   - communicationAdvice：具体沟通建议（开场白、核心诉求、时机、渠道等）

2. **备选路径**：提供最多3条备选路径，分别标注 pathCategory（planB 或 assist）和 categoryLabel

3. **缺失节点分析**：指出当前网络缺少什么类型的人脉，以及如何弥补

4. **人脉拓展建议**：如当前人脉不足以达成目标，提供需要拓展的人脉方向（行业、企业画像、职级）

5. **整体策略摘要**：用 2-3 句话总结建议（中文）

6. **整体置信度**：0-1 的数字，表示你对这个方案的信心度

## 输出 JSON schema（必须严格遵守）
{
  "primaryPath": [
    {
      "contactId": "string",
      "contactName": "string",
      "hopIndex": 0,
      "introductionVia": null,
      "introductionViaName": null,
      "keyTactic": "1-2句关键攻略，说明如何高效利用此联系人（中文）",
      "expandedTactics": {
        "scriptSuggestion": "完整话术脚本，包含具体措辞（中文）",
        "assistContactIds": [],
        "mutualBenefit": "你能给对方带来什么价值，互惠关系说明（中文）",
        "rapportTips": "如何加强好感度，具体行动建议（中文）"
      },
      "communicationAdvice": {
        "openingLine": "具体开场白（中文）",
        "keyMessage": "核心诉求（中文）",
        "timing": "联系时机建议（中文）",
        "caution": "注意事项或null",
        "channelSuggestion": "wechat|call|meeting|email|event"
      },
      "confidenceAtThisStep": 0.95
    }
  ],
  "alternativePaths": [
    {
      "pathId": "alt-1",
      "pathCategory": "planB",
      "categoryLabel": "Plan B 备选",
      "steps": [...same format as primaryPath steps, including keyTactic and expandedTactics...],
      "score": 0.82,
      "rationale": "中文：为什么这是备选，适用于什么情况"
    },
    {
      "pathId": "alt-2",
      "pathCategory": "assist",
      "categoryLabel": "助攻路径",
      "steps": [...],
      "score": 0.75,
      "rationale": "中文：这条路径如何从侧面助攻主目标"
    }
  ],
  "missingNodes": [
    {
      "missingRole": "BREAKER|EVANGELIST|ANALYST|BINDER",
      "roleName": "中文名称",
      "whyNeeded": "为什么对这个目标很重要",
      "howToFind": "建议在哪儿或怎么找这类人脉"
    }
  ],
  "networkExpansion": [
    {
      "industry": "目标行业（中文）",
      "companyProfile": "企业画像：类型/规模（中文）",
      "level": "目标职级/资历（中文）",
      "reason": "为何需要此类人脉（中文）",
      "urgency": "high|medium|low"
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
  selfProfile?: SelfProfile,
  companies?: CompanyContext[],
  selectedPlan?: DecompositionPlan,
): Promise<JourneyPathData> {
  // 如果没有 API key，返回使用预计算数据的兜底结果（用于测试）
  if (!process.env.QWEN_API_KEY) {
    console.warn('未配置 QWEN_API_KEY，使用预计算数据生成响应')
    return generateFallbackPathData(goal, scoredContacts, relations, candidatePaths, selectedPlan)
  }

  const prompt = buildPrompt(goal, scoredContacts, relations, candidatePaths, selfProfile, companies, selectedPlan)

  const aiClient = getAIClient()
  if (!aiClient) throw new Error('未配置 AI 服务')

  let responseText = ''
  try {
    const model = 'qwen3.5-flash'
    const response = await (aiClient.client as OpenAI).chat.completions.create({
      model,
      max_tokens: 8192,
      messages: [
        {
          role: 'system',
          content: '你是一名专业的人脉策略顾问，擅长分析社交网络并制定最优的人脉拓展路径。你的输出必须是严格的 JSON 格式，不包含任何额外文字、markdown 代码块或其他符号。',
        },
        { role: 'user', content: prompt },
      ],
    })
    const msg = response.choices[0].message as unknown as Record<string, unknown>
    responseText = (msg.content as string) || ''
  } catch (error) {
    console.error('[AI API 错误]', JSON.stringify(error, null, 2))
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
    console.error('原始响应完整内容:', responseText)
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
      const expanded = stepData.expandedTactics as Record<string, unknown> | undefined
      return {
        contactId: (stepData.contactId as string),
        contactName: (stepData.contactName as string) || getContactNameById((stepData.contactId as string), scoredContacts),
        hopIndex: (stepData.hopIndex as number) ?? index,
        introductionVia: (stepData.introductionVia as string) || null,
        introductionViaName: (stepData.introductionViaName as string) || null,
        keyTactic: (stepData.keyTactic as string) || undefined,
        expandedTactics: expanded ? {
          scriptSuggestion: (expanded.scriptSuggestion as string) || '',
          assistContactIds: (expanded.assistContactIds as string[]) || [],
          mutualBenefit: (expanded.mutualBenefit as string) || '',
          rapportTips: (expanded.rapportTips as string) || '',
        } : undefined,
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
      pathCategory: (altData.pathCategory as 'planB' | 'assist') || (index === 0 ? 'planB' : 'assist'),
      categoryLabel: (altData.categoryLabel as string) || (index === 0 ? 'Plan B 备选' : `助攻路径${index}`),
      steps: stepsArray.map((step: unknown, stepIndex: number) => {
        const stepData = step as Record<string, unknown>
        const commAdviceData = stepData.communicationAdvice as Record<string, unknown> || {}
        const expanded = stepData.expandedTactics as Record<string, unknown> | undefined
        return {
          contactId: stepData.contactId as string,
          contactName: (stepData.contactName as string) || getContactNameById(stepData.contactId as string, scoredContacts),
          hopIndex: (stepData.hopIndex as number) ?? stepIndex,
          introductionVia: (stepData.introductionVia as string) || null,
          introductionViaName: (stepData.introductionViaName as string) || null,
          keyTactic: (stepData.keyTactic as string) || undefined,
          expandedTactics: expanded ? {
            scriptSuggestion: (expanded.scriptSuggestion as string) || '',
            assistContactIds: (expanded.assistContactIds as string[]) || [],
            mutualBenefit: (expanded.mutualBenefit as string) || '',
            rapportTips: (expanded.rapportTips as string) || '',
          } : undefined,
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
        missingRole: (missingData.missingRole as string) as RoleArchetype,
        roleName: (missingData.roleName as string) || '未知角色',
        whyNeeded: (missingData.whyNeeded as string) || '',
        howToFind: (missingData.howToFind as string) || '',
      })
    },
  )

  // 解析人脉拓展建议
  const networkExpansionList: NetworkExpansionSuggestion[] = ((claudeOutput.networkExpansion as unknown[]) || []).map(
    (item: unknown) => {
      const d = item as Record<string, unknown>
      return {
        industry: (d.industry as string) || '',
        companyProfile: (d.companyProfile as string) || '',
        level: (d.level as string) || '',
        reason: (d.reason as string) || '',
        urgency: (d.urgency as 'high' | 'medium' | 'low') || 'medium',
      }
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
      modelUsed: 'qwen3.5-flash',
    },
    nodes: scoredContacts.map((c) => ({
      ...c,
      contactId: c.id,
      journeyRoleLabel: getRoleLabel(c.roleArchetype),
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
    networkExpansion: networkExpansionList.length > 0 ? networkExpansionList : undefined,
    selectedPlan,
    overallStrategy:
      (claudeOutput.overallStrategy as string) || '基于分析，建议按优先级联系相关人脉。',
    overallConfidence: (claudeOutput.overallConfidence as number) ?? 0.75,
  }

  return pathData
}

/**
 * 获取角色原型的标签（中文标签）
 */
function getRoleLabel(role: RoleArchetype): string {
  return ROLE_ARCHETYPE_LABELS[role]?.journeyRole || '网络节点'
}

/**
 * 兜底函数：当 Claude API 不可用时，使用预计算数据生成结果
 */
function generateFallbackPathData(
  goal: string,
  scoredContacts: ScoredContact[],
  relations: ContactRelation[],
  candidatePaths: CandidatePath[],
  selectedPlan?: DecompositionPlan,
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
      journeyRoleLabel: getRoleLabel(contact.roleArchetype),
      isOnPrimaryPath: primaryPath.includes(contact.id),
      isOnAnyPath: selectedPaths.some((p) => p.path.includes(contact.id)),
    })),
    primaryPath: primaryPathSteps,
    alternativePaths: alternativePathsList,
    missingNodes: [],
    selectedPlan,
    overallStrategy:
      '根据预计算的网络评分，以上路径代表了达成目标的最优方案。建议按顺序联系相关人脉。',
    overallConfidence: 0.7,
  }
}
