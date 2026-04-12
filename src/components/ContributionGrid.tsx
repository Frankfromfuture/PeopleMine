"use client"

import React from "react"

const colors = ["#e5e7eb", "#9ca3af", "#6b7280", "#4b5563", "#1a1a1a"]
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const FALLBACK: number[] = Array.from({ length: 365 }, () => 0)
const WEEK_LABEL_WIDTH = 54
const INNER_LABEL_WIDTH = 34

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
      labels.push({ label: MONTH_SHORT[month], weekIndex: Math.floor(i / 7) })
    }
  }

  return labels
}

const monthLabels = buildMonthLabels()

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
    <div className="inline-block origin-top-left scale-[1.2] pb-1">
      <div className="flex w-fit flex-col">
        <div className="flex w-fit">
          <div
            className="sticky left-0 z-40 shrink-0 bg-white"
            style={{ width: WEEK_LABEL_WIDTH }}
          />
          <div className="flex gap-[3px]">
            {Array.from({ length: weeks }).map((_, weekIndex) => {
              const month = monthLabels.find((item) => item.weekIndex === weekIndex)
              return (
                <div
                  key={weekIndex}
                  className="w-[10px] overflow-visible whitespace-nowrap text-gray-300"
                  style={{ fontSize: 8.5, lineHeight: "10px", letterSpacing: "0.06em" }}
                >
                  {month ? month.label : ""}
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-[14px] flex w-fit gap-[4px]">
          <div
            className="sticky left-0 z-40 shrink-0 bg-white"
            style={{ width: WEEK_LABEL_WIDTH }}
          >
            <div className="bg-white pr-[4px]" style={{ width: INNER_LABEL_WIDTH }}>
              {DAY_LABELS.map((label, dayIndex) => (
                <div
                  key={dayIndex}
                  className="flex h-[10px] items-center justify-end pr-[2px] text-gray-400"
                  style={{ fontSize: 8.5, lineHeight: "10px", marginBottom: dayIndex === DAY_LABELS.length - 1 ? 0 : 3 }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-[3px]">
            {Array.from({ length: weeks }).map((_, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {Array.from({ length: days }).map((_, dayIndex) => {
                  const dataIndex = weekIndex * 7 + dayIndex
                  const level = dataIndex < 365 ? data[dataIndex] : 0
                  const dayLabel = DAY_LABELS[dayIndex]

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

        <div
          className="sticky bottom-0 left-0 z-40 mt-1 flex w-fit items-center gap-[4px] bg-white pr-2"
          style={{ marginLeft: WEEK_LABEL_WIDTH + 4 }}
        >
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
    </div>
  )
}
