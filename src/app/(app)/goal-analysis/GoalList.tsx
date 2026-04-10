'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { JourneyPathData, StepStatus } from '@/lib/journey/types'

export type GoalStatus = 'active' | 'completed' | 'stalled'

export interface JourneySummary {
  id: string
  goal: string
  createdAt: string
  pathData: JourneyPathData | null
}

export function deriveGoalStatus(journey: JourneySummary): GoalStatus {
  const pathData = journey.pathData
  if (!pathData) return 'active'
  const statuses: StepStatus[] = pathData.stepStatuses ?? []
  if (statuses.length === 0) return 'active'

  const allDone = pathData.primaryPath.every(
    (step) => statuses.find((status) => status.contactId === step.contactId)?.status === 'done'
  )
  if (allDone) return 'completed'

  const latestUpdate = statuses.reduce((latest, status) => (status.updatedAt > latest ? status.updatedAt : latest), '')
  const referenceDate = latestUpdate || journey.createdAt
  const daysSince = (Date.now() - new Date(referenceDate).getTime()) / 86400000
  return daysSince > 14 ? 'stalled' : 'active'
}

export function deriveProgress(journey: JourneySummary): { done: number; total: number } {
  const pathData = journey.pathData
  if (!pathData) return { done: 0, total: 0 }
  const total = pathData.primaryPath.length
  const done = (pathData.stepStatuses ?? []).filter(
    (status) => status.status === 'done' && pathData.primaryPath.some((step) => step.contactId === status.contactId)
  ).length
  return { done, total }
}

const STATUS_CHIP: Record<GoalStatus, { label: string; cls: string }> = {
  active: { label: '进行中', cls: 'bg-gray-900 text-white border-gray-900' },
  completed: { label: '已完成', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
  stalled: { label: '搁置中', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
}

function parseGoalDisplay(raw: string): string {
  const separator = raw.indexOf('::')
  if (separator === -1) return raw
  return raw.slice(separator + 2).trim()
}

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days} 天前`
  if (days < 30) return `${Math.floor(days / 7)} 周前`
  return `${Math.floor(days / 30)} 个月前`
}

function IconDelete() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 3.5h9M5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M4 3.5l.5 7h4l.5-7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconRestore() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 6.5A4.5 4.5 0 106.5 2H4M4 2L2 4M4 2L6 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function GoalList({
  journeys,
  activeId,
  onSelect,
  onNew,
  onDelete,
  deletedJourneys,
  onRestore,
}: {
  journeys: JourneySummary[]
  activeId: string | null
  onSelect: (journey: JourneySummary) => void
  onNew: () => void
  onDelete: (id: string) => void
  deletedJourneys: JourneySummary[]
  onRestore: (id: string) => void
}) {
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [recentlyDeleted, setRecentlyDeleted] = useState<JourneySummary | null>(null)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">全部目标</p>
          <p className="mt-1 text-[11px] text-gray-400">{journeys.length} 条可见记录</p>
        </div>
        <button
          onClick={onNew}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
        >
          新建
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-scroll px-3 py-3">
        {journeys.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-4 text-center">
            <p className="text-sm text-gray-500">还没有目标</p>
            <button onClick={onNew} className="mt-2 text-xs text-gray-400 transition hover:text-gray-700">
              创建第一个目标
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {journeys.map((journey) => {
              const status = deriveGoalStatus(journey)
              const chip = STATUS_CHIP[status]
              const { done, total } = deriveProgress(journey)
              const isActive = journey.id === activeId

              return (
                <div
                  key={journey.id}
                  className={`group relative overflow-hidden rounded-2xl border transition ${
                    isActive ? 'border-gray-400 bg-white shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <button onClick={() => onSelect(journey)} className="w-full px-4 py-4 pr-10 text-left">
                    <div className="mb-3 flex items-start gap-3">
                      <div className={`mt-0.5 h-2.5 w-2.5 rounded-full ${isActive ? 'bg-gray-900' : 'bg-gray-200'}`} />
                      <p className="line-clamp-2 flex-1 text-sm font-medium leading-6 text-gray-900">
                        {parseGoalDisplay(journey.goal)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-medium ${chip.cls}`}>
                        {chip.label}
                      </span>
                      {total > 0 && <span className="text-[11px] text-gray-500">{done}/{total} 步</span>}
                      <span className="ml-auto text-[11px] text-gray-400">{timeAgo(journey.createdAt)}</span>
                    </div>
                  </button>

                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      setRecentlyDeleted(journey)
                      onDelete(journey.id)
                    }}
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-xl text-gray-300 opacity-0 transition hover:bg-gray-50 hover:text-gray-600 group-hover:opacity-100"
                    title="删除目标"
                  >
                    <IconDelete />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {recentlyDeleted && deletedJourneys.some((item) => item.id === recentlyDeleted.id) && (
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            className="shrink-0 border-t border-gray-200 bg-white px-4 py-2.5"
          >
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-[#fcfcfb] px-3 py-2">
              <p className="line-clamp-1 flex-1 text-[11px] text-gray-500">
                已删除：{parseGoalDisplay(recentlyDeleted.goal)}
              </p>
              <button
                onClick={() => {
                  onRestore(recentlyDeleted.id)
                  setRecentlyDeleted(null)
                }}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
              >
                撤回
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {deletedJourneys.length > 0 && (
        <div className="border-t border-gray-200 bg-[#fcfcfb]">
          <button
            onClick={() => setArchiveOpen((current) => !current)}
            className="flex w-full items-center justify-between px-5 py-3 text-left transition hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400">已删除目标</span>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] text-gray-500">{deletedJourneys.length}</span>
            </div>
            <motion.span animate={{ rotate: archiveOpen ? 180 : 0 }} className="text-xs text-gray-400">
              ▼
            </motion.span>
          </button>

          <AnimatePresence>
            {archiveOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="space-y-2 px-3 pb-3">
                  {deletedJourneys.map((journey) => (
                    <div key={journey.id} className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                      <p className="line-clamp-1 flex-1 text-xs text-gray-500">{parseGoalDisplay(journey.goal)}</p>
                      <button
                        onClick={() => onRestore(journey.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
                        title="恢复目标"
                      >
                        <IconRestore />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
