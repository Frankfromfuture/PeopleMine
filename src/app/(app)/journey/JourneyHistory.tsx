'use client'

import React from 'react'

interface Journey {
  id: string
  goal: string
  createdAt: string
}

interface JourneyHistoryProps {
  journeys: Journey[]
  onSelectJourney: (journeyId: string) => void
  isExpanded: boolean
  onToggleExpand: () => void
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return date.toLocaleDateString('zh-CN')
}

export default function JourneyHistory({
  journeys,
  onSelectJourney,
  isExpanded,
  onToggleExpand,
}: JourneyHistoryProps) {
  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <button
        onClick={onToggleExpand}
        className="flex items-center gap-2 font-medium text-gray-900 hover:text-violet-600 transition"
      >
        <span>{isExpanded ? '▼' : '▶'}</span>
        <span>历史航程</span>
        {journeys.length > 0 && (
          <span className="ml-auto text-sm text-gray-500">
            ({journeys.length})
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
          {journeys.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">暂无历史记录</p>
          ) : (
            journeys.map((journey) => (
              <button
                key={journey.id}
                onClick={() => onSelectJourney(journey.id)}
                className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-sm"
              >
                <p className="font-medium text-gray-900 truncate">
                  {journey.goal.substring(0, 50)}...
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatDate(journey.createdAt)}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
