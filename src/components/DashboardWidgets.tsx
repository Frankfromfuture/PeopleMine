"use client"

import React, { useState, useRef, useEffect } from "react"
export { default as RelationStrengthPanel } from "./RelationStrengthPanel"
import { useRouter } from "next/navigation"

/* ─── Shared Stats Type ────────────────────────────────────── */
export interface MaintenanceContact {
  rank: number
  id: string
  name: string
  title: string
  company: string
  lastDays: number
  energyScore: number
  temperature: string | null
}
export interface DashboardStats {
  total: number
  highEnergy: number
  needsMaintenance: number
  prevWeekTotal: number
  prevWeekHighEnergy: number
  maintenanceList: MaintenanceContact[]
  monthlyGrowth: { month: string; value: number }[]
  dailyActivity: number[]
  radarData: { trait: string; value: number }[]
  topIndustries: string[]
  strongRelationPct: number
}
import {
  Users,
  Zap,
  AlertTriangle,
  Sparkles,
  Send,
  Shuffle,
  TrendingUp,
  TrendingDown,
  Activity,
  Command,
  UserPlus,
} from "lucide-react"
export { Users, Zap, AlertTriangle }
import { ContributionGrid } from "./ContributionGrid"
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

/* ─── StatCard ─────────────────────────────────────────────── */
export function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  trend,
}: {
  icon: React.ElementType
  label: string
  value: string
  accent?: boolean
  trend?: { direction: "up" | "down"; percent: number }
}) {
  return (
    <div className="border border-gray-300 rounded-xl p-3 flex flex-col justify-between bg-white/40 backdrop-blur-sm h-full overflow-hidden">
      <div className="flex items-center gap-1.5 text-gray-500">
        <Icon size={13} strokeWidth={1.5} className={accent ? "text-[#FF7F27]" : ""} />
        <span style={{ fontSize: 11 }}>{label}</span>
      </div>
      <span
        className={accent ? "text-[#FF7F27]" : "text-gray-800"}
        style={{
          fontSize: 52,
          lineHeight: 1,
          fontWeight: 700,
          textShadow: accent
            ? "0 2px 12px rgba(255,127,39,0.35), 0 1px 3px rgba(0,0,0,0.12)"
            : "0 2px 12px rgba(0,0,0,0.13), 0 1px 3px rgba(0,0,0,0.08)",
          letterSpacing: -1,
        }}
      >
        {value}
      </span>
      {trend && (
        <div className="inline-flex items-center gap-1 self-start rounded px-1.5 py-[2px] bg-gray-100">
          {trend.direction === "up" ? (
            <TrendingUp size={9} className="text-gray-400 shrink-0" />
          ) : (
            <TrendingDown size={9} className="text-gray-400 shrink-0" />
          )}
          <span className="text-gray-500 whitespace-nowrap" style={{ fontSize: 9 }}>
            较上周{trend.direction === "up" ? "增加" : "减少"}&nbsp;
            {trend.direction === "up" ? "+" : "−"}{trend.percent}%
          </span>
        </div>
      )}
    </div>
  )
}

/* ─── AIChatWidget (Xminer) ────────────────────────────────── */
const SLASH_COMMANDS = [
  { cmd: "/分析人脉",  desc: "深度分析你的人脉网络结构" },
  { cmd: "/生成报告",  desc: "生成人脉关系洞察报告" },
  { cmd: "/推荐连接",  desc: "智能推荐潜在人脉" },
  { cmd: "/查找同行",  desc: "在行业内查找同行人脉" },
  { cmd: "/维护提醒",  desc: "设置人脉维护提醒计划" },
  { cmd: "/导出数据",  desc: "导出当前人脉数据" },
]

export function AIChatWidget() {
  const [messages, setMessages] = useState<{ role: "ai" | "user"; text: string }[]>([
    {
      role: "ai",
      text: "你好！我是 Xminer，Peoplemine 的 AI 底座平台。我能帮你深度分析人脉关系、智能推荐拓展策略、生成洞察报告，并驱动所有 AI 功能模块。请问有什么可以帮你的？",
    },
  ])
  const [input, setInput] = useState("")
  const [showCommands, setShowCommands] = useState(false)
  const cmdRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cmdRef.current && !cmdRef.current.contains(e.target as Node)) {
        setShowCommands(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const send = () => {
    if (!input.trim()) return
    setMessages((m) => [
      ...m,
      { role: "user" as "user", text: input },
      {
        role: "ai" as "ai",
        text: "基于你的人脉网络数据，Xminer 分析发现你在科技行业的连接密度较高，建议拓展金融和医疗领域的人脉，预计可提升资源多样性指数 23%。",
      },
    ])
    setInput("")
  }

  const applyCommand = (cmd: string) => {
    setInput(cmd + " ")
    setShowCommands(false)
  }

  return (
    <div className="border border-gray-300 rounded-xl p-4 bg-white/40 backdrop-blur-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#FF7F27] flex items-center justify-center shrink-0">
            <span className="text-white" style={{ fontSize: 12, fontWeight: 700, letterSpacing: -0.5 }}>X</span>
          </div>
          <div className="flex flex-col leading-none gap-[2px]">
            <span className="text-gray-800" style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.2 }}>Xminer</span>
            <span className="text-gray-400" style={{ fontSize: 9 }}>AI 底座平台 · Peoplemine</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-full px-2 py-[3px]">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
          <span className="text-gray-400" style={{ fontSize: 9 }}>在线</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-2.5 min-h-0">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-start gap-1.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "ai" && (
              <div className="w-5 h-5 rounded bg-[#FF7F27]/12 border border-[#FF7F27]/25 flex items-center justify-center shrink-0 mt-[2px]">
                <span className="text-[#FF7F27]" style={{ fontSize: 9, fontWeight: 700 }}>X</span>
              </div>
            )}
            <div
              className={`max-w-[78%] px-3 py-[7px] ${
                m.role === "user"
                  ? "bg-[#2e2e2e] text-white border border-[#444]"
                  : "bg-white text-gray-700 border border-gray-200"
              }`}
              style={{ fontSize: 12, lineHeight: 1.55, borderRadius: 5 }}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 shrink-0 relative" ref={cmdRef}>
        <button
          onClick={() => setShowCommands((v) => !v)}
          className={`shrink-0 flex items-center gap-1 px-2 py-[7px] border rounded transition-colors cursor-pointer select-none ${
            showCommands
              ? "bg-[#FF7F27] border-[#FF7F27] text-white"
              : "bg-white border-gray-200 text-gray-500 hover:border-[#FF7F27]/60 hover:text-[#FF7F27]"
          }`}
          style={{ borderRadius: 5, fontSize: 12, fontWeight: 600 }}
          title="斜线命令"
        >
          <span style={{ fontSize: 13, lineHeight: 1 }}>/</span>
        </button>

        {showCommands && (
          <div
            className="absolute bottom-full left-0 mb-1.5 w-64 bg-white border border-gray-200 shadow-lg overflow-hidden z-50"
            style={{ borderRadius: 7 }}
          >
            <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5">
              <Command size={10} className="text-gray-400" />
              <span className="text-gray-400" style={{ fontSize: 10 }}>快捷命令</span>
            </div>
            {SLASH_COMMANDS.map((c) => (
              <button
                key={c.cmd}
                onClick={() => applyCommand(c.cmd)}
                className="w-full flex items-start gap-2.5 px-3 py-[7px] hover:bg-gray-50 transition-colors cursor-pointer text-left"
              >
                <span className="text-[#FF7F27] shrink-0 tabular-nums" style={{ fontSize: 11, fontWeight: 600, minWidth: 72 }}>
                  {c.cmd}
                </span>
                <span className="text-gray-400" style={{ fontSize: 10.5, lineHeight: 1.4 }}>{c.desc}</span>
              </button>
            ))}
          </div>
        )}

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="向 Xminer 提问，或输入 / 使用命令…"
          className="flex-1 bg-white border border-gray-200 px-3 py-[7px] text-gray-700 placeholder-gray-400 outline-none focus:border-[#FF7F27]/50 transition-colors"
          style={{ fontSize: 12, borderRadius: 5 }}
        />

        <button
          onClick={send}
          className="px-3 py-[7px] bg-[#FF7F27] hover:bg-[#e0701f] text-white transition-colors cursor-pointer shrink-0 flex items-center justify-center"
          style={{ borderRadius: 5 }}
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  )
}

/* ─── RandomGeneratorWidget ────────────────────────────────── */
export function RandomGeneratorWidget() {
  const [count, setCount] = useState(10)
  const [randomness, setRandomness] = useState(50)
  const [generating, setGenerating] = useState(false)

  const generate = async () => {
    setGenerating(true)
    try {
      await fetch("/api/contacts/generate-random", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      })
    } catch {}
    setGenerating(false)
  }

  const StepRow = ({
    label,
    value,
    unit = "",
    onDec,
    onInc,
  }: {
    label: string
    value: number
    unit?: string
    onDec: () => void
    onInc: () => void
  }) => (
    <div className="flex items-center gap-1">
      <span className="text-gray-400 flex-1 truncate" style={{ fontSize: 10 }}>{label}</span>
      <button
        onClick={onDec}
        className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer select-none"
        style={{ fontSize: 13, lineHeight: 1 }}
      >
        −
      </button>
      <span className="text-center text-gray-800 tabular-nums" style={{ fontSize: 11, minWidth: 28 }}>
        {value}{unit}
      </span>
      <button
        onClick={onInc}
        className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer select-none"
        style={{ fontSize: 13, lineHeight: 1 }}
      >
        +
      </button>
    </div>
  )

  return (
    <div className="border border-gray-300 rounded-xl px-3 py-3 bg-white/40 backdrop-blur-sm flex flex-col justify-between h-full overflow-hidden">
      <div className="flex items-center gap-1.5">
        <Shuffle size={13} className="text-gray-500 shrink-0" />
        <span className="text-gray-700 truncate" style={{ fontSize: 11 }}>随机生成人脉</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <StepRow
          label="随机数量"
          value={count}
          onDec={() => setCount((c) => Math.max(1, c - 5))}
          onInc={() => setCount((c) => Math.min(100, c + 5))}
        />
        <StepRow
          label="随机性"
          value={randomness}
          unit="%"
          onDec={() => setRandomness((r) => Math.max(0, r - 5))}
          onInc={() => setRandomness((r) => Math.min(100, r + 5))}
        />
      </div>
      <button
        onClick={generate}
        disabled={generating}
        className="w-full py-1 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
        style={{ fontSize: 10 }}
      >
        {generating ? "生成中…" : "一键生成"}
      </button>
    </div>
  )
}

/* ─── ContributionWidget ───────────────────────────────────── */
export function ContributionWidget({ stats }: { stats: DashboardStats | null }) {
  return (
    <div className="border border-gray-300 rounded-xl p-5 bg-white/40 backdrop-blur-sm flex flex-col gap-2 h-full">
      <div className="flex items-center gap-1.5 mb-1">
        <Activity size={13} className="text-gray-500" />
        <span className="text-gray-700" style={{ fontSize: 11 }}>人脉记录</span>
        {stats && (
          <span className="ml-auto text-gray-400 tabular-nums" style={{ fontSize: 10 }}>
            共 {stats.total} 位
          </span>
        )}
      </div>
      <div className="overflow-x-auto overflow-y-hidden scrollbar-ghost">
        <ContributionGrid activityData={stats?.dailyActivity} />
      </div>
    </div>
  )
}

/* ─── TraitsSummaryWidget ──────────────────────────────────── */
export function TraitsSummaryWidget({ stats }: { stats: DashboardStats | null }) {
  const radar = stats?.radarData ?? [
    { trait: "社交力",   value: 0 },
    { trait: "影响力",   value: 0 },
    { trait: "行业深度", value: 0 },
    { trait: "资源整合", value: 0 },
    { trait: "信任度",   value: 0 },
    { trait: "活跃度",   value: 0 },
  ]

  const inds = stats?.topIndustries ?? []
  const strongPct = stats?.strongRelationPct ?? 0

  const traits = [
    { label: "核心行业", value: inds.length > 0 ? inds.join(" / ") : "暂无数据" },
    { label: "高能量占比", value: stats ? `${strongPct}% 为强关系` : "—" },
    { label: "行业多样性", value: stats ? `${new Set(inds).size} 个主行业` : "—" },
    { label: "总人脉数", value: stats ? `${stats.total} 位` : "—" },
  ]

  const insightText = stats
    ? inds.length > 0
      ? `你的人脉网络以${inds[0]}为主要行业，${strongPct}% 的联系人能量值较高。${stats.needsMaintenance > 0 ? `当前有 ${stats.needsMaintenance} 位联系人超过 30 天未联系，建议及时跟进。` : "所有人脉均保持活跃联系。"}`
      : "暂无足够数据，添加更多联系人后可生成洞察。"
    : "加载中…"

  return (
    <div className="border border-gray-300 rounded-xl p-5 bg-white/40 backdrop-blur-sm flex flex-col gap-3 h-full">
      <div className="flex items-center gap-1.5 shrink-0">
        <Sparkles size={13} className="text-gray-500" />
        <span className="text-gray-700" style={{ fontSize: 11 }}>人脉特征总结</span>
      </div>

      <div className="flex gap-3 shrink-0">
        <div className="flex-1" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radar}>
              <PolarGrid stroke="#d1d5db" />
              <PolarAngleAxis dataKey="trait" tick={{ fontSize: 12, fill: "#6b7280" }} />
              <Radar name="traits" dataKey="value" stroke="#FF7F27" fill="#FF7F27" fillOpacity={0.15} strokeWidth={1.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 flex flex-col justify-start">
          {traits.map((t) => (
            <div key={t.label} className="border-b border-gray-200 py-2">
              <div className="text-gray-400 text-left" style={{ fontSize: 12 }}>{t.label}</div>
              <div className="text-gray-700 text-left truncate" style={{ fontSize: 14 }}>{t.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden rounded-xl bg-gray-50 px-5 py-4 flex flex-col">
        <span
          aria-hidden="true"
          className="absolute select-none pointer-events-none text-gray-600"
          style={{ fontSize: 80, lineHeight: 1, fontWeight: 800, opacity: 0.07, top: -8, left: 8, fontFamily: "Georgia, serif" }}
        >
          &ldquo;
        </span>
        <div className="flex items-center gap-1.5 mb-3 relative z-10 shrink-0">
          <div className="w-4 h-4 rounded bg-[#FF7F27] flex items-center justify-center shrink-0">
            <span className="text-white" style={{ fontSize: 9, fontWeight: 700 }}>X</span>
          </div>
          <span className="text-gray-500" style={{ fontSize: 12 }}>Xminer 洞察</span>
        </div>
        <div className="relative z-10 text-gray-600 text-left pl-1" style={{ fontSize: 13, lineHeight: 1.75 }}>
          {insightText}
        </div>
      </div>
    </div>
  )
}

/* ─── NetworkTrendWidget ───────────────────────────────────── */
export function NetworkTrendWidget({ stats }: { stats: DashboardStats | null }) {
  const data = stats?.monthlyGrowth ?? []
  return (
    <div className="border border-gray-300 rounded-xl p-5 bg-white/40 backdrop-blur-sm flex flex-col gap-3 h-full">
      <div className="flex items-center gap-1.5">
        <TrendingUp size={13} className="text-gray-500" />
        <span className="text-gray-700" style={{ fontSize: 11 }}>人脉增长趋势</span>
      </div>
      <div className="flex-1 min-h-[160px]">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400" style={{ fontSize: 12 }}>
            加载中…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} height={22} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} width={36} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Area type="monotone" dataKey="value" stroke="#6b7280" fill="#9ca3af" fillOpacity={0.15} strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

/* ─── NeedsMaintenanceWidget ───────────────────────────────── */
const avatarColors = [
  "#2D2D2D", "#404040", "#525252", "#666666", "#7A7A7A",
  "#383838", "#4A4A4A", "#5C5C5C", "#6E6E6E", "#808080",
]

function getEnergyColor(e: number) {
  if (e >= 70) return "#949494"
  if (e >= 40) return "#6E6E6E"
  if (e >= 20) return "#4A4A4A"
  return "#2D2D2D"
}
function getEnergyLabel(e: number) {
  if (e >= 70) return "暖"
  if (e >= 40) return "温"
  if (e >= 20) return "凉"
  return "冷"
}
function getUrgency(days: number) {
  if (days > 70) return { label: "紧急", color: "#2D2D2D", bg: "rgba(0,0,0,0.08)" }
  if (days > 50) return { label: "注意", color: "#555555", bg: "rgba(0,0,0,0.05)" }
  return { label: "关注", color: "#888888", bg: "rgba(0,0,0,0.04)" }
}

export function NeedsMaintenanceWidget({ stats }: { stats: DashboardStats | null }) {
  const list = stats?.maintenanceList ?? []
  const needsCount = stats?.needsMaintenance ?? 0

  return (
    <div className="border border-gray-300 rounded-xl p-5 bg-white/40 backdrop-blur-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <AlertTriangle size={13} className="text-gray-500" />
          <span className="text-gray-700" style={{ fontSize: 11 }}>需维护人脉</span>
          {stats && (
            <span
              className="ml-1 rounded-full px-1.5 py-[1px]"
              style={{ fontSize: 10, background: "rgba(0,0,0,0.06)", color: "#555555" }}
            >
              {needsCount}人
            </span>
          )}
        </div>
        <span className="text-gray-400" style={{ fontSize: 10 }}>按紧迫度排序 · Top 10</span>
      </div>

      {!stats && (
        <div className="flex-1 flex items-center justify-center text-gray-400" style={{ fontSize: 12 }}>
          加载中…
        </div>
      )}

      {stats && list.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-400" style={{ fontSize: 12 }}>
          所有人脉均在 30 天内联系过 ✓
        </div>
      )}

      {stats && list.length > 0 && (
        <>
          <div className="flex items-center gap-3 px-1 mb-1 shrink-0">
            <span className="w-5 shrink-0 text-center text-gray-400" style={{ fontSize: 10 }}>#</span>
            <span className="w-7 shrink-0" />
            <span className="flex-1 text-gray-400" style={{ fontSize: 10 }}>姓名 / 职位</span>
            <span className="w-[68px] shrink-0 text-right text-gray-400" style={{ fontSize: 10 }}>上次联系</span>
            <span className="w-[110px] shrink-0 text-center text-gray-400" style={{ fontSize: 10 }}>能量值</span>
            <span className="w-10 shrink-0 text-center text-gray-400" style={{ fontSize: 10 }}>紧迫</span>
          </div>
          <div className="shrink-0 mb-1" style={{ borderTop: "1px solid #F0F0F0" }} />

          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {list.map((c, i) => {
              const urgency = getUrgency(c.lastDays)
              const ec = getEnergyColor(c.energyScore)
              const el = getEnergyLabel(c.energyScore)
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-1 py-[7px] rounded-lg hover:bg-white/60 transition-colors cursor-default"
                  style={{ borderBottom: i < list.length - 1 ? "1px solid #F5F5F5" : "none" }}
                >
                  <span className="w-5 shrink-0 text-center text-gray-400 tabular-nums" style={{ fontSize: 10 }}>{c.rank}</span>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{ background: avatarColors[i % avatarColors.length], fontSize: 11, fontWeight: 600 }}
                  >
                    {c.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-800 truncate" style={{ fontSize: 12 }}>{c.name}</div>
                    <div className="text-gray-400 truncate" style={{ fontSize: 10 }}>
                      {[c.title, c.company].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  <div className="w-[68px] shrink-0 text-right">
                    <span className="text-gray-500 tabular-nums" style={{ fontSize: 11 }}>{c.lastDays}天前</span>
                  </div>
                  <div className="w-[110px] shrink-0 flex items-center gap-2">
                    <div className="flex-1 h-[5px] rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${c.energyScore}%`, background: ec, transition: "width 0.4s ease" }}
                      />
                    </div>
                    <span className="tabular-nums shrink-0" style={{ fontSize: 10, color: ec, minWidth: 16 }}>{c.energyScore}</span>
                    <span className="shrink-0" style={{ fontSize: 10, color: ec }}>{el}</span>
                  </div>
                  <div className="w-10 shrink-0 flex justify-center">
                    <span className="rounded px-1.5 py-[2px]" style={{ fontSize: 9, color: urgency.color, background: urgency.bg }}>
                      {urgency.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── TodayExpandWidget ────────────────────────────────────── */
type MatchedContact = { id: string; name: string; company: string }
type ExpandPhase =
  | { kind: "idle" }
  | { kind: "searching" }
  | { kind: "multi"; contacts: MatchedContact[] }
  | { kind: "warmup"; contact: MatchedContact }
  | { kind: "done"; contactName: string; level: number }

export function TodayExpandWidget() {
  const router = useRouter()
  const [inputName, setInputName] = useState("")
  const [phase, setPhase] = useState<ExpandPhase>({ kind: "idle" })
  const [fireLevel, setFireLevel] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setPhase({ kind: "idle" })
    setInputName("")
    setFireLevel(0)
  }

  const handleSearch = async () => {
    const name = inputName.trim()
    if (!name) return
    setPhase({ kind: "searching" })
    try {
      const res = await fetch(`/api/contacts/search-by-name?name=${encodeURIComponent(name)}`)
      const data = await res.json()
      const found: MatchedContact[] = (data.contacts ?? []).map((c: {
        id: string; name?: string; fullName?: string; company?: string; companyName?: string
      }) => ({
        id: c.id,
        name: c.fullName || c.name || "",
        company: c.companyName || c.company || "",
      }))
      if (found.length === 0) {
        router.push(`/contacts/new?name=${encodeURIComponent(name)}`)
        return
      }
      if (found.length === 1) {
        setPhase({ kind: "warmup", contact: found[0] }); setFireLevel(0)
      } else {
        setPhase({ kind: "multi", contacts: found })
      }
    } catch {
      router.push(`/contacts/new?name=${encodeURIComponent(name)}`)
    }
  }

  const handleWarmUp = async (contact: MatchedContact) => {
    if (fireLevel === 0) return
    try {
      await fetch(`/api/contacts/${contact.id}/warm-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: fireLevel }),
      })
      setPhase({ kind: "done", contactName: contact.name, level: fireLevel })
      setTimeout(reset, 3000)
    } catch {}
  }

  // warmup / multi: fill the whole card with a dedicated compact layout
  if (phase.kind === "warmup") {
    return (
      <div className="border border-[#FF7F27]/30 rounded-xl px-3 py-2.5 bg-orange-50/60 backdrop-blur-sm flex flex-col justify-between h-full overflow-hidden">
        {/* Contact + cancel */}
        <div className="flex items-center justify-between shrink-0">
          <span style={{ fontSize: 11 }}>
            <span className="text-gray-800 font-semibold">{phase.contact.name}</span>
            {phase.contact.company && (
              <span className="text-gray-400 ml-1" style={{ fontSize: 10 }}>· {phase.contact.company}</span>
            )}
          </span>
          <button onClick={reset} className="text-gray-400 hover:text-gray-600 cursor-pointer leading-none ml-1 shrink-0" style={{ fontSize: 16 }}>×</button>
        </div>
        {/* Fire picker */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-gray-500 shrink-0 mr-1" style={{ fontSize: 10 }}>本次升温：</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setFireLevel(n)}
              className="transition-all cursor-pointer select-none"
              style={{ fontSize: 17, lineHeight: 1, opacity: fireLevel >= n ? 1 : 0.22, transform: fireLevel === n ? "scale(1.18)" : "scale(1)" }}
              title={`${n} 级升温`}
            >🔥</button>
          ))}
        </div>
        {/* Confirm */}
        <button
          onClick={() => handleWarmUp(phase.contact)}
          disabled={fireLevel === 0}
          className="w-full py-[5px] bg-[#FF7F27] hover:bg-[#e0701f] text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{ fontSize: 11 }}
        >确认升温</button>
      </div>
    )
  }

  if (phase.kind === "multi") {
    return (
      <div className="border border-gray-300 rounded-xl px-3 py-2.5 bg-white/40 backdrop-blur-sm flex flex-col gap-1 h-full overflow-hidden">
        <div className="flex items-center justify-between shrink-0">
          <span className="text-gray-500" style={{ fontSize: 10 }}>找到多位同名，请选择：</span>
          <button onClick={reset} className="text-gray-400 hover:text-gray-600 cursor-pointer leading-none" style={{ fontSize: 16 }}>×</button>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
          {phase.contacts.map((c) => (
            <button
              key={c.id}
              onClick={() => { setPhase({ kind: "warmup", contact: c }); setFireLevel(0) }}
              className="text-left w-full px-2 py-1 rounded-lg bg-white border border-gray-200 hover:border-[#FF7F27]/50 hover:bg-orange-50 transition-colors cursor-pointer shrink-0"
            >
              <span className="text-gray-800" style={{ fontSize: 11, fontWeight: 600 }}>{c.name}</span>
              {c.company && <span className="text-gray-400 ml-1.5" style={{ fontSize: 10 }}>{c.company}</span>}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // idle / searching / done — standard layout
  return (
    <div className="border border-gray-300 rounded-xl px-3 py-2.5 bg-white/40 backdrop-blur-sm flex flex-col justify-between h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-1.5 shrink-0">
        <UserPlus size={12} className="text-[#FF7F27] shrink-0" />
        <span className="text-gray-700 font-medium" style={{ fontSize: 11 }}>今天拓展了什么人脉？</span>
      </div>

      {/* Done state */}
      {phase.kind === "done" ? (
        <div className="flex items-center gap-1.5 shrink-0 px-2 py-1.5 rounded-lg bg-orange-50 border border-[#FF7F27]/20">
          <span style={{ fontSize: 13 }}>✅</span>
          <span className="text-gray-700 truncate" style={{ fontSize: 11 }}>
            <span className="font-semibold">{phase.contactName}</span>{"　"}{"🔥".repeat(phase.level)}
          </span>
        </div>
      ) : (
        /* Search row */
        <div className="flex gap-1.5 shrink-0">
          <input
            ref={inputRef}
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={phase.kind === "searching" ? "搜索中…" : "输入姓名…"}
            disabled={phase.kind === "searching"}
            className="flex-1 bg-white border border-gray-200 px-2.5 py-[5px] text-gray-700 placeholder-gray-400 outline-none focus:border-[#FF7F27]/50 transition-colors rounded-lg disabled:opacity-50"
            style={{ fontSize: 12 }}
          />
          <button
            onClick={handleSearch}
            disabled={!inputName.trim() || phase.kind === "searching"}
            className="px-2.5 py-[5px] bg-[#FF7F27] hover:bg-[#e0701f] text-white rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontSize: 14, lineHeight: 1 }}
            title="确认"
          >✅</button>
        </div>
      )}
    </div>
  )
}
