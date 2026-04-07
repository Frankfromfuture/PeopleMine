"use client"

import React from "react"

const colors = ["#e5e7eb", "#9ca3af", "#6b7280", "#4b5563", "#1a1a1a"]

const buildMonthLabels = () => {
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - 364)
  const labels: { label: string; weekIndex: number }[] = []
  let lastMonth = -1
  for (let i = 0; i < 365; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const m = d.getMonth()
    if (m !== lastMonth) {
      lastMonth = m
      labels.push({ label: String(m + 1), weekIndex: Math.floor(i / 7) })
    }
  }
  return labels
}

const monthLabels = buildMonthLabels()
const DAY_LABELS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", ""]

// Stable fallback so SSR and client render match
const FALLBACK: number[] = Array.from({ length: 365 }, () => 0)

export function ContributionGrid({ activityData }: { activityData?: number[] }) {
  const data = activityData && activityData.length === 365 ? activityData : FALLBACK
  const weeks = 52
  const days  = 7

  return (
    <div className="flex flex-col gap-[4px]">
      <div className="flex">
        <div className="w-[28px] shrink-0" />
        <div className="flex gap-[3px]">
          {Array.from({ length: weeks }).map((_, w) => {
            const hit = monthLabels.find((m) => m.weekIndex === w)
            return (
              <div
                key={w}
                className="w-[10px] overflow-visible whitespace-nowrap text-gray-400"
                style={{ fontSize: 9, lineHeight: "10px" }}
              >
                {hit ? hit.label : ""}
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex gap-[4px]">
        <div className="flex flex-col gap-[3px] w-[28px] shrink-0">
          {DAY_LABELS.map((label, d) => (
            <div
              key={d}
              className="h-[10px] flex items-center justify-end pr-[3px] text-gray-400"
              style={{ fontSize: 9, lineHeight: "10px" }}
            >
              {label}
            </div>
          ))}
        </div>
        <div className="flex gap-[3px]">
          {Array.from({ length: weeks }).map((_, w) => (
            <div key={w} className="flex flex-col gap-[3px]">
              {Array.from({ length: days }).map((_, d) => {
                const idx = w * 7 + d
                const level = idx < 365 ? data[idx] : 0
                return (
                  <div
                    key={d}
                    className="w-[10px] h-[10px] rounded-[2px]"
                    style={{ backgroundColor: colors[level] }}
                    title={`Week ${w + 1} ${DAY_LABELS[d] || (d === 0 ? "Sun" : "Sat")}: ${level > 0 ? `+${level === 4 ? "11+" : [0,1,3,6,10][level]}` : "无新增"}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-[4px] mt-1 ml-[32px]">
        <span className="text-gray-400" style={{ fontSize: 9 }}>少</span>
        {colors.map((c, i) => (
          <div key={i} className="w-[10px] h-[10px] rounded-[2px]" style={{ backgroundColor: c }} />
        ))}
        <span className="text-gray-400" style={{ fontSize: 9 }}>多</span>
      </div>
    </div>
  )
}
