'use client'

import { JourneyPathData, StepStatus } from '@/lib/journey/types'

export type GoalStatus = 'active' | 'completed' | 'stalled'

export interface JourneySummary {
  id: string
  goal: string
  createdAt: string
  pathData: JourneyPathData | null
}

export function deriveGoalStatus(journey: JourneySummary): GoalStatus {
  const pd = journey.pathData
  if (!pd) return 'active'
  const statuses: StepStatus[] = pd.stepStatuses ?? []
  if (statuses.length === 0) return 'active'
  const allDone = pd.primaryPath.every(
    step => statuses.find(s => s.contactId === step.contactId)?.status === 'done'
  )
  if (allDone) return 'completed'
  const lastUpdate = statuses.reduce((latest, s) => (s.updatedAt > latest ? s.updatedAt : latest), '')
  const refDate = lastUpdate || journey.createdAt
  const daysSince = (Date.now() - new Date(refDate).getTime()) / 86400000
  return daysSince > 14 ? 'stalled' : 'active'
}

export function deriveProgress(journey: JourneySummary): { done: number; total: number } {
  const pd = journey.pathData
  if (!pd) return { done: 0, total: 0 }
  const total = pd.primaryPath.length
  const done = (pd.stepStatuses ?? []).filter(
    s => s.status === 'done' && pd.primaryPath.some(p => p.contactId === s.contactId)
  ).length
  return { done, total }
}

const STATUS_CHIP: Record<GoalStatus, { label: string; cls: string }> = {
  active:    { label: '进行中', cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  completed: { label: '已完成', cls: 'bg-green-50 text-green-700 border-green-200' },
  stalled:   { label: '搁置中', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
}

function parseGoalDisplay(raw: string): string {
  const sep = raw.indexOf('::')
  if (sep === -1) return raw
  return raw.slice(sep + 2).trim()
}

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days} 天前`
  if (days < 30) return `${Math.floor(days / 7)} 周前`
  return `${Math.floor(days / 30)} 个月前`
}

export default function GoalList({
  journeys,
  activeId,
  onSelect,
  onNew,
}: {
  journeys: JourneySummary[]
  activeId: string | null
  onSelect: (j: JourneySummary) => void
  onNew: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line-standard shrink-0">
        <span className="text-sm font-bold text-text-primary">目标列表</span>
        <button
          onClick={onNew}
          className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
        >
          + 新建
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {journeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <p className="text-sm text-gray-400">还没有目标</p>
            <button
              onClick={onNew}
              className="mt-2 text-xs text-blue-500 hover:underline"
            >
              去创建第一个目标 →
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {journeys.map((j) => {
              const status = deriveGoalStatus(j)
              const chip = STATUS_CHIP[status]
              const { done, total } = deriveProgress(j)
              const isActive = j.id === activeId
              return (
                <button
                  key={j.id}
                  onClick={() => onSelect(j)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isActive
                      ? 'border-gray-400 bg-gray-50 shadow-sm'
                      : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <p className="text-xs font-medium text-text-primary leading-snug line-clamp-2 mb-1.5">
                    {parseGoalDisplay(j.goal)}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${chip.cls}`}>
                      {chip.label}
                    </span>
                    {total > 0 && (
                      <span className="text-[10px] text-gray-400">
                        {done}/{total} 步
                      </span>
                    )}
                    <span className="text-[10px] text-gray-300 ml-auto">{timeAgo(j.createdAt)}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
