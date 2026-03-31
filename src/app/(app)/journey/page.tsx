'use client'

import React, { useState, useEffect } from 'react'
import GoalInput from './GoalInput'
import JourneyGraph from './JourneyGraph'
import NodeDetailPanel from './NodeDetailPanel'
import JourneyHistory from './JourneyHistory'
import { JourneyPathData, JourneyAnalysisResponse } from '@/lib/journey/types'

interface Journey {
  id: string
  goal: string
  createdAt: string
  pathData: JourneyPathData
  aiAnalysis: string | null
}

type LoadingStep = 'idle' | 'step1' | 'step2' | 'step3' | 'step4'

const LOADING_STEPS = [
  { key: 'step1', label: '读取联系人数据', emoji: '📊' },
  { key: 'step2', label: '计算节点评分', emoji: '🎯' },
  { key: 'step3', label: '规划候选路径', emoji: '🗺️' },
  { key: 'step4', label: 'AI 深度分析中', emoji: '🧠' },
]

export default function JourneyPage() {
  const [currentPathData, setCurrentPathData] = useState<JourneyPathData | null>(
    null,
  )
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('idle')
  const [error, setError] = useState<string | null>(null)
  const [journeyHistory, setJourneyHistory] = useState<Journey[]>([])
  const [historyExpanded, setHistoryExpanded] = useState(false)

  // 加载历史
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch('/api/journey?limit=5&offset=0')
        if (res.ok) {
          const data = await res.json()
          setJourneyHistory(
            data.journeys.map((j: Record<string, unknown>) => ({
              id: j.id,
              goal: j.goal,
              createdAt: j.createdAt,
              pathData: j.pathData,
              aiAnalysis: j.aiAnalysis,
            })),
          )
        }
      } catch (err) {
        console.error('加载历史失败:', err)
      }
    }
    loadHistory()
  }, [])

  // 加载步进动画（前 3 步快速，第 4 步等待真实响应）
  useEffect(() => {
    if (!isLoading) return

    const intervals = [
      setTimeout(() => setLoadingStep('step1'), 0),
      setTimeout(() => setLoadingStep('step2'), 800),
      setTimeout(() => setLoadingStep('step3'), 1600),
      setTimeout(() => setLoadingStep('step4'), 2400),
    ]

    return () => intervals.forEach(clearTimeout)
  }, [isLoading])

  // 提交目标分析
  const handleSubmitGoal = async (goal: string) => {
    setIsLoading(true)
    setError(null)
    setCurrentPathData(null)
    setSelectedNodeId(null)

    try {
      const res = await fetch('/api/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(
          errorData.error ||
            `服务器错误: ${res.status}`,
        )
      }

      const data = (await res.json()) as JourneyAnalysisResponse
      setCurrentPathData(data.journey.pathData)

      // 更新历史
      setJourneyHistory((prev) => [
        {
          id: data.journey.id,
          goal: data.journey.goal,
          createdAt: data.journey.createdAt,
          pathData: data.journey.pathData,
          aiAnalysis: data.journey.aiAnalysis,
        },
        ...prev.slice(0, 4),
      ])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '未知错误'
      setError(message)
      console.error('分析失败:', err)
    } finally {
      setIsLoading(false)
      setLoadingStep('idle')
    }
  }

  const handleSelectHistoryJourney = (journeyId: string) => {
    const journey = journeyHistory.find((j) => j.id === journeyId)
    if (journey) {
      setCurrentPathData(journey.pathData)
      setSelectedNodeId(null)
    }
  }

  return (
    <div className="px-6 py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">人脉航程</h1>
        <p className="text-sm text-gray-600">
          AI 驱动的人脉路径规划
        </p>
      </div>

      {/* 目标输入卡片 */}
      {!currentPathData && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <GoalInput onSubmit={handleSubmitGoal} isLoading={isLoading} />
        </div>
      )}

      {/* 加载进度 */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="space-y-6">
            {LOADING_STEPS.map((step, index) => {
              const isActive = (
                ['idle', 'step1', 'step2', 'step3', 'step4'].indexOf(loadingStep) >=
                index
              )
              const isCurrentStep = loadingStep === step.key

              return (
                <div key={step.key} className="flex items-center gap-4">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg transition ${
                      isActive
                        ? isCurrentStep
                          ? 'bg-violet-600 text-white scale-110'
                          : 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isActive && !isCurrentStep ? '✓' : step.emoji}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        isActive ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </p>
                    {isCurrentStep && (
                      <p className="text-xs text-gray-500 mt-1">
                        正在处理中...
                      </p>
                    )}
                  </div>
                  {isCurrentStep && (
                    <div className="w-4 h-4 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800">
            <span className="font-semibold">分析失败：</span> {error}
          </p>
          <button
            onClick={() => setError(null)}
            className="mt-3 px-3 py-1 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200 transition"
          >
            关闭
          </button>
        </div>
      )}

      {/* 结果展示区 */}
      {currentPathData && !isLoading && (
        <>
          {/* 图谱和详情面板 */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <JourneyGraph
                pathData={currentPathData}
                onNodeClick={setSelectedNodeId}
                selectedNodeId={selectedNodeId}
              />
            </div>
            <div className="md:w-[350px]">
              <NodeDetailPanel
                pathData={currentPathData}
                selectedNodeId={selectedNodeId}
                onClose={() => setSelectedNodeId(null)}
              />
            </div>
          </div>

          {/* AI 分析摘要 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              🎯 整体策略
            </h3>
            <p className="text-gray-700 leading-relaxed text-sm">
              {currentPathData.overallStrategy}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600">
                置信度：
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                <div
                  className="bg-violet-600 h-2 rounded-full"
                  style={{
                    width: `${currentPathData.overallConfidence * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-900">
                {(currentPathData.overallConfidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* 缺失节点提示 */}
          {currentPathData.missingNodes.length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
              <h3 className="font-semibold text-amber-900 mb-3">
                ⚠️ 网络缺失节点
              </h3>
              <div className="space-y-3">
                {currentPathData.missingNodes.map((missing) => (
                  <div key={missing.missingRole}>
                    <p className="font-medium text-amber-900 text-sm">
                      {missing.roleName}
                    </p>
                    <p className="text-sm text-amber-800 mt-1">
                      {missing.whyNeeded}
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      💡 建议：{missing.howToFind}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 重新分析按钮 */}
          <div className="text-center">
            <button
              onClick={() => {
                setCurrentPathData(null)
                setSelectedNodeId(null)
                setError(null)
              }}
              className="px-4 py-2 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 transition font-medium text-sm"
            >
              新建分析
            </button>
          </div>
        </>
      )}

      {/* 历史记录 */}
      {!isLoading && !currentPathData && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <JourneyHistory
            journeys={journeyHistory}
            onSelectJourney={handleSelectHistoryJourney}
            isExpanded={historyExpanded}
            onToggleExpand={() => setHistoryExpanded(!historyExpanded)}
          />
        </div>
      )}
    </div>
  )
}
