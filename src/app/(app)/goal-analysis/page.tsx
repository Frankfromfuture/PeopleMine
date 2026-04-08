'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import GoalList, { JourneySummary, deriveGoalStatus } from './GoalList'
import GoalStepTracker from './GoalStepTracker'
import ContactQuickPanel from './ContactQuickPanel'
import { JourneyPathData, StepStatus } from '@/lib/journey/types'

interface RawJourney {
  id: string
  goal: string
  createdAt: string
  pathData: unknown
}

function parseJourney(raw: RawJourney): JourneySummary {
  return {
    id: raw.id,
    goal: raw.goal,
    createdAt: raw.createdAt,
    pathData: raw.pathData as JourneyPathData | null,
  }
}

export default function GoalAnalysisPage() {
  const router = useRouter()
  const [journeys, setJourneys] = useState<JourneySummary[]>([])
  const [activeJourney, setActiveJourney] = useState<JourneySummary | null>(null)
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'active' | 'completed'>('all')

  const loadJourneys = useCallback(async () => {
    try {
      const res = await fetch('/api/journey?limit=50')
      if (!res.ok) return
      const data = await res.json()
      const parsed = (data.journeys as RawJourney[]).map(parseJourney)
      setJourneys(parsed)
      if (parsed.length > 0 && !activeJourney) {
        const first = parsed.find(j => deriveGoalStatus(j) === 'active') ?? parsed[0]
        setActiveJourney(first)
        setStepStatuses(first.pathData?.stepStatuses ?? [])
      }
    } catch { /* ignore */ }
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { loadJourneys() }, [loadJourneys])

  const handleSelect = (j: JourneySummary) => {
    setActiveJourney(j)
    setStepStatuses(j.pathData?.stepStatuses ?? [])
  }

  const handleStepUpdate = useCallback((updated: StepStatus) => {
    setStepStatuses(prev => {
      const idx = prev.findIndex(s => s.contactId === updated.contactId)
      return idx >= 0
        ? prev.map((s, i) => i === idx ? updated : s)
        : [...prev, updated]
    })
    setActiveJourney(prev => {
      if (!prev?.pathData) return prev
      const prevStatuses = prev.pathData.stepStatuses ?? []
      const idx = prevStatuses.findIndex(s => s.contactId === updated.contactId)
      const newStatuses = idx >= 0
        ? prevStatuses.map((s, i) => i === idx ? updated : s)
        : [...prevStatuses, updated]
      return { ...prev, pathData: { ...prev.pathData, stepStatuses: newStatuses } }
    })
  }, [])

  const filteredJourneys = journeys.filter(j => {
    if (tab === 'all') return true
    const status = deriveGoalStatus(j)
    if (tab === 'active') return status === 'active' || status === 'stalled'
    if (tab === 'completed') return status === 'completed'
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-gray-500 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">加载目标中…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── 顶部栏 ── */}
      <div className="shrink-0 px-6 py-3 bg-app-strong border-b border-line-standard flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary">目标追踪</h1>
          <p className="text-xs text-gray-400 mt-0.5">从分析到执行，全程可追踪</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            {(['all', 'active', 'completed'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-xs px-3 py-1.5 rounded-md transition ${
                  tab === t ? 'bg-white text-text-primary shadow-sm font-medium' : 'text-gray-500'
                }`}
              >
                {{ all: '全部', active: '进行中', completed: '已完成' }[t]}
              </button>
            ))}
          </div>
          <button
            onClick={() => router.push('/journey')}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition font-medium"
          >
            + 新建目标
          </button>
        </div>
      </div>

      {/* ── 主体三栏 ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* 左栏：目标列表 */}
        <div className="w-[240px] shrink-0 border-r border-line-standard overflow-hidden flex flex-col">
          <GoalList
            journeys={filteredJourneys}
            activeId={activeJourney?.id ?? null}
            onSelect={handleSelect}
            onNew={() => router.push('/journey')}
          />
        </div>

        {/* 中栏：步骤追踪器 */}
        <div className="flex-1 overflow-hidden flex flex-col border-r border-line-standard">
          {activeJourney?.pathData ? (
            <>
              <div className="shrink-0 px-5 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-xs text-gray-400 mb-0.5">当前目标</p>
                <p className="text-sm font-semibold text-text-primary line-clamp-2">
                  {activeJourney.goal.includes('::')
                    ? activeJourney.goal.split('::')[1].trim()
                    : activeJourney.goal}
                </p>
              </div>
              <div className="flex-1 overflow-hidden">
                <GoalStepTracker
                  journeyId={activeJourney.id}
                  pathData={activeJourney.pathData}
                  stepStatuses={stepStatuses}
                  onStepUpdate={handleStepUpdate}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center px-8">
              {journeys.length === 0 ? (
                <div>
                  <div className="text-4xl mb-4">🧭</div>
                  <h2 className="text-base font-semibold text-gray-700 mb-2">还没有目标</h2>
                  <p className="text-sm text-gray-400 mb-4">去「人脉宇宙」创建你的第一个航程目标</p>
                  <button
                    onClick={() => router.push('/journey')}
                    className="text-sm px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    开始分析 →
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-400">从左侧选择一个目标</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右栏：联系人快速面板 */}
        <div className="w-[300px] shrink-0 overflow-hidden flex flex-col">
          <ContactQuickPanel pathData={activeJourney?.pathData ?? null} />
        </div>
      </div>
    </div>
  )
}
