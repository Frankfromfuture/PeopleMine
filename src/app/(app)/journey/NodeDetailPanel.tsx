'use client'

import React from 'react'
import { JourneyPathData } from '@/lib/journey/types'

interface NodeDetailPanelProps {
  pathData: JourneyPathData
  selectedNodeId: string | null
  onClose: () => void
}

const ROLE_EMOJIS: Record<string, string> = {
  BREAKER: '🚀',
  EVANGELIST: '📢',
  ANALYST: '🔍',
  BINDER: '🔗',
}

const CHANNEL_LABELS: Record<string, string> = {
  wechat: '微信',
  call: '电话',
  meeting: '见面',
  email: '邮件',
  event: '活动',
}

export default function NodeDetailPanel({
  pathData,
  selectedNodeId,
  onClose,
}: NodeDetailPanelProps) {
  const selectedNode = selectedNodeId
    ? pathData.nodes.find((n) => n.contactId === selectedNodeId)
    : null

  const pathStep = selectedNodeId
    ? pathData.primaryPath.find((s) => s.contactId === selectedNodeId)
    : null

  if (!selectedNode) {
    return (
      <div className="w-full md:w-[350px] bg-app-elevated border-l border-line-standard p-6 flex flex-col items-center justify-center text-gray-400 md:border-l md:border-t-0 border-t">
        <p className="text-sm">点击图谱中的节点查看详情</p>
      </div>
    )
  }

  return (
    <div className="w-full md:w-[350px] bg-app-elevated border-l border-line-standard p-6 overflow-y-auto md:border-l md:border-t-0 border-t max-h-[520px]">
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 md:hidden"
      >
        ✕
      </button>

      {/* 联系人头部 */}
      <div className="mb-6">
        <div className="flex items-start gap-3 mb-3">
          <div className="text-3xl">
            {ROLE_EMOJIS[selectedNode.roleArchetype] || '👤'}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{selectedNode.name}</h3>
            <p className="text-sm text-gray-600">
              {selectedNode.company && (
                <>
                  <span>{selectedNode.company}</span>
                  {selectedNode.title && <span> · {selectedNode.title}</span>}
                </>
              )}
            </p>
          </div>
        </div>

        {/* 角色和评分 */}
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {selectedNode.journeyRoleLabel}
          </span>
          {selectedNode.temperature && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                selectedNode.temperature === 'HOT'
                  ? 'bg-gray-100 text-gray-700'
                  : selectedNode.temperature === 'WARM'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-700'
              }`}
            >
              {selectedNode.temperature === 'HOT'
                ? '🔥 热'
                : selectedNode.temperature === 'WARM'
                  ? '☀️ 温'
                  : '❄️ 冷'}
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-line-standard pt-4 mb-4">
        {/* 评分指标 */}
        <div className="space-y-3 mb-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">航程综合分</span>
              <span className="text-sm font-semibold text-gray-600">
                {(selectedNode.journeyScore * 100).toFixed(0)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gray-600 h-2 rounded-full"
                style={{ width: `${selectedNode.journeyScore * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">能量值</span>
              <span className="text-sm font-semibold">
                {selectedNode.energyScore}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gray-400 h-2 rounded-full"
                style={{ width: `${selectedNode.energyScore}%` }}
              />
            </div>
          </div>

          {selectedNode.trustLevel !== null && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">信任度</span>
                <span className="text-sm font-semibold">
                  {selectedNode.trustLevel}/5
                </span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full ${
                      (selectedNode.trustLevel || 0) > i
                        ? 'bg-gray-400'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 标签 */}
        {selectedNode.tags && selectedNode.tags.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
              标签
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedNode.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 沟通建议 */}
      {pathStep && (
        <div className="border-t border-line-standard pt-4">
          <h4 className="font-semibold text-sm mb-3 text-gray-900">
            📞 沟通建议
          </h4>

          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-gray-700 mb-1">开场白</p>
              <p className="text-gray-600 bg-gray-50 p-2 rounded">
                {pathStep.communicationAdvice.openingLine}
              </p>
            </div>

            <div>
              <p className="font-medium text-gray-700 mb-1">核心信息</p>
              <p className="text-gray-600 bg-gray-50 p-2 rounded">
                {pathStep.communicationAdvice.keyMessage}
              </p>
            </div>

            <div>
              <p className="font-medium text-gray-700 mb-1">时机建议</p>
              <p className="text-gray-600 bg-gray-50 p-2 rounded">
                {pathStep.communicationAdvice.timing}
              </p>
            </div>

            {pathStep.communicationAdvice.caution && (
              <div>
                <p className="font-medium text-gray-700 mb-1">⚠️ 注意事项</p>
                <p className="text-gray-600 bg-gray-50 p-2 rounded">
                  {pathStep.communicationAdvice.caution}
                </p>
              </div>
            )}

            <div>
              <p className="font-medium text-gray-700 mb-1">推荐渠道</p>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                {CHANNEL_LABELS[pathStep.communicationAdvice.channelSuggestion]}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 路径信息 */}
      {pathStep && pathStep.hopIndex > 0 && pathStep.introductionViaName && (
        <div className="border-t border-line-standard mt-4 pt-4">
          <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
            推介人
          </p>
          <p className="text-sm text-gray-900">
            可以请 <span className="font-semibold">{pathStep.introductionViaName}</span> 介绍
          </p>
        </div>
      )}
    </div>
  )
}
