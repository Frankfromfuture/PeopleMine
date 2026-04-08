'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useLoading } from '@/components/ThinkingToast'
import PeopleUniverseView from './PeopleUniverseView'
import {
  NetworkContact,
  NetworkRelation,
  ROLE_COLOR,
  CHANNEL_ICON,
} from './JourneyGraph'
import {
  JourneyPathData,
  JourneyAnalysisResponse,
  PathStep,
  AlternativePath,
  StepStatus,
  StepExecutionStatus,
} from '@/lib/journey/types'
import { InteractionType, INTERACTION_TYPE_LABELS } from '@/types'

// ─── 加载步骤 ──────────────────────────────────────────────────────────────────

const LOADING_STEPS = [
  { key: 'step1', label: '读取人脉数据', emoji: '📊' },
  { key: 'step2', label: '计算节点评分', emoji: '🎯' },
  { key: 'step3', label: '规划候选路径', emoji: '🗺️' },
  { key: 'step4', label: 'AI 深度分析中', emoji: '🧠' },
]

type LoadingStep = 'idle' | 'step1' | 'step2' | 'step3' | 'step4'

// ─── 步骤状态 UI ───────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<StepExecutionStatus, string> = {
  pending: '待联系',
  in_progress: '联系中',
  done: '✓ 完成',
  skipped: '已跳过',
  failed: '未回应',
}

const STATUS_STYLE: Record<StepExecutionStatus, string> = {
  pending: 'bg-gray-100 text-gray-500 border-gray-200',
  in_progress: 'bg-blue-50 text-blue-600 border-blue-200',
  done: 'bg-green-50 text-green-700 border-green-200',
  skipped: 'bg-gray-50 text-gray-400 border-gray-100',
  failed: 'bg-red-50 text-red-500 border-red-200',
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
  onUpdate: (s: StepStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [note, setNote] = useState('')
  const [interactionType, setInteractionType] = useState<InteractionType>('MEETING')
  const current = stepStatus?.status ?? 'pending'

  const handleQuick = async (status: StepExecutionStatus) => {
    if (!journeyId) return
    if (status === 'done') { setOpen(true); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/journey/${journeyId}/steps`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, status }),
      })
      if (!res.ok) throw new Error('更新失败')
      const data = await res.json()
      const updated = (data.stepStatuses as StepStatus[]).find(s => s.contactId === contactId)
      if (updated) onUpdate(updated)
    } catch { toast.error('状态更新失败') }
    setSubmitting(false)
  }

  const handleDone = async () => {
    if (!journeyId) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/journey/${journeyId}/steps`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, status: 'done', note: note || null, interactionType }),
      })
      if (!res.ok) throw new Error('更新失败')
      const data = await res.json()
      const updated = (data.stepStatuses as StepStatus[]).find(s => s.contactId === contactId)
      if (updated) onUpdate(updated)
      setOpen(false)
      setNote('')
      toast.success('步骤已完成并记录互动')
    } catch { toast.error('状态更新失败') }
    setSubmitting(false)
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-1 mt-1.5">
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${STATUS_STYLE[current]}`}>
          {STATUS_LABEL[current]}
        </span>
        {journeyId && current !== 'done' && (
          <div className="flex items-center gap-0.5">
            {current !== 'in_progress' && (
              <button
                disabled={submitting}
                onClick={() => handleQuick('in_progress')}
                className="text-[9px] px-1 py-0.5 rounded border border-blue-200 text-blue-500 hover:bg-blue-50 disabled:opacity-50"
              >
                联系中
              </button>
            )}
            <button
              disabled={submitting}
              onClick={() => handleQuick('done')}
              className="text-[9px] px-1 py-0.5 rounded border border-green-200 text-green-600 hover:bg-green-50 disabled:opacity-50"
            >
              完成
            </button>
            {current !== 'skipped' && (
              <button
                disabled={submitting}
                onClick={() => handleQuick('skipped')}
                className="text-[9px] px-1 py-0.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-50"
              >
                跳过
              </button>
            )}
          </div>
        )}
      </div>

      {/* 完成表单 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-56 space-y-2"
          >
            <p className="text-xs font-semibold text-gray-800">记录互动</p>
            <select
              value={interactionType}
              onChange={(e) => setInteractionType(e.target.value as InteractionType)}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none"
            >
              {(Object.keys(INTERACTION_TYPE_LABELS) as InteractionType[]).map(k => (
                <option key={k} value={k}>{INTERACTION_TYPE_LABELS[k]}</option>
              ))}
            </select>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="备注（可选）"
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none"
            />
            <div className="flex gap-1.5">
              <button
                disabled={submitting}
                onClick={handleDone}
                className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg py-1.5 font-medium disabled:opacity-50"
              >
                {submitting ? '保存…' : '确认完成'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-2 text-xs border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50"
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

// ─── 航路卡片 ──────────────────────────────────────────────────────────────────

function RouteCard({
  title,
  badge,
  steps,
  score,
  rationale,
  isActive,
  onClick,
  journeyId,
  stepStatuses,
  onStepUpdate,
}: {
  title: string
  badge: string
  steps: PathStep[]
  score: number
  rationale?: string
  isActive: boolean
  onClick: () => void
  journeyId: string | null
  stepStatuses: StepStatus[]
  onStepUpdate: (s: StepStatus) => void
}) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null)

  return (
    <motion.div
      layout
      className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
        isActive
          ? 'border-gray-400 bg-gray-50 shadow-md'
          : 'border-line-standard bg-app-strong hover:border-gray-300 hover:shadow-sm'
      }`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.995 }}
      onClick={onClick}
    >
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-text-primary">{title}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isActive ? 'bg-gray-400 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {badge}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-500 rounded-full"
              style={{ width: `${score * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-700">
            {(score * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* 策略简述 */}
      {rationale && (
        <p className="text-xs text-gray-600 mb-3 leading-relaxed">{rationale}</p>
      )}

      {/* 路径节点序列 */}
      <div className="flex items-center gap-1 flex-wrap">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800 text-white text-xs font-bold shrink-0">
          你
        </div>
        {steps.map((step, i) => {
          const nodeColors = Object.values(ROLE_COLOR)[i % 6]
          const stepStatus = stepStatuses.find(s => s.contactId === step.contactId)
          const isDone = stepStatus?.status === 'done'
          return (
            <React.Fragment key={step.contactId}>
              <svg width="16" height="10" className="text-gray-400 shrink-0">
                <path d="M0 5 L12 5 M8 1 L14 5 L8 9" stroke="#6b7280" strokeWidth="1.5" fill="none" />
              </svg>
              <div className="shrink-0">
                <button
                  className={`flex items-center justify-center px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    expandedStep === i ? 'ring-2 ring-gray-400' : 'hover:opacity-90'
                  } ${isDone ? 'opacity-60' : ''}`}
                  style={{
                    backgroundColor: nodeColors.bg,
                    borderColor: nodeColors.border,
                    color: nodeColors.text,
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedStep(expandedStep === i ? null : i)
                  }}
                >
                  {isDone ? '✓ ' : ''}{step.contactName}
                </button>
                {/* 低置信度警告 */}
                {step.confidenceAtThisStep < 0.5 && (
                  <div className="text-[9px] text-amber-500 font-medium mt-0.5">⚠️ 需要预热</div>
                )}
                <StepStatusBadge
                  contactId={step.contactId}
                  stepStatus={stepStatus}
                  journeyId={journeyId}
                  onUpdate={onStepUpdate}
                />
              </div>
            </React.Fragment>
          )
        })}
      </div>

      {/* 展开的攻略 */}
      {expandedStep !== null && steps[expandedStep] && (
        <div
          className="mt-3 rounded-lg bg-app-strong border border-line-standard p-3 text-xs space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="font-semibold text-gray-800">
            {steps[expandedStep].contactName} 的攻略
            <span className="ml-2 text-text-subtle font-normal">
              置信度 {(steps[expandedStep].confidenceAtThisStep * 100).toFixed(0)}%
            </span>
          </div>
          <div>
            <span className="text-text-secondary">开场白：</span>
            <span className="text-gray-700">「{steps[expandedStep].communicationAdvice.openingLine}」</span>
          </div>
          <div>
            <span className="text-text-secondary">核心诉求：</span>
            <span className="text-gray-700">{steps[expandedStep].communicationAdvice.keyMessage}</span>
          </div>
          <div>
            <span className="text-text-secondary">时机：</span>
            <span className="text-gray-700">{steps[expandedStep].communicationAdvice.timing}</span>
          </div>
          {steps[expandedStep].communicationAdvice.caution && (
            <div className="bg-amber-50 border border-amber-200 rounded p-2">
              <span className="text-amber-700">⚠️ {steps[expandedStep].communicationAdvice.caution}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-text-secondary">
            <span>推荐渠道：</span>
            <span className="font-medium text-gray-700">
              {CHANNEL_ICON[steps[expandedStep].communicationAdvice.channelSuggestion]}{' '}
              {steps[expandedStep].communicationAdvice.channelSuggestion}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ─── 主页面 ────────────────────────────────────────────────────────────────────

export default function JourneyPage() {
  const { showLoading, hideLoading } = useLoading()
  const [contacts, setContacts] = useState<NetworkContact[]>([])
  const [relations, setRelations] = useState<NetworkRelation[]>([])
  const [pathData, setPathData] = useState<JourneyPathData | null>(null)
  const [journeyId, setJourneyId] = useState<string | null>(null)
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>([])
  const [activeRouteIndex, setActiveRouteIndex] = useState(0)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [goal, setGoal] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('idle')
  const [error, setError] = useState<string | null>(null)
  const [networkLoading, setNetworkLoading] = useState(true)

  // 加载全量网络
  useEffect(() => {
    showLoading()
    fetch('/api/network')
      .then((r) => r.json())
      .then((data) => {
        setContacts(data.contacts || [])
        setRelations(data.relations || [])
      })
      .catch(console.error)
      .finally(() => { setNetworkLoading(false); hideLoading() })
  }, [showLoading, hideLoading])

  // 加载动画
  useEffect(() => {
    if (!isLoading) return
    const timers = [
      setTimeout(() => setLoadingStep('step1'), 0),
      setTimeout(() => setLoadingStep('step2'), 800),
      setTimeout(() => setLoadingStep('step3'), 1600),
      setTimeout(() => setLoadingStep('step4'), 2400),
    ]
    return () => timers.forEach(clearTimeout)
  }, [isLoading])

  const handleAnalyze = useCallback(async () => {
    if (!goal.trim() || isLoading) return
    setIsLoading(true)
    setError(null)
    setPathData(null)
    setJourneyId(null)
    setStepStatuses([])
    setActiveRouteIndex(0)
    setSelectedNodeId(null)
    showLoading()

    try {
      const res = await fetch('/api/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goal.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `服务器错误 ${res.status}`)
      }
      const data = (await res.json()) as JourneyAnalysisResponse & { journey: { id: string } }
      setPathData(data.journey.pathData)
      setJourneyId(data.journey.id)
      setStepStatuses(data.journey.pathData.stepStatuses ?? [])
      toast.success('航程分析已完成')
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知错误'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
      setLoadingStep('idle')
      hideLoading()
    }
  }, [goal, isLoading, showLoading, hideLoading])

  const handleStepUpdate = useCallback((updated: StepStatus) => {
    setStepStatuses(prev => {
      const idx = prev.findIndex(s => s.contactId === updated.contactId)
      return idx >= 0
        ? prev.map((s, i) => i === idx ? updated : s)
        : [...prev, updated]
    })
  }, [])

  // 所有航路（主 + 备选，最多3条）
  const allRoutes = pathData
    ? [
        {
          title: '最优航路',
          badge: '★ 首选',
          steps: pathData.primaryPath,
          score: pathData.overallConfidence,
          rationale: pathData.overallStrategy,
        },
        ...pathData.alternativePaths.slice(0, 2).map((alt: AlternativePath, i) => ({
          title: `备选航路 ${i + 2}`,
          badge: `备选`,
          steps: alt.steps,
          score: alt.score,
          rationale: alt.rationale,
        })),
      ]
    : []

  // 进度摘要
  const primaryDone = pathData
    ? stepStatuses.filter(s =>
        s.status === 'done' && pathData.primaryPath.some(p => p.contactId === s.contactId)
      ).length
    : 0
  const primaryTotal = pathData?.primaryPath.length ?? 0

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ── 顶部工具栏 ── */}
      <div className="shrink-0 px-5 py-3 bg-app-strong border-b border-line-standard flex items-center gap-3">
        <h1 className="text-lg font-bold text-text-primary shrink-0">人脉宇宙</h1>

        <div className="flex-1 flex items-center gap-2 max-w-2xl">
          <input
            className="flex-1 h-9 px-3 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            placeholder="输入目标，例如：我想认识 A 轮投资人，推进融资…"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            disabled={isLoading}
          />
          <button
            className="h-9 px-4 rounded-lg bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0"
            onClick={handleAnalyze}
            disabled={isLoading || !goal.trim()}
          >
            {isLoading ? '分析中…' : '开始分析'}
          </button>
          {pathData && (
            <button
              className="h-9 px-3 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 transition shrink-0"
              onClick={() => { setPathData(null); setJourneyId(null); setStepStatuses([]); setGoal(''); setError(null) }}
            >
              清除
            </button>
          )}
        </div>

        <div className="ml-auto shrink-0 text-xs text-text-subtle">
          {contacts.length} 位联系人
        </div>
      </div>

      {/* ── 主体 ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* 人脉视图 */}
        <div className="flex-1 relative min-w-0">
          {networkLoading ? (
            <div className="flex items-center justify-center h-full text-text-subtle">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full border-2 border-gray-500 border-t-transparent animate-spin mx-auto mb-3" />
                <p className="text-sm">加载人脉网络…</p>
              </div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex items-center justify-center h-full text-text-subtle">
              <div className="text-center">
                <div className="text-4xl mb-3">👥</div>
                <p className="text-sm font-medium text-gray-600">还没有联系人</p>
                <p className="text-xs text-text-subtle mt-1">先去「人脉数据库」添加几位联系人吧</p>
              </div>
            </div>
          ) : (
            <PeopleUniverseView
              contacts={contacts}
              relations={relations}
            />
          )}

          {/* 加载遮罩 */}
          {isLoading && (
            <div className="absolute inset-0 bg-app-strong/80 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="bg-app-strong rounded-2xl shadow-xl border border-line-standard p-8 w-72">
                <div className="space-y-4">
                  {LOADING_STEPS.map((step, i) => {
                    const stepIndex = ['idle', 'step1', 'step2', 'step3', 'step4'].indexOf(loadingStep)
                    const isActive = stepIndex >= i
                    const isCurrent = loadingStep === step.key
                    return (
                      <div key={step.key} className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-bold transition-all ${
                            isActive
                              ? isCurrent
                                ? 'bg-gray-600 text-white scale-110'
                                : 'bg-gray-100 text-gray-700'
                              : 'bg-gray-100 text-text-subtle'
                          }`}
                        >
                          {isActive && !isCurrent ? '✓' : step.emoji}
                        </div>
                        <span className={`text-sm ${isActive ? 'text-text-primary font-medium' : 'text-text-subtle'}`}>
                          {step.label}
                        </span>
                        {isCurrent && (
                          <div className="ml-auto w-4 h-4 rounded-full border-2 border-gray-500 border-t-transparent animate-spin" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 右侧面板 ── */}
        {(pathData || error) && (
          <div className="w-[360px] shrink-0 border-l border-line-standard bg-app-strong overflow-y-auto flex flex-col">
            {/* 错误 */}
            {error && (
              <div className="m-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-sm text-gray-700 font-medium">分析失败</p>
                <p className="text-xs text-gray-600 mt-1">{error}</p>
                <button
                  className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => setError(null)}
                >
                  关闭
                </button>
              </div>
            )}

            {/* 航路卡片 */}
            {pathData && (
              <div className="p-4 space-y-3">
                {/* ARC 摘要 */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <h3 className="text-xs font-semibold text-gray-800 mb-2">ARC 分析摘要</h3>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg border border-gray-200 bg-app-strong p-2">
                      <p className="text-gray-500">平均 ARC</p>
                      <p className="text-gray-800 font-bold mt-0.5">
                        {(((pathData.meta.averageArcScore ?? 0) * 100).toFixed(0))}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-app-strong p-2">
                      <p className="text-gray-500">ARC 覆盖率</p>
                      <p className="text-gray-800 font-bold mt-0.5">
                        {(((pathData.meta.arcCoverage ?? 0) * 100).toFixed(0))}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-app-strong p-2">
                      <p className="text-gray-500">已分析节点</p>
                      <p className="text-gray-800 font-bold mt-0.5">
                        {pathData.meta.analyzedContacts}
                      </p>
                    </div>
                  </div>
                  {pathData.meta.topArcArchetypes && pathData.meta.topArcArchetypes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {pathData.meta.topArcArchetypes.map((item) => (
                        <span key={item.name} className="px-2 py-0.5 rounded-full text-[11px] border border-gray-200 bg-app-strong text-gray-700">
                          {item.name} · {item.count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 进度条 */}
                {primaryTotal > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-gray-700">主路径进度</span>
                      <span className="text-xs text-gray-500">{primaryDone} / {primaryTotal} 步</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-green-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(primaryDone / primaryTotal) * 100}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-text-primary text-sm">🧭 航路方案</h2>
                  <span className="text-xs text-text-subtle">{allRoutes.length} 条</span>
                </div>

                {allRoutes.map((route, i) => (
                  <RouteCard
                    key={i}
                    title={route.title}
                    badge={route.badge}
                    steps={route.steps}
                    score={route.score}
                    rationale={route.rationale}
                    isActive={activeRouteIndex === i}
                    onClick={() => setActiveRouteIndex(i)}
                    journeyId={journeyId}
                    stepStatuses={stepStatuses}
                    onStepUpdate={handleStepUpdate}
                  />
                ))}

                {/* 缺失节点 */}
                {pathData.missingNodes.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mt-2">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2">⚠️ 缺少关键人脉</h3>
                    <div className="space-y-3">
                      {pathData.missingNodes.map((m) => (
                        <div key={m.missingRole}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span
                              className="text-xs px-1.5 py-0.5 rounded font-medium"
                              style={{
                                backgroundColor: ROLE_COLOR[m.missingRole]?.bg || '#f3f4f6',
                                color: ROLE_COLOR[m.missingRole]?.text || '#374151',
                                border: `1px solid ${ROLE_COLOR[m.missingRole]?.border || '#9ca3af'}`,
                              }}
                            >
                              {m.roleName}
                            </span>
                          </div>
                          <p className="text-xs text-gray-800">{m.whyNeeded}</p>
                          <p className="text-xs text-gray-700 mt-1">💡 {m.howToFind}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
