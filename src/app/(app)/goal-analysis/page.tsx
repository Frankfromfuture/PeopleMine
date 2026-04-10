'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  DecompositionPlan,
  JourneyAnalysisResponse,
  JourneyPathData,
  PathStep,
  StepExecutionStatus,
  StepStatus,
} from '@/lib/journey/types'
import { InteractionType, INTERACTION_TYPE_LABELS } from '@/types'
import GoalList, { JourneySummary, deriveGoalStatus } from './GoalList'
import LottieLoader from '@/components/LottieLoader'
import PageHeader from '@/components/PageHeader'

type UIPhase = 'idle' | 'decomposing' | 'plan_selection' | 'analyzing' | 'path_view'
type LoadingStep = 'idle' | 'step1' | 'step2' | 'step3' | 'step4'
type PathViewTab = 'routes' | 'network'

interface RawJourney {
  id: string
  goal: string
  createdAt: string
  pathData: unknown
}

const LOADING_STEPS = [
  { key: 'step1', label: '读取人脉数据', emoji: '1' },
  { key: 'step2', label: '计算节点评分', emoji: '2' },
  { key: 'step3', label: '规划候选路径', emoji: '3' },
  { key: 'step4', label: 'AI 深度分析', emoji: '4' },
] as const

const PLAN_CFG = {
  A: { ring: 'border-gray-700 bg-gray-900/[0.03]', badge: 'bg-gray-900 text-white', bar: 'bg-gray-800' },
  B: { ring: 'border-gray-500 bg-gray-600/[0.03]', badge: 'bg-gray-600 text-white', bar: 'bg-gray-600' },
  C: { ring: 'border-gray-400 bg-gray-400/[0.03]', badge: 'bg-gray-500 text-white', bar: 'bg-gray-500' },
} as const

const DIFFICULTY_CFG = {
  easy: { label: '简单', cls: 'border-gray-300 text-gray-500 bg-gray-50' },
  medium: { label: '中等', cls: 'border-gray-400 text-gray-700 bg-gray-100' },
  hard: { label: '较难', cls: 'border-gray-600 text-gray-900 bg-gray-200' },
} as const

const STATUS_LABEL: Record<StepExecutionStatus, string> = {
  pending: '待联系',
  in_progress: '联系中',
  done: '已完成',
  skipped: '已跳过',
  failed: '未回应',
}

const STATUS_STYLE: Record<StepExecutionStatus, string> = {
  pending: 'bg-gray-50 text-gray-500 border-gray-200',
  in_progress: 'bg-gray-100 text-gray-800 border-gray-300',
  done: 'bg-gray-900 text-white border-gray-900',
  skipped: 'bg-gray-50 text-gray-400 border-gray-200',
  failed: 'bg-gray-100 text-gray-600 border-gray-300',
}

const ROUTE_BADGES = ['A', 'B', 'C', 'D']
const ROUTE_LABELS = ['主路径', 'Plan B', '助攻一', '助攻二']

const DELETED_KEY = 'pm-deleted-journey-ids'
const DEFAULT_QUICK_START = [
  '认识 3 位医疗行业 HR 总监，争取内推机会',
  '找到能在 AI 领域帮助我成长的导师',
  '打入互联网产品圈，拓展核心人脉',
]

function loadDeleted(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveDeleted(ids: Set<string>) {
  try {
    localStorage.setItem(DELETED_KEY, JSON.stringify([...ids]))
  } catch {
    // ignore localStorage errors
  }
}

function buildQuickStartQuestions(coreGoal: string, plans: DecompositionPlan[]): string[] {
  const cleanGoal = coreGoal.replace(/\s+/g, ' ').trim()
  if (!cleanGoal || plans.length === 0) return DEFAULT_QUICK_START

  const questions = plans.slice(0, 3).map((plan, index) => {
    const title = plan.title?.trim() || `路径 ${index + 1}`
    const firstStep = plan.steps?.[0]
    const stepLabel = firstStep?.label?.trim()
    const stepDesc = firstStep?.description?.trim()

    if (stepLabel && stepDesc) {
      return `围绕“${cleanGoal}”，若采用「${title}」，你会如何先完成“${stepLabel}”：${stepDesc}？`
    }
    if (stepLabel) {
      return `围绕“${cleanGoal}”，若采用「${title}」，你会如何推进第一步“${stepLabel}”？`
    }
    if (plan.summary?.trim()) {
      return `围绕“${cleanGoal}”，你会如何验证「${title}」这条路径：${plan.summary.trim()}？`
    }
    return `围绕“${cleanGoal}”，你会如何启动「${title}」这条推进路径？`
  })

  while (questions.length < 3) {
    questions.push(`围绕“${cleanGoal}”，你下一步最先要链接的关键人脉是谁？`)
  }

  return questions.slice(0, 3)
}

function StepStatusBadge({
  contactId,
  stepStatus,
  journeyId,
  onUpdate,
}: {
  contactId: string
  stepStatus: StepStatus | undefined
  journeyId: string | null
  onUpdate: (status: StepStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [note, setNote] = useState('')
  const [interactionType, setInteractionType] = useState<InteractionType>('MEETING')
  const current = stepStatus?.status ?? 'pending'

  async function patch(status: StepExecutionStatus, extra?: { note: string | null; interactionType: InteractionType }) {
    if (!journeyId) return
    setSubmitting(true)

    try {
      const res = await fetch(`/api/journey/${journeyId}/steps`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, status, ...extra }),
      })
      if (!res.ok) throw new Error('状态更新失败')
      const data = await res.json()
      const updated = (data.stepStatuses as StepStatus[]).find((item) => item.contactId === contactId)
      if (updated) onUpdate(updated)
    } catch {
      toast.error('状态更新失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative" onClick={(event) => event.stopPropagation()}>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full border px-2 py-1 text-[10px] font-medium ${STATUS_STYLE[current]}`}>
          {STATUS_LABEL[current]}
        </span>
        {journeyId && current !== 'done' && (
          <>
            {current !== 'in_progress' && (
              <button
                disabled={submitting}
                onClick={() => patch('in_progress')}
                className="rounded-full border border-gray-200 px-2 py-1 text-[10px] text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
              >
                联系中
              </button>
            )}
            <button
              disabled={submitting}
              onClick={() => setOpen(true)}
              className="rounded-full border border-gray-300 px-2 py-1 text-[10px] text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              完成
            </button>
            {current !== 'skipped' && (
              <button
                disabled={submitting}
                onClick={() => patch('skipped')}
                className="rounded-full border border-gray-200 px-2 py-1 text-[10px] text-gray-400 transition hover:bg-gray-50 disabled:opacity-50"
              >
                跳过
              </button>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 top-full z-50 mt-2 w-60 rounded-2xl border border-gray-200 bg-white p-3 shadow-lg"
          >
            <p className="text-xs font-semibold text-gray-700">记录本次互动</p>
            <select
              value={interactionType}
              onChange={(event) => setInteractionType(event.target.value as InteractionType)}
              className="mt-3 h-10 w-full rounded-xl border border-gray-200 px-3 text-xs outline-none focus:border-gray-400"
            >
              {(Object.keys(INTERACTION_TYPE_LABELS) as InteractionType[]).map((key) => (
                <option key={key} value={key}>
                  {INTERACTION_TYPE_LABELS[key]}
                </option>
              ))}
            </select>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="备注，可选"
              className="mt-2 h-10 w-full rounded-xl border border-gray-200 px-3 text-xs outline-none focus:border-gray-400"
            />
            <div className="mt-3 flex gap-2">
              <button
                disabled={submitting}
                onClick={async () => {
                  await patch('done', { note: note || null, interactionType })
                  setOpen(false)
                  setNote('')
                  toast.success('已标记完成')
                }}
                className="flex-1 rounded-xl bg-[#A04F47] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#A04F47]/90 disabled:opacity-50"
              >
                {submitting ? '保存中' : '确认完成'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-500 transition hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PlanCard({
  plan,
  isSelected,
  onSelect,
}: {
  plan: DecompositionPlan
  isSelected: boolean
  onSelect: () => void
}) {
  const diff = DIFFICULTY_CFG[plan.difficulty]
  const color = PLAN_CFG[plan.id] ?? PLAN_CFG.A

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.99 }}
      className={`relative w-full rounded-[24px] border-2 p-5 text-left transition ${
        isSelected ? `${color.ring} shadow-lg` : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${color.badge}`}>
          {plan.id}
        </span>
        <span className="text-base font-semibold text-gray-900">{plan.title}</span>
        <span className={`ml-auto rounded-full border px-2 py-1 text-[10px] font-medium ${diff.cls}`}>{diff.label}</span>
      </div>

      <p className="mb-4 text-sm leading-6 text-gray-500">{plan.summary}</p>

      <div className="space-y-2.5">
        {plan.steps.map((step) => (
          <div key={step.id} className="flex items-start gap-2">
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${color.badge}`}>
              {step.id}
            </span>
            <div className="text-sm leading-6 text-gray-700">
              <span className="font-medium">{step.label}</span>
              <span className="ml-1.5 text-gray-400">{step.description}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.18em] text-gray-400">成功率</span>
          <span className="text-[11px] font-semibold text-gray-700">{plan.successRate}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100">
          <div className={`h-full rounded-full ${color.bar}`} style={{ width: `${plan.successRate}%` }} />
        </div>
      </div>

      <p className="mt-4 text-xs leading-6 text-gray-400">{plan.strategy}</p>

      {isSelected && (
        <div className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-[10px] font-semibold text-white">
          ✓
        </div>
      )}
    </motion.button>
  )
}

function ContactTacticCard({
  step,
  stepStatus,
  journeyId,
  onUpdate,
  allSteps,
  strategyOnly = false,
}: {
  step: PathStep
  stepStatus: StepStatus | undefined
  journeyId: string | null
  onUpdate: (status: StepStatus) => void
  allSteps: PathStep[]
  strategyOnly?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const isDone = stepStatus?.status === 'done'
  const assistNames = (step.expandedTactics?.assistContactIds || [])
    .map((id) => allSteps.find((item) => item.contactId === id)?.contactName)
    .filter(Boolean)

  if (strategyOnly) {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="rounded-xl border border-gray-200 bg-white px-3.5 py-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">策略正文</p>
          <p className="mt-1.5 text-[11px] leading-5 text-gray-600 break-words">
            {step.keyTactic || step.expandedTactics?.scriptSuggestion || step.communicationAdvice.openingLine}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-3.5 py-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">话题开启建议</p>
          <p className="mt-1.5 text-[11px] leading-5 text-gray-600 break-words">{step.communicationAdvice.timing}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-3.5 py-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">对方需求猜测</p>
          <p className="mt-1.5 text-[11px] leading-5 text-gray-600 break-words">{step.communicationAdvice.channelSuggestion}</p>
        </div>

        {step.communicationAdvice.caution && (
          <div className="rounded-xl border border-gray-200 bg-white px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">注意事项</p>
            <p className="mt-1.5 text-[11px] leading-5 text-gray-600 break-words">{step.communicationAdvice.caution}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`rounded-[20px] border p-3.5 text-sm transition ${isDone ? 'border-gray-200 bg-[#fbfbfa] opacity-75' : 'border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]'}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-xs font-semibold ${isDone ? 'bg-gray-200 text-gray-600' : 'bg-gray-900 text-white'}`}>
          {isDone ? '✓' : step.contactName.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="truncate text-sm font-medium text-gray-900">{step.contactName}</p>
            {step.confidenceAtThisStep < 0.5 && (
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] text-gray-500">需预热</span>
            )}
            <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] text-gray-500">
              {(step.confidenceAtThisStep * 100).toFixed(0)}%
            </span>
          </div>
          {step.introductionViaName && <p className="mt-1 text-[11px] text-gray-400">经 {step.introductionViaName} 引荐</p>}
          {step.keyTactic && (
            <p className="mt-2 rounded-2xl border border-gray-100 bg-[#fafaf9] px-3 py-2.5 text-[11px] leading-5 text-gray-600">
              {step.keyTactic}
            </p>
          )}
          <StepStatusBadge contactId={step.contactId} stepStatus={stepStatus} journeyId={journeyId} onUpdate={onUpdate} />
        </div>
        <button
          onClick={() => setExpanded((current) => !current)}
          className="rounded-full border border-gray-200 px-2.5 py-1 text-[10px] text-gray-500 transition hover:bg-gray-50"
        >
          {expanded ? '收起' : '展开'}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">开场白</p>
                <p className="mt-1 rounded-2xl bg-[#fafaf9] px-3 py-2.5 text-[11px] leading-5 text-gray-700">{step.communicationAdvice.openingLine}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">话题开启建议</p>
                  <p className="mt-1 rounded-xl border border-gray-100 bg-white px-3 py-2 text-[11px] leading-5 text-gray-600 break-words">{step.communicationAdvice.timing}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">对方需求猜测</p>
                  <p className="mt-1 rounded-xl border border-gray-100 bg-white px-3 py-2 text-[11px] leading-5 text-gray-600 break-words">
                    {step.communicationAdvice.channelSuggestion}
                  </p>
                </div>
              </div>

              {step.expandedTactics?.scriptSuggestion && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">话术建议</p>
                  <p className="mt-1 text-[11px] leading-5 text-gray-600">{step.expandedTactics.scriptSuggestion}</p>
                </div>
              )}

              {assistNames.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">助攻人脉</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {assistNames.map((name) => (
                      <span key={name} className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] text-gray-600">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {step.communicationAdvice.caution && (
                <div className="rounded-2xl border border-gray-200 bg-[#fafaf9] px-3 py-2.5 text-[11px] leading-5 text-gray-600">
                  注意事项：{step.communicationAdvice.caution}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RouteCard({
  route,
  stepStatuses,
  journeyId,
  onUpdate,
}: {
  route: { key: string; label: string; badge: string; steps: PathStep[]; score: number; rationale: string }
  stepStatuses: StepStatus[]
  journeyId: string | null
  onUpdate: (status: StepStatus) => void
}) {
  const isPrimary = route.key === 'primary'
  const keyContacts = route.steps.slice(0, 3)
  const [activeContactId, setActiveContactId] = useState<string | null>(keyContacts[0]?.contactId ?? null)

  useEffect(() => {
    if (!activeContactId || !keyContacts.some((step) => step.contactId === activeContactId)) {
      setActiveContactId(keyContacts[0]?.contactId ?? null)
    }
  }, [activeContactId, keyContacts])

  const activeStep = keyContacts.find((step) => step.contactId === activeContactId) ?? keyContacts[0] ?? null

  return (
    <div className={`flex h-full min-h-[420px] w-full min-w-0 flex-col overflow-hidden rounded-[28px] border ${isPrimary ? 'border-gray-400 bg-white shadow-md' : 'border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]'}`}>
      <div className={`border-b px-4 py-4 ${isPrimary ? 'border-gray-200 bg-[#fafaf9]' : 'border-gray-100 bg-white'}`}>
        <div className="mb-2 flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${isPrimary ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>
            {route.badge} {route.label}
          </span>
          <span className={`ml-auto text-xs font-semibold ${isPrimary ? 'text-gray-900' : 'text-gray-500'}`}>
            {(route.score * 100).toFixed(0)}%
          </span>
        </div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">核心策略评分</p>
        <div className="mt-1.5 h-1.5 rounded-full bg-gray-100">
          <div className={`h-full rounded-full ${isPrimary ? 'bg-gray-800' : 'bg-gray-400'}`} style={{ width: `${route.score * 100}%` }} />
        </div>
        <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-gray-400">核心策略</p>
        <p className="mt-1 text-xs leading-6 text-gray-600">{route.rationale || '结合当前人脉优先推进成功率更高的连接路径。'}</p>
      </div>

      <div className="border-b border-gray-100 px-4 py-3 bg-[#fcfcfb]">
        <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-gray-400">关键路径</p>
        <div className="flex flex-wrap items-center gap-2">
          {keyContacts.map((step, index) => (
            <button
              key={step.contactId}
              onClick={() => setActiveContactId(step.contactId)}
              className={`rounded-full border px-2.5 py-1 text-[10px] transition ${
                activeStep?.contactId === step.contactId
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
              }`}
            >
              {index + 1}. {step.contactName}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-white p-3.5 [scrollbar-gutter:stable] [scroll-behavior:smooth] [-webkit-overflow-scrolling:touch]">
        {activeStep ? (
          <ContactTacticCard
            key={activeStep.contactId}
            step={activeStep}
            stepStatus={stepStatuses.find((item) => item.contactId === activeStep.contactId)}
            journeyId={journeyId}
            onUpdate={onUpdate}
            allSteps={route.steps}
            strategyOnly
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-[20px] border border-dashed border-gray-200 text-xs text-gray-400">
            暂无可展示攻略
          </div>
        )}
      </div>
    </div>
  )
}

function ExpansionPersonaTile({
  item,
}: {
  item: { persona: string; companyLevel: string; reason: string; howToExpand: string }
}) {
  return (
    <div className="rounded-[22px] border border-gray-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">建议拓展人物</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{item.persona}</p>
      <p className="mt-2 text-xs leading-6 text-gray-600">{item.companyLevel}</p>

      <div className="mt-3 rounded-2xl border border-gray-100 bg-[#fafaf9] px-3 py-2.5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">拓展理由</p>
        <p className="mt-1 text-xs leading-6 text-gray-600">{item.reason}</p>
      </div>

      <div className="mt-3 rounded-2xl border border-gray-100 bg-[#fafaf9] px-3 py-2.5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">拓展方式建议</p>
        <p className="mt-1 text-xs leading-6 text-gray-600">{item.howToExpand}</p>
      </div>
    </div>
  )
}

export default function GoalAnalysisPage() {
  const [allJourneys, setAllJourneys] = useState<JourneySummary[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyTab, setHistoryTab] = useState<'all' | 'active' | 'completed'>('all')
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())

  const [phase, setPhase] = useState<UIPhase>('idle')
  const [goal, setGoal] = useState('')
  const [decomposePlans, setDecomposePlans] = useState<DecompositionPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<DecompositionPlan | null>(null)
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('idle')

  const [pathData, setPathData] = useState<JourneyPathData | null>(null)
  const [journeyId, setJourneyId] = useState<string | null>(null)
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pathViewTab, setPathViewTab] = useState<PathViewTab>('routes')
  const [quickStartGoals, setQuickStartGoals] = useState<string[]>(DEFAULT_QUICK_START)
  const [quickStartFromCoreGoal, setQuickStartFromCoreGoal] = useState(false)
  const [quickStartLoading, setQuickStartLoading] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setDeletedIds(loadDeleted())
  }, [])

  useEffect(() => {
    fetch('/api/journey?limit=50')
      .then((res) => res.json())
      .then((data) => {
        const parsed = (data.journeys as RawJourney[]).map((journey) => ({
          id: journey.id,
          goal: journey.goal,
          createdAt: journey.createdAt,
          pathData: journey.pathData as JourneyPathData | null,
        }))
        setAllJourneys(parsed)
      })
      .catch(console.error)
      .finally(() => setHistoryLoading(false))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function hydrateQuickStart() {
      try {
        const meRes = await fetch('/api/me')
        if (!meRes.ok) return

        const meData = await meRes.json()
        const coreGoal = typeof meData?.user?.goal === 'string' ? meData.user.goal.trim() : ''
        if (!coreGoal) return

        setQuickStartLoading(true)
        const decomposeRes = await fetch('/api/journey/decompose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal: coreGoal }),
        })
        if (!decomposeRes.ok) return

        const decomposeData = await decomposeRes.json()
        const plans = Array.isArray(decomposeData?.plans) ? (decomposeData.plans as DecompositionPlan[]) : []
        const nextQuestions = buildQuickStartQuestions(coreGoal, plans)

        if (!cancelled) {
          setQuickStartGoals(nextQuestions)
          setQuickStartFromCoreGoal(true)
        }
      } catch {
        if (!cancelled) {
          setQuickStartGoals(DEFAULT_QUICK_START)
          setQuickStartFromCoreGoal(false)
        }
      } finally {
        if (!cancelled) setQuickStartLoading(false)
      }
    }

    hydrateQuickStart()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (phase !== 'analyzing') return
    const timers = [
      setTimeout(() => setLoadingStep('step1'), 0),
      setTimeout(() => setLoadingStep('step2'), 800),
      setTimeout(() => setLoadingStep('step3'), 1600),
      setTimeout(() => setLoadingStep('step4'), 2400),
    ]
    return () => {
      timers.forEach(clearTimeout)
      setLoadingStep('idle')
    }
  }, [phase])

  const handleReset = useCallback(() => {
    setPhase('idle')
    setGoal('')
    setDecomposePlans([])
    setSelectedPlan(null)
    setPathData(null)
    setJourneyId(null)
    setStepStatuses([])
    setError(null)
    setPathViewTab('routes')
  }, [])

  const handleDelete = useCallback((id: string) => {
    setDeletedIds((current) => {
      const next = new Set(current)
      next.add(id)
      saveDeleted(next)
      return next
    })
    if (journeyId === id) handleReset()
  }, [handleReset, journeyId])

  const handleRestore = useCallback((id: string) => {
    setDeletedIds((current) => {
      const next = new Set(current)
      next.delete(id)
      saveDeleted(next)
      return next
    })
  }, [])

  const handleDecompose = useCallback(async () => {
    if (!goal.trim() || phase !== 'idle') return
    setPhase('decomposing')
    setError(null)
    try {
      const res = await fetch('/api/journey/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goal.trim() }),
      })
      if (!res.ok) throw new Error('目标拆解失败')
      const data = await res.json()
      setDecomposePlans(data.plans || [])
      setPhase('plan_selection')
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知错误'
      setError(message)
      toast.error(message)
      setPhase('idle')
    }
  }, [goal, phase])

  const handleSelectPlan = useCallback(async (plan: DecompositionPlan) => {
    setSelectedPlan(plan)
    setPhase('analyzing')
    setPathViewTab('routes')
    setError(null)
    setPathData(null)
    setJourneyId(null)
    setStepStatuses([])

    try {
      const res = await fetch('/api/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goal.trim(), selectedPlan: plan }),
      })
      if (!res.ok) {
        const response = await res.json()
        throw new Error(response.error || '服务异常')
      }
      const data = (await res.json()) as JourneyAnalysisResponse & { journey: { id: string } }
      setPathData(data.journey.pathData)
      setJourneyId(data.journey.id)
      setStepStatuses(data.journey.pathData.stepStatuses ?? [])
      setPhase('path_view')
      toast.success('路径分析完成')

      fetch('/api/journey?limit=50')
        .then((response) => response.json())
        .then((payload) => {
          setAllJourneys((payload.journeys as RawJourney[]).map((journey) => ({
            id: journey.id,
            goal: journey.goal,
            createdAt: journey.createdAt,
            pathData: journey.pathData as JourneyPathData | null,
          })))
        })
        .catch(() => {})
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知错误'
      setError(message)
      toast.error(message)
      setPhase('plan_selection')
    }
  }, [goal])

  const handleLoadJourney = useCallback((journey: JourneySummary) => {
    if (!journey.pathData) return
    setGoal(journey.goal)
    setSelectedPlan(journey.pathData.selectedPlan ?? null)
    setPathData(journey.pathData)
    setJourneyId(journey.id)
    setStepStatuses(journey.pathData.stepStatuses ?? [])
    setPhase('path_view')
    setError(null)
    setPathViewTab('routes')
  }, [])

  const handleStepUpdate = useCallback((updated: StepStatus) => {
    setStepStatuses((current) => {
      const index = current.findIndex((item) => item.contactId === updated.contactId)
      return index >= 0 ? current.map((item, i) => (i === index ? updated : item)) : [...current, updated]
    })

    setAllJourneys((current) =>
      current.map((journey) => {
        if (journey.id !== journeyId || !journey.pathData) return journey
        const statuses = journey.pathData.stepStatuses ?? []
        const index = statuses.findIndex((item) => item.contactId === updated.contactId)
        const nextStatuses =
          index >= 0 ? statuses.map((item, i) => (i === index ? updated : item)) : [...statuses, updated]
        return { ...journey, pathData: { ...journey.pathData, stepStatuses: nextStatuses } }
      })
    )
  }, [journeyId])

  const visibleJourneys = allJourneys.filter((journey) => !deletedIds.has(journey.id))
  const deletedJourneys = allJourneys.filter((journey) => deletedIds.has(journey.id))

  const filteredJourneys = visibleJourneys.filter((journey) => {
    const status = deriveGoalStatus(journey)
    if (historyTab === 'active') return status === 'active' || status === 'stalled'
    if (historyTab === 'completed') return status === 'completed'
    return true
  })

  const allRoutes = pathData
    ? [
        {
          key: 'primary',
          label: ROUTE_LABELS[0],
          badge: ROUTE_BADGES[0],
          steps: pathData.primaryPath,
          score: pathData.overallConfidence,
          rationale: pathData.overallStrategy,
        },
        ...pathData.alternativePaths.slice(0, 2).map((alt, index) => ({
          key: `alt-${index}`,
          label: alt.categoryLabel || ROUTE_LABELS[index + 1] || `备选 ${index + 1}`,
          badge: ROUTE_BADGES[index + 1] || `${index + 1}`,
          steps: alt.steps,
          score: alt.score,
          rationale: alt.rationale,
        })),
      ]
    : []

  const phaseLabel: Record<UIPhase, string> = {
    idle: '分析画布',
    decomposing: '拆解中',
    plan_selection: '选方案',
    analyzing: '分析中',
    path_view: '目标路径',
  }

  const expansionProfiles = (() => {
    if (!pathData) return []

    const merged = [
      ...(pathData.networkExpansion ?? []).map((item) => ({
        persona: `${item.industry}方向关键人物`,
        companyLevel: `${item.companyProfile} · ${item.level}`,
        reason: item.reason,
        howToExpand: '优先从现有关系链中寻找同圈层连接，再通过一次价值交换请求引荐。',
      })),
      ...pathData.missingNodes.map((node) => ({
        persona: node.roleName,
        companyLevel: `目标公司与职位层级建议：${node.howToFind}`,
        reason: node.whyNeeded,
        howToExpand: node.howToFind,
      })),
    ]

    const unique = merged.filter((item, index) => merged.findIndex((other) => other.persona === item.persona) === index)
    return unique.slice(0, 3)
  })()

  return (
    <div className="min-h-full bg-[#f6f6f4] lg:h-[100dvh] lg:overflow-hidden" style={{ fontFamily: `'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif` }}>
      <div className="flex min-h-screen w-full min-w-0 flex-col px-4 py-3 sm:px-5 lg:h-[100dvh] lg:min-h-0 lg:overflow-hidden lg:px-6 lg:py-3 xl:px-8">
        <PageHeader
          items={[
            { label: '首页', href: '/dashboard' },
            { label: '目标分析' },
          ]}
          title="目标分析"
          summary="把目标拆成真正能执行的人脉路径，并持续追踪每一步推进状态。"
          className="pb-3 lg:pb-3"
          hints={[
            '先输入目标，再让 AI 拆成可推进的人脉路径。',
            '历史列表会保留已分析过的目标，方便继续推进。',
            '路径里的步骤状态、联系进度和恢复逻辑保持不变。',
          ]}
        />

        <div className="mt-1 flex min-h-0 flex-1 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
            <aside className="flex min-h-0 w-full shrink-0 flex-col border-b border-gray-200 bg-[#fcfcfb] xl:w-[220px] xl:border-b-0 xl:border-r 2xl:w-[236px]">
              <div className="shrink-0 border-b border-gray-200 px-4 py-3">
                <div className="mb-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-gray-400">History</p>
                  <h2 className="mt-1 text-base font-semibold text-gray-900">目标列表</h2>
                </div>

                <div className="flex items-center rounded-xl border border-gray-200 bg-white p-0.5">
                  {(['all', 'active', 'completed'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setHistoryTab(tab)}
                      className={`flex-1 whitespace-nowrap rounded-lg px-1.5 py-1 text-[11px] font-medium transition ${
                        historyTab === tab ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {{ all: '全部', active: '进行中', completed: '已完成' }[tab]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-0 flex-1">
                {historyLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <LottieLoader className="h-10 w-10" />
                  </div>
                ) : (
                  <GoalList
                    journeys={filteredJourneys}
                    activeId={journeyId}
                    onSelect={handleLoadJourney}
                    onNew={handleReset}
                    onDelete={handleDelete}
                    deletedJourneys={deletedJourneys}
                    onRestore={handleRestore}
                  />
                )}
              </div>
            </aside>

            <main className="flex min-w-0 flex-1 flex-col bg-[#f8f8f6]">
              <div className="border-b border-gray-200 bg-[#fafaf9] px-6 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-gray-400">Canvas</p>
                    <p className="mt-1 text-sm text-gray-600">{phaseLabel[phase]}</p>
                  </div>
                  {phase === 'path_view' ? (
                    <div className="flex items-center rounded-2xl border border-gray-200 bg-white p-1">
                      <button
                        onClick={() => setPathViewTab('routes')}
                        className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${pathViewTab === 'routes' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800'}`}
                      >
                        路径页
                      </button>
                      <button
                        onClick={() => setPathViewTab('network')}
                        className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${pathViewTab === 'network' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800'}`}
                      >
                        扩展页
                      </button>
                    </div>
                  ) : phase !== 'idle' && (
                    <button
                      onClick={handleReset}
                      className="inline-flex items-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                    >
                      新建目标
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {phase === 'idle' && (
                    <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full px-4 py-4 sm:px-5 sm:py-5">
                      <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
                        <div className="flex min-h-0 flex-col rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:p-7 xl:row-span-2">
                          <div className="mb-5 space-y-2.5">
                            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-gray-400">New Goal</p>
                            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">先把目标说清楚，再让 AI 拆成路径</h2>
                            <p className="text-sm leading-7 text-gray-500">描述你想达成的连接、岗位、融资或行业切入目标。现有流程会先拆出 3 套策略，再进入路径分析。</p>
                          </div>

                          <textarea
                            ref={textareaRef}
                            className="min-h-[12rem] flex-1 rounded-[24px] border border-gray-200 bg-[#fcfcfb] px-5 py-4 text-sm leading-7 text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                            placeholder="例如：我想在 3 个月内认识 3 位 A 轮投资人，推进天使轮融资。"
                            value={goal}
                            onChange={(event) => setGoal(event.target.value)}
                            onKeyDown={(event) => event.key === 'Enter' && event.metaKey && handleDecompose()}
                          />

                          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs text-gray-400">按 `⌘/Ctrl + Enter` 可直接开始拆解</p>
                            <button
                              disabled={!goal.trim()}
                              onClick={handleDecompose}
                              className="inline-flex items-center rounded-2xl bg-[#A04F47] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#A04F47]/90 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              开始 AI 拆解
                            </button>
                          </div>

                          {error && <p className="mt-4 text-sm text-gray-500">{error}</p>}
                        </div>

                        <div className="grid min-h-0 gap-4">
                          <div className="flex min-h-0 flex-col rounded-[28px] border border-gray-200 bg-white p-6 lg:p-7">
                            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-gray-400">Quick Start</p>
                            <h3 className="mt-2 text-lg font-semibold text-gray-900">可以直接从这些目标开始</h3>
                            <p className="mt-2 text-xs text-gray-500">
                              {quickStartLoading
                                ? '正在根据“我”页面核心目标生成拆解问题...'
                                : quickStartFromCoreGoal
                                  ? '已按“我”页面核心目标生成'
                                  : '未填写核心目标时显示默认问题'}
                            </p>
                            <div className="mt-4 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
                              {quickStartGoals.map((example) => (
                                <button
                                  key={example}
                                  onClick={() => setGoal(example)}
                                  className="w-full rounded-2xl border border-gray-200 bg-[#fcfcfb] px-4 py-3 text-left text-sm text-gray-600 transition hover:border-gray-400 hover:bg-gray-50"
                                >
                                  {example}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex min-h-0 flex-col rounded-[28px] border border-gray-200 bg-white p-6 lg:p-7">
                            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-gray-400">Flow</p>
                            <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                              {[
                                '先拆解目标，生成多套推进策略',
                                '再从现有人脉里选出更可行的路径',
                                '最后按步骤记录联系进度和反馈',
                              ].map((item, index) => (
                                <div key={item} className="flex items-start gap-3">
                                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[11px] font-medium text-white">
                                    {index + 1}
                                  </span>
                                  <p className="text-sm leading-6 text-gray-600">{item}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {phase === 'decomposing' && (
                    <motion.div key="decomposing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-8 py-10">
                      <div className="mx-auto max-w-2xl rounded-[28px] border border-gray-200 bg-white p-10 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        <LottieLoader className="mx-auto h-16 w-16" />
                        <p className="mt-5 text-xl font-semibold text-gray-900">正在拆解目标</p>
                        <p className="mt-2 text-sm leading-7 text-gray-500">先把目标拆成几种不同打法，下一步再选择更适合你的推进路径。</p>
                      </div>
                    </motion.div>
                  )}

                  {phase === 'plan_selection' && (
                    <motion.div key="plan_selection" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="px-8 py-7">
                      <div className="mx-auto max-w-6xl">
                        <div className="mb-6 rounded-[28px] border border-gray-200 bg-white px-6 py-6">
                          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-gray-400">Current Goal</p>
                          <p className="mt-2 text-xl font-semibold tracking-tight text-gray-900">{goal}</p>
                          <p className="mt-2 text-sm leading-7 text-gray-500">下面是拆出的候选方案。点击任一方案，会继续执行现有的人脉路径分析流程。</p>
                        </div>

                        <div className="grid gap-5 xl:grid-cols-3">
                          {decomposePlans.map((plan) => (
                            <PlanCard key={plan.id} plan={plan} isSelected={selectedPlan?.id === plan.id} onSelect={() => handleSelectPlan(plan)} />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {phase === 'analyzing' && (
                    <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-8 py-10">
                      <div className="mx-auto max-w-2xl rounded-[28px] border border-gray-200 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                        {selectedPlan && (
                          <div className="mb-6 rounded-2xl border border-gray-200 bg-[#fafaf9] px-4 py-4">
                            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-gray-400">方案 {selectedPlan.id}</p>
                            <p className="mt-2 text-base font-semibold text-gray-900">{selectedPlan.title}</p>
                            <p className="mt-1 text-sm leading-6 text-gray-500">{selectedPlan.summary}</p>
                          </div>
                        )}

                        <div className="space-y-4">
                          {LOADING_STEPS.map((step, index) => {
                            const currentIndex = ['idle', 'step1', 'step2', 'step3', 'step4'].indexOf(loadingStep)
                            const active = currentIndex >= index
                            const current = loadingStep === step.key
                            return (
                              <div key={step.key} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-[#fcfcfb] px-4 py-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                                  active ? current ? 'scale-105 bg-gray-900 text-white' : 'bg-gray-100 text-gray-700' : 'bg-gray-50 text-gray-300'
                                }`}>
                                  {active && !current ? 'OK' : step.emoji}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-sm font-medium ${active ? 'text-gray-800' : 'text-gray-300'}`}>{step.label}</p>
                                </div>
                                {current && <LottieLoader className="h-5 w-5" />}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {phase === 'path_view' && pathData && (
                    <motion.div
                      key="path_view"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="h-full p-4 sm:p-5"
                    >
                      <div className="flex h-full min-h-0 flex-col">
                        {pathViewTab === 'routes' ? (
                          <section className="flex min-h-0 flex-1 flex-col rounded-[22px] border border-gray-200 bg-white p-4 sm:p-5">
                            <div className="mb-3 shrink-0">
                              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">Routes</p>
                              <h3 className="mt-1 text-base font-semibold text-gray-900">路径规划</h3>
                            </div>
                            <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto pr-1 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch] lg:grid-cols-3">
                              {allRoutes.map((route) => (
                                <RouteCard key={route.key} route={route} stepStatuses={stepStatuses} journeyId={journeyId} onUpdate={handleStepUpdate} />
                              ))}
                            </div>
                          </section>
                        ) : (
                          <section className="flex min-h-0 flex-1 flex-col rounded-[22px] border border-gray-200 bg-white p-4 sm:p-5">
                            <div className="mb-3 shrink-0">
                              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">Expansion</p>
                              <h3 className="mt-1 text-base font-semibold text-gray-900">扩展人脉建议</h3>
                              <p className="mt-1 text-xs text-gray-500">实现目标过程中优先补齐的 3 位关键人物画像。</p>
                            </div>
                            <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto pr-1 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch] sm:grid-cols-2 xl:grid-cols-3">
                              {expansionProfiles.length > 0 ? (
                                expansionProfiles.map((item) => (
                                  <ExpansionPersonaTile key={item.persona} item={item} />
                                ))
                              ) : (
                                <div className="col-span-full flex h-full min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-gray-200 text-xs text-gray-400">
                                  暂无扩展建议
                                </div>
                              )}
                            </div>
                          </section>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
