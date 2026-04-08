'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { JourneyPathData, PathStep, StepStatus, StepExecutionStatus } from '@/lib/journey/types'
import { InteractionType, INTERACTION_TYPE_LABELS } from '@/types'

const STATUS_LABEL: Record<StepExecutionStatus, string> = {
  pending:     '待联系',
  in_progress: '联系中',
  done:        '已完成',
  skipped:     '已跳过',
  failed:      '未回应',
}

const CHANNEL_LABEL: Record<string, string> = {
  wechat:  '微信',
  call:    '电话',
  meeting: '当面',
  email:   '邮件',
  event:   '活动',
}

function DoneForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (type: InteractionType, note: string) => Promise<void>
  onCancel: () => void
}) {
  const [type, setType] = useState<InteractionType>('MEETING')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    await onSubmit(type, note)
    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl space-y-2">
        <p className="text-xs font-semibold text-green-800">记录互动方式</p>
        <select
          value={type}
          onChange={e => setType(e.target.value as InteractionType)}
          className="w-full text-xs border border-green-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
        >
          {(Object.keys(INTERACTION_TYPE_LABELS) as InteractionType[]).map(k => (
            <option key={k} value={k}>{INTERACTION_TYPE_LABELS[k]}</option>
          ))}
        </select>
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="备注（可选）"
          className="w-full text-xs border border-green-200 rounded-lg px-2 py-1.5 focus:outline-none"
        />
        <div className="flex gap-1.5">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg py-1.5 font-medium disabled:opacity-50"
          >
            {loading ? '保存中…' : '确认完成'}
          </button>
          <button onClick={onCancel} className="px-3 text-xs border border-green-200 rounded-lg text-green-700 hover:bg-green-100">
            取消
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function StepItem({
  step,
  index,
  isLast,
  stepStatus,
  journeyId,
  onUpdate,
}: {
  step: PathStep
  index: number
  isLast: boolean
  stepStatus: StepStatus | undefined
  journeyId: string
  onUpdate: (s: StepStatus) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showDoneForm, setShowDoneForm] = useState(false)

  const status = stepStatus?.status ?? 'pending'
  const isDone = status === 'done'
  const isWarm = step.confidenceAtThisStep < 0.5

  const patchStatus = async (newStatus: StepExecutionStatus, type?: InteractionType, note?: string) => {
    const res = await fetch(`/api/journey/${journeyId}/steps`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactId: step.contactId,
        status: newStatus,
        note: note ?? null,
        interactionType: type ?? null,
      }),
    })
    if (!res.ok) throw new Error('更新失败')
    const data = await res.json()
    const updated = (data.stepStatuses as StepStatus[]).find(s => s.contactId === step.contactId)
    if (updated) onUpdate(updated)
  }

  const handleAction = async (action: 'in_progress' | 'skipped' | 'failed') => {
    try { await patchStatus(action) }
    catch { toast.error('操作失败') }
  }

  const handleDone = async (type: InteractionType, note: string) => {
    try {
      await patchStatus('done', type, note)
      setShowDoneForm(false)
      toast.success(`${step.contactName} 步骤完成`)
    } catch {
      toast.error('操作失败')
    }
  }

  const circleStyle = isDone
    ? 'bg-green-500 text-white border-green-500'
    : status === 'in_progress'
      ? 'bg-blue-500 text-white border-blue-500 animate-pulse'
      : 'bg-white text-gray-500 border-gray-300'

  return (
    <div className="flex gap-3">
      {/* 步骤线 */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${circleStyle}`}>
          {isDone ? '✓' : index + 1}
        </div>
        {!isLast && <div className="w-px flex-1 bg-gray-200 mt-1" />}
      </div>

      {/* 内容 */}
      <div className={`pb-6 flex-1 min-w-0 ${isLast ? '' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-sm font-semibold ${isDone ? 'text-gray-400 line-through' : 'text-text-primary'}`}>
                {step.contactName}
              </span>
              {isWarm && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 font-medium">
                  ⚠️ 需预热
                </span>
              )}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {STATUS_LABEL[status]}
              </span>
            </div>
            {/* 开场白 */}
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              {step.communicationAdvice.openingLine}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-gray-400">
                {CHANNEL_LABEL[step.communicationAdvice.channelSuggestion] ?? step.communicationAdvice.channelSuggestion}
              </span>
              <span className="text-[10px] text-gray-400">
                置信度 {(step.confidenceAtThisStep * 100).toFixed(0)}%
              </span>
              {stepStatus?.note && (
                <span className="text-[10px] text-gray-500 italic">备注：{stepStatus.note}</span>
              )}
            </div>
          </div>

          {/* 展开按钮 */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 text-[10px] text-gray-400 hover:text-gray-600 border border-gray-200 rounded px-1.5 py-0.5"
          >
            {expanded ? '收起' : '查看建议'}
          </button>
        </div>

        {/* 展开的完整攻略 */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs space-y-1.5">
                <div>
                  <span className="text-gray-400">核心诉求：</span>
                  <span className="text-gray-700">{step.communicationAdvice.keyMessage}</span>
                </div>
                <div>
                  <span className="text-gray-400">最佳时机：</span>
                  <span className="text-gray-700">{step.communicationAdvice.timing}</span>
                </div>
                {step.communicationAdvice.caution && (
                  <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
                    ⚠️ {step.communicationAdvice.caution}
                  </div>
                )}
                {step.introductionViaName && (
                  <div className="text-gray-500">通过 <span className="font-medium text-gray-700">{step.introductionViaName}</span> 介绍</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 操作按钮 */}
        {!isDone && status !== 'skipped' && (
          <div className="flex items-center gap-1.5 mt-2">
            {status === 'pending' && (
              <button
                onClick={() => handleAction('in_progress')}
                className="text-[10px] px-2 py-1 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition"
              >
                开始联系
              </button>
            )}
            <button
              onClick={() => setShowDoneForm(!showDoneForm)}
              className="text-[10px] px-2 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition font-medium"
            >
              标记完成
            </button>
            <button
              onClick={() => handleAction('skipped')}
              className="text-[10px] px-2 py-1 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition"
            >
              跳过
            </button>
          </div>
        )}

        <AnimatePresence>
          {showDoneForm && (
            <DoneForm
              onSubmit={handleDone}
              onCancel={() => setShowDoneForm(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function GoalStepTracker({
  journeyId,
  pathData,
  stepStatuses,
  onStepUpdate,
}: {
  journeyId: string
  pathData: JourneyPathData
  stepStatuses: StepStatus[]
  onStepUpdate: (s: StepStatus) => void
}) {
  const steps = pathData.primaryPath
  const done = stepStatuses.filter(
    s => s.status === 'done' && steps.some(p => p.contactId === s.contactId)
  ).length

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3 border-b border-line-standard shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold text-text-primary">主路径步骤</span>
          <span className="text-xs text-gray-500">{done}/{steps.length} 步完成</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-green-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${steps.length > 0 ? (done / steps.length) * 100 : 0}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {pathData.overallStrategy && (
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">{pathData.overallStrategy}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {steps.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
            没有路径步骤
          </div>
        ) : (
          <div>
            {steps.map((step, i) => (
              <StepItem
                key={step.contactId}
                step={step}
                index={i}
                isLast={i === steps.length - 1}
                stepStatus={stepStatuses.find(s => s.contactId === step.contactId)}
                journeyId={journeyId}
                onUpdate={onStepUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
