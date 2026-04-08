'use client'

import { useState } from 'react'
import { JourneyPathData, PathStep } from '@/lib/journey/types'

const CHANNEL_LABEL: Record<string, string> = {
  wechat:  '💬 微信',
  call:    '📞 打电话',
  meeting: '🤝 当面见',
  email:   '📧 发邮件',
  event:   '🎪 活动',
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }
  return (
    <button
      onClick={handleCopy}
      className="text-[10px] px-2 py-0.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition shrink-0"
    >
      {copied ? '✓ 已复制' : '复制'}
    </button>
  )
}

function ContactCard({
  step,
  node,
}: {
  step: PathStep
  node: JourneyPathData['nodes'][number] | undefined
}) {
  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-text-primary">{step.contactName}</h3>
          {node && (
            <p className="text-xs text-gray-500 mt-0.5">
              {[node.company, node.title].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        {node && (
          <div className="flex items-center gap-1 shrink-0">
            <div className="text-xs font-semibold text-gray-700">
              {(node.journeyScore * 100).toFixed(0)}分
            </div>
          </div>
        )}
      </div>

      {/* 开场白（可复制） */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">推荐开场白</span>
          <CopyButton text={step.communicationAdvice.openingLine} />
        </div>
        <p className="text-xs text-gray-700 leading-relaxed">
          「{step.communicationAdvice.openingLine}」
        </p>
      </div>

      {/* 渠道 */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">推荐渠道</p>
        <span className="text-sm font-medium text-gray-700">
          {CHANNEL_LABEL[step.communicationAdvice.channelSuggestion] ?? step.communicationAdvice.channelSuggestion}
        </span>
      </div>

      {/* 核心诉求 */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">核心诉求</p>
        <p className="text-xs text-gray-600 leading-relaxed">{step.communicationAdvice.keyMessage}</p>
      </div>

      {/* 时机 */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">最佳时机</p>
        <p className="text-xs text-gray-600 leading-relaxed">{step.communicationAdvice.timing}</p>
      </div>

      {/* 注意事项 */}
      {step.communicationAdvice.caution && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-1">注意事项</p>
          <p className="text-xs text-amber-700 leading-relaxed">{step.communicationAdvice.caution}</p>
        </div>
      )}

      {/* 介绍人 */}
      {step.introductionViaName && (
        <div className="text-xs text-gray-500">
          通过 <span className="font-medium text-gray-700">{step.introductionViaName}</span> 介绍
        </div>
      )}

      {/* 置信度 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-400">置信度</span>
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-500 rounded-full"
            style={{ width: `${step.confidenceAtThisStep * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-gray-500">{(step.confidenceAtThisStep * 100).toFixed(0)}%</span>
      </div>
    </div>
  )
}

export default function ContactQuickPanel({
  pathData,
}: {
  pathData: JourneyPathData | null
}) {
  if (!pathData) {
    return (
      <div className="flex items-center justify-center h-full text-center px-6">
        <div>
          <div className="text-3xl mb-3">🎯</div>
          <p className="text-sm text-gray-400">选择左侧目标</p>
          <p className="text-xs text-gray-300 mt-1">查看联系人沟通建议</p>
        </div>
      </div>
    )
  }

  const steps = pathData.primaryPath
  const nodes = pathData.nodes

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-line-standard shrink-0">
        <span className="text-sm font-bold text-text-primary">路径联系人</span>
        <p className="text-xs text-gray-400 mt-0.5">点击步骤查看完整沟通建议</p>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {steps.map((step, i) => {
          const node = nodes.find(n => n.contactId === step.contactId)
          return (
            <ContactCard key={step.contactId} step={step} node={node} />
          )
        })}
      </div>
    </div>
  )
}
