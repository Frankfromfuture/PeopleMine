"use client"

import React from "react"

const colors = ["#e5e7eb", "#9ca3af", "#6b7280", "#4b5563", "#1a1a1a"]

const buildMonthLabels = () => {
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - 364)
  const labels: { label: string; weekIndex: number }[] = []
  let lastMonth = -1

  for (let i = 0; i < 365; i += 1) {
    const current = new Date(start)
    current.setDate(current.getDate() + i)
    const month = current.getMonth()
    if (month !== lastMonth) {
      lastMonth = month
      labels.push({ label: String(month + 1), weekIndex: Math.floor(i / 7) })
    }
  }

  return labels
}

const monthLabels = buildMonthLabels()
const DAY_LABELS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", ""]
const FALLBACK: number[] = Array.from({ length: 365 }, () => 0)

function levelLabel(level: number) {
  if (level === 0) return "无新增"
  if (level === 1) return "1-2 条"
  if (level === 2) return "3-5 条"
  if (level === 3) return "6-10 条"
  return "11+ 条"
}

export function ContributionGrid({ activityData }: { activityData?: number[] }) {
  const data = activityData && activityData.length === 365 ? activityData : FALLBACK
  const weeks = 52
  const days = 7

  return (
    <div className="flex flex-col gap-[4px] pb-1">
      <div className="flex">
        <div className="w-[28px] shrink-0" />
        <div className="flex gap-[3px]">
          {Array.from({ length: weeks }).map((_, weekIndex) => {
            const month = monthLabels.find((item) => item.weekIndex === weekIndex)
            return (
              <div
                key={weekIndex}
                className="w-[10px] overflow-visible whitespace-nowrap text-gray-400"
                style={{ fontSize: 9, lineHeight: "10px" }}
              >
                {month ? month.label : ""}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-[4px]">
        <div className="flex w-[28px] shrink-0 flex-col gap-[3px]">
          {DAY_LABELS.map((label, dayIndex) => (
            <div
              key={dayIndex}
              className="flex h-[10px] items-center justify-end pr-[3px] text-gray-400"
              style={{ fontSize: 9, lineHeight: "10px" }}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="flex gap-[3px]">
          {Array.from({ length: weeks }).map((_, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {Array.from({ length: days }).map((_, dayIndex) => {
                const dataIndex = weekIndex * 7 + dayIndex
                const level = dataIndex < 365 ? data[dataIndex] : 0
                const dayLabel = DAY_LABELS[dayIndex] || (dayIndex === 0 ? "Sun" : "Sat")

                return (
                  <div
                    key={dayIndex}
                    className="h-[10px] w-[10px] rounded-[2px]"
                    style={{ backgroundColor: colors[level] }}
                    title={`Week ${weekIndex + 1} ${dayLabel}: ${levelLabel(level)}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="ml-[32px] mt-1 flex items-center gap-[4px]">
        <span className="text-gray-400" style={{ fontSize: 9 }}>
          少
        </span>
        {colors.map((color, index) => (
          <div key={index} className="h-[10px] w-[10px] rounded-[2px]" style={{ backgroundColor: color }} />
        ))}
        <span className="text-gray-400" style={{ fontSize: 9 }}>
          多
        </span>
      </div>
    </div>
  )
}
