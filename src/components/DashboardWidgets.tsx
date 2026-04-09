"use client"

import React, { useEffect, useRef, useState } from "react"
export { default as RelationStrengthPanel } from "./RelationStrengthPanel"
import { useRouter } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Command,
  Send,
  Shuffle,
  Sparkles,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"
export { Users, Zap, AlertTriangle }
import { ContributionGrid } from "./ContributionGrid"
import {
  Area,
  AreaChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

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

const WIDGET_TITLE_CLASS = "text-[13px] font-semibold text-[#2f2f2f]"
const WIDGET_META_CLASS = "text-[11px] text-gray-500"
const WIDGET_BODY_CLASS = "text-[12px] text-gray-700"
const WIDGET_SHELL_CLASS =
  "widget-shell flex h-full flex-col overflow-hidden rounded-[24px] border border-[#e5e5e5] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
const WIDGET_HEADER_CLASS = "flex min-h-6 items-start justify-between gap-3"
const WIDGET_MUTED_PANEL_CLASS = "rounded-[24px] border border-[#ececec] bg-[#fafafa]"

function WidgetHeader({
  icon: Icon,
  title,
  meta,
  accent = false,
  end,
}: {
  icon: React.ElementType
  title: string
  meta?: string
  accent?: boolean
  end?: React.ReactNode
}) {
  return (
    <div className={WIDGET_HEADER_CLASS}>
      <div className="flex min-w-0 items-center gap-2">
        <Icon size={13} strokeWidth={1.6} className={accent ? "text-[#A04F47]" : "text-gray-500"} />
        <div className="flex min-w-0 flex-col gap-[2px] leading-none">
          <span className={`truncate ${WIDGET_TITLE_CLASS}`}>{title}</span>
          {meta ? <span className={`truncate ${WIDGET_META_CLASS}`}>{meta}</span> : null}
        </div>
      </div>
      {end ? <div className="shrink-0">{end}</div> : null}
    </div>
  )
}

export function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  headerEnd,
  summary,
  trend,
}: {
  icon: React.ElementType
  label: string
  value: string
  accent?: boolean
  headerEnd?: React.ReactNode
  summary?: React.ReactNode
  trend?: { direction: "up" | "down"; percent: number }
}) {
  return (
    <div className={`${WIDGET_SHELL_CLASS} justify-between p-5`}>
      <WidgetHeader icon={Icon} title={label} accent={accent} end={headerEnd} />
      <span
        className={accent ? "text-[#A04F47]" : "text-gray-800"}
        style={{
          fontSize: 52,
          lineHeight: 1,
          fontWeight: 700,
          textShadow: accent
            ? "0 2px 12px rgba(160,79,71,0.35), 0 1px 3px rgba(0,0,0,0.12)"
            : "0 2px 12px rgba(0,0,0,0.13), 0 1px 3px rgba(0,0,0,0.08)",
          letterSpacing: -1,
        }}
      >
        {value}
      </span>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {summary}
        {trend ? (
          <div className="inline-flex items-center gap-1 self-start rounded-full bg-black/[0.045] px-2 py-[4px]">
            {trend.direction === "up" ? (
              <TrendingUp size={10} className="shrink-0 text-gray-400" />
            ) : (
              <TrendingDown size={10} className="shrink-0 text-gray-400" />
            )}
            <span className="whitespace-nowrap text-[10px] text-gray-500">
              较上周{trend.direction === "up" ? "增加" : "减少"}{" "}
              {trend.direction === "up" ? "+" : "-"}
              {trend.percent}%
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

const SLASH_COMMANDS = [
  { cmd: "/分析人脉", desc: "分析你当前的人脉网络结构" },
  { cmd: "/生成报告", desc: "生成本周关系洞察摘要" },
  { cmd: "/推荐连接", desc: "寻找值得拓展的新联系人" },
  { cmd: "/查找同行", desc: "在现有人脉中筛选同行资源" },
  { cmd: "/维护提醒", desc: "安排需要跟进的人脉维护计划" },
  { cmd: "/导出数据", desc: "导出当前人脉资产数据" },
]

export function AIChatWidget() {
  const [messages, setMessages] = useState<{ role: "ai" | "user"; text: string }[]>([
    {
      role: "ai",
      text: "你好，我是 Xminer。这里可以快速分析人脉网络、生成关系洞察，并协助你决定下一步该联系谁。",
    },
  ])
  const [input, setInput] = useState("")
  const [showCommands, setShowCommands] = useState(false)
  const cmdRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (cmdRef.current && !cmdRef.current.contains(event.target as Node)) {
        setShowCommands(false)
      }
    }

    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const send = () => {
    const text = input.trim()
    if (!text) return

    setMessages((current) => [
      ...current,
      { role: "user", text },
      {
        role: "ai",
        text: "从当前数据看，你的强连接主要集中在科技行业，建议优先补足金融和医疗方向的人脉，这样网络多样性会更健康。",
      },
    ])
    setInput("")
    setShowCommands(false)
  }

  const applyCommand = (cmd: string) => {
    setInput(`${cmd} `)
    setShowCommands(false)
  }

  return (
    <div className={`${WIDGET_SHELL_CLASS} p-5`}>
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#A04F47]">
            <span className="text-[12px] font-bold tracking-[-0.03em] text-white">X</span>
          </div>
          <div className="flex flex-col gap-[2px] leading-none">
            <span className="text-[13px] font-semibold tracking-[0.02em] text-[#2f2f2f]">Xminer</span>
            <span className={WIDGET_META_CLASS}>PeopleMine AI 助手</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-[3px]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400" />
          <span className={WIDGET_META_CLASS}>在线</span>
        </div>
      </div>

      <div className="mb-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-1.5 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "ai" ? (
              <div className="mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#A04F47]/25 bg-[#A04F47]/12">
                <span className="text-[9px] font-bold text-[#A04F47]">X</span>
              </div>
            ) : null}

            <div
              className={`max-w-[78%] border px-3 py-[7px] ${
                message.role === "user"
                  ? "border-[#444] bg-[#2e2e2e] text-white"
                  : "border-gray-200 bg-white text-gray-700"
              }`}
              style={{ fontSize: 12, lineHeight: 1.55, borderRadius: 5 }}
            >
              {message.text}
            </div>
          </div>
        ))}
      </div>

      <div className="relative flex shrink-0 gap-1.5" ref={cmdRef}>
        <button
          onClick={() => setShowCommands((value) => !value)}
          className={`shrink-0 cursor-pointer select-none rounded border px-2 py-[7px] transition-colors ${
            showCommands
              ? "border-[#A04F47] bg-[#A04F47] text-white"
              : "border-gray-200 bg-white text-gray-500 hover:border-[#A04F47]/60 hover:text-[#A04F47]"
          }`}
          style={{ borderRadius: 5, fontSize: 12, fontWeight: 600 }}
          title="斜线命令"
        >
          <span style={{ fontSize: 13, lineHeight: 1 }}>/</span>
        </button>

        {showCommands ? (
          <div
            className="absolute bottom-full left-0 z-50 mb-1.5 w-64 overflow-hidden rounded-[7px] border border-gray-200 bg-white shadow-lg"
          >
            <div className="flex items-center gap-1.5 border-b border-gray-100 px-3 py-2">
              <Command size={10} className="text-gray-400" />
              <span className={WIDGET_META_CLASS}>快捷命令</span>
            </div>

            {SLASH_COMMANDS.map((command) => (
              <button
                key={command.cmd}
                onClick={() => applyCommand(command.cmd)}
                className="flex w-full cursor-pointer items-start gap-2.5 px-3 py-[7px] text-left transition-colors hover:bg-gray-50"
              >
                <span
                  className="shrink-0 text-[#A04F47]"
                  style={{ fontSize: 11, fontWeight: 600, minWidth: 72 }}
                >
                  {command.cmd}
                </span>
                <span className="text-[10px] leading-[1.45] text-gray-400">{command.desc}</span>
              </button>
            ))}
          </div>
        ) : null}

        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") send()
          }}
          placeholder="向 Xminer 提问，或输入 / 使用命令"
          className="flex-1 rounded border border-gray-200 bg-white px-3 py-[7px] text-[12px] text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-[#A04F47]/50"
          style={{ borderRadius: 5 }}
        />

        <button
          onClick={send}
          className="flex shrink-0 cursor-pointer items-center justify-center rounded bg-[#A04F47] px-3 py-[7px] text-white transition-colors hover:bg-[#A04F47]"
          style={{ borderRadius: 5 }}
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  )
}

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
        body: JSON.stringify({ count, randomness }),
      })
    } catch {
      // ignore demo tool errors
    } finally {
      setGenerating(false)
    }
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
      <span className={`flex-1 truncate ${WIDGET_META_CLASS}`}>{label}</span>
      <button
        onClick={onDec}
        className="flex h-5 w-5 cursor-pointer select-none items-center justify-center rounded bg-gray-100 text-[13px] leading-none text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
      >
        -
      </button>
      <span className="min-w-7 text-center text-[12px] text-gray-800">
        {value}
        {unit}
      </span>
      <button
        onClick={onInc}
        className="flex h-5 w-5 cursor-pointer select-none items-center justify-center rounded bg-gray-100 text-[13px] leading-none text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
      >
        +
      </button>
    </div>
  )

  return (
    <div className={`${WIDGET_SHELL_CLASS} justify-between px-4 py-4`}>
      <div className="flex items-center gap-1.5">
        <Shuffle size={13} className="shrink-0 text-gray-500" />
        <span className={`truncate ${WIDGET_TITLE_CLASS}`}>随机生成测试人脉</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <StepRow
          label="生成数量"
          value={count}
          onDec={() => setCount((current) => Math.max(1, current - 5))}
          onInc={() => setCount((current) => Math.min(100, current + 5))}
        />
        <StepRow
          label="标签波动度"
          value={randomness}
          unit="%"
          onDec={() => setRandomness((current) => Math.max(0, current - 5))}
          onInc={() => setRandomness((current) => Math.min(100, current + 5))}
        />
      </div>

      <button
        onClick={generate}
        disabled={generating}
        className="w-full cursor-pointer rounded-lg bg-gray-200 py-1 text-[10px] text-gray-600 transition-colors hover:bg-gray-300 disabled:opacity-60"
      >
        {generating ? "生成中..." : "一键生成"}
      </button>
    </div>
  )
}

export function ContributionWidget({ stats }: { stats: DashboardStats | null }) {
  return (
    <div className={`${WIDGET_SHELL_CLASS} gap-2 p-5`}>
      <WidgetHeader
        icon={Activity}
        title="人脉记录"
        end={
          stats ? <span className={`tabular-nums ${WIDGET_META_CLASS}`}>共 {stats.total} 位</span> : null
        }
      />

      <div className="min-h-0 flex-1 overflow-hidden">
        <div
          className="h-full overflow-x-auto overflow-y-hidden pb-3 pr-1"
          style={{ scrollbarGutter: "stable both-edges" }}
        >
          <div className="inline-block min-w-max">
            <ContributionGrid activityData={stats?.dailyActivity} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function TraitsSummaryWidget({ stats }: { stats: DashboardStats | null }) {
  const radar = stats?.radarData ?? [
    { trait: "社交力", value: 0 },
    { trait: "影响力", value: 0 },
    { trait: "行业深度", value: 0 },
    { trait: "资源整合", value: 0 },
    { trait: "信任度", value: 0 },
    { trait: "活跃度", value: 0 },
  ]

  const industries = stats?.topIndustries ?? []
  const strongPct = stats?.strongRelationPct ?? 0
  const diversityCount = new Set(industries).size

  const traits = [
    { label: "核心行业", value: industries.length > 0 ? industries.join(" / ") : "暂无数据" },
    { label: "高强度关系", value: stats ? `${strongPct}% 为高能量连接` : "--" },
    { label: "行业多样性", value: stats ? `${diversityCount} 个主要行业` : "--" },
    { label: "人脉总量", value: stats ? `${stats.total} 位联系人` : "--" },
  ]

  const insightText = stats
    ? industries.length > 0
      ? `你的人脉网络目前以${industries[0]}为主要重心，高强度连接占比为 ${strongPct}%。${
          stats.needsMaintenance > 0
            ? `当前仍有 ${stats.needsMaintenance} 位联系人超过 30 天未跟进，适合优先安排维护。`
            : "最近的人脉维护状态稳定，可以开始寻找新的连接机会。"
        }`
      : "当前样本还不够丰富，继续补充联系人后，这里会给出更清晰的人脉画像。"
    : "加载中..."

  return (
    <div className={`${WIDGET_SHELL_CLASS} gap-3 p-5`}>
      <WidgetHeader icon={Sparkles} title="人脉特征总结" />

      <div className="flex shrink-0 gap-3">
        <div className="flex-1" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radar}>
              <PolarGrid stroke="#d1d5db" />
              <PolarAngleAxis dataKey="trait" tick={{ fontSize: 12, fill: "#6b7280" }} />
              <Radar
                name="traits"
                dataKey="value"
                stroke="#A04F47"
                fill="#A04F47"
                fillOpacity={0.15}
                strokeWidth={1.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-1 flex-col justify-start">
          {traits.map((item) => (
            <div key={item.label} className="border-b border-gray-200 py-2">
              <div className={`text-left ${WIDGET_META_CLASS}`}>{item.label}</div>
              <div className={`truncate text-left ${WIDGET_BODY_CLASS}`}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={`relative flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4 ${WIDGET_MUTED_PANEL_CLASS}`}>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-2 top-[-8px] select-none text-gray-600"
          style={{
            fontSize: 80,
            lineHeight: 1,
            fontWeight: 800,
            opacity: 0.07,
            fontFamily: "Georgia, serif",
          }}
        >
          &ldquo;
        </span>

        <div className="relative z-10 mb-3 flex shrink-0 items-center gap-1.5">
          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#A04F47]">
            <span className="text-[9px] font-bold text-white">X</span>
          </div>
          <span className={WIDGET_TITLE_CLASS}>Xminer 洞察</span>
        </div>

        <div className="relative z-10 pl-1 text-left text-[12px] leading-[1.75] text-gray-600">
          {insightText}
        </div>
      </div>
    </div>
  )
}

export function NetworkTrendWidget({ stats }: { stats: DashboardStats | null }) {
  const data = stats?.monthlyGrowth ?? []

  return (
    <div className={`${WIDGET_SHELL_CLASS} gap-3 p-5`}>
      <WidgetHeader icon={TrendingUp} title="人脉增长趋势" />

      <div className="min-h-[160px] flex-1">
        {data.length === 0 ? (
          <div className={`flex h-full items-center justify-center ${WIDGET_BODY_CLASS}`}>加载中...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                height={22}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                labelFormatter={(label) => `${label}`}
                formatter={(value) => [`${value} 位`, "联系人累计数"]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#6b7280"
                fill="#9ca3af"
                fillOpacity={0.15}
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

const avatarColors = [
  "#2D2D2D",
  "#404040",
  "#525252",
  "#666666",
  "#7A7A7A",
  "#383838",
  "#4A4A4A",
  "#5C5C5C",
  "#6E6E6E",
  "#808080",
]

function getEnergyColor(energy: number) {
  if (energy >= 70) return "#949494"
  if (energy >= 40) return "#6E6E6E"
  if (energy >= 20) return "#4A4A4A"
  return "#2D2D2D"
}

function getEnergyLabel(energy: number) {
  if (energy >= 70) return "高"
  if (energy >= 40) return "中"
  if (energy >= 20) return "低"
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
    <div className={`${WIDGET_SHELL_CLASS} p-5`}>
      <div className="mb-3">
        <WidgetHeader
          icon={AlertTriangle}
          title="需要维护的人脉"
          end={<span className={WIDGET_META_CLASS}>按最久未联系排序 · Top 10</span>}
        />
        {stats ? (
          <span
            className="mt-2 inline-flex rounded-full px-2 py-[3px] text-[10px]"
            style={{ background: "rgba(0,0,0,0.06)", color: "#555555" }}
          >
            {needsCount} 位待跟进
          </span>
        ) : null}
      </div>

      {!stats ? (
        <div className={`flex flex-1 items-center justify-center ${WIDGET_BODY_CLASS}`}>加载中...</div>
      ) : null}

      {stats && list.length === 0 ? (
        <div className={`flex flex-1 items-center justify-center ${WIDGET_BODY_CLASS}`}>
          所有人脉都在 30 天内联系过了
        </div>
      ) : null}

      {stats && list.length > 0 ? (
        <>
          <div className="mb-1 flex shrink-0 items-center gap-3 px-1">
            <span className="w-5 shrink-0 text-center text-[10px] text-gray-400">#</span>
            <span className="w-7 shrink-0" />
            <span className="flex-1 text-[10px] text-gray-400">姓名 / 职位</span>
            <span className="w-[68px] shrink-0 text-right text-[10px] text-gray-400">上次联系</span>
            <span className="w-[110px] shrink-0 text-center text-[10px] text-gray-400">关系能量</span>
            <span className="w-10 shrink-0 text-center text-[10px] text-gray-400">状态</span>
          </div>
          <div className="mb-1 shrink-0 border-t border-[#F0F0F0]" />

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {list.map((contact, index) => {
              const urgency = getUrgency(contact.lastDays)
              const energyColor = getEnergyColor(contact.energyScore)
              const energyLabel = getEnergyLabel(contact.energyScore)

              return (
                <div
                  key={contact.id}
                  className="flex cursor-default items-center gap-3 rounded-lg px-1 py-[7px] transition-colors hover:bg-white/60"
                  style={{
                    borderBottom: index < list.length - 1 ? "1px solid #F5F5F5" : "none",
                  }}
                >
                  <span className="w-5 shrink-0 text-center text-[10px] tabular-nums text-gray-400">
                    {contact.rank}
                  </span>

                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{ background: avatarColors[index % avatarColors.length] }}
                  >
                    {contact.name[0]}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] text-gray-800">{contact.name}</div>
                    <div className="truncate text-[10px] text-gray-400">
                      {[contact.title, contact.company].filter(Boolean).join(" · ") || "--"}
                    </div>
                  </div>

                  <div className="w-[68px] shrink-0 text-right">
                    <span className="text-[11px] tabular-nums text-gray-500">{contact.lastDays} 天前</span>
                  </div>

                  <div className="flex w-[110px] shrink-0 items-center gap-2">
                    <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${contact.energyScore}%`,
                          background: energyColor,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                    <span
                      className="min-w-4 shrink-0 text-[10px] tabular-nums"
                      style={{ color: energyColor }}
                    >
                      {contact.energyScore}
                    </span>
                    <span className="shrink-0 text-[10px]" style={{ color: energyColor }}>
                      {energyLabel}
                    </span>
                  </div>

                  <div className="flex w-10 shrink-0 justify-center">
                    <span
                      className="rounded px-1.5 py-[2px] text-[9px]"
                      style={{ color: urgency.color, background: urgency.bg }}
                    >
                      {urgency.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}

type MatchedContact = { id: string; name: string; company: string }
type ExpandPhase =
  | { kind: "idle" }
  | { kind: "searching" }
  | { kind: "multi"; contacts: MatchedContact[] }
  | { kind: "warmup"; contact: MatchedContact }
  | { kind: "done"; contactName: string; level: number }

const WARM_LEVEL_LABELS = ["轻触达", "重新连上", "深入交流", "关系升温", "合作推进"]

export function TodayExpandWidget() {
  const router = useRouter()
  const [inputName, setInputName] = useState("")
  const [phase, setPhase] = useState<ExpandPhase>({ kind: "idle" })
  const [warmLevel, setWarmLevel] = useState(0)

  const reset = () => {
    setPhase({ kind: "idle" })
    setInputName("")
    setWarmLevel(0)
  }

  const handleSearch = async () => {
    const name = inputName.trim()
    if (!name) return

    setPhase({ kind: "searching" })
    try {
      const response = await fetch(`/api/contacts/search-by-name?name=${encodeURIComponent(name)}`)
      const data = await response.json()
      const found: MatchedContact[] = (data.contacts ?? []).map(
        (contact: { id: string; name?: string; fullName?: string; company?: string; companyName?: string }) => ({
          id: contact.id,
          name: contact.fullName || contact.name || "",
          company: contact.companyName || contact.company || "",
        }),
      )

      if (found.length === 0) {
        router.push(`/contacts/new?name=${encodeURIComponent(name)}`)
        return
      }

      if (found.length === 1) {
        setPhase({ kind: "warmup", contact: found[0] })
        setWarmLevel(0)
        return
      }

      setPhase({ kind: "multi", contacts: found })
    } catch {
      router.push(`/contacts/new?name=${encodeURIComponent(name)}`)
    }
  }

  const handleWarmUp = async (contact: MatchedContact) => {
    if (warmLevel === 0) return

    try {
      await fetch(`/api/contacts/${contact.id}/warm-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: warmLevel }),
      })
      setPhase({ kind: "done", contactName: contact.name, level: warmLevel })
      setTimeout(reset, 3000)
    } catch {
      // ignore optimistic demo errors
    }
  }

  const renderTitle = (meta: string) => (
    <div className="mb-4">
      <div className="text-[20px] font-semibold tracking-[-0.04em] text-[#272727]">今天拓展了谁？</div>
      <div className={`mt-1 ${WIDGET_META_CLASS}`}>{meta}</div>
    </div>
  )

  if (phase.kind === "warmup") {
    return (
      <div className={`${WIDGET_SHELL_CLASS} p-5`}>
        {renderTitle("选一个升温等级，记下这次推进")}

        <div className="flex min-h-0 flex-1 flex-col justify-between gap-4">
          <div className={`p-4 ${WIDGET_MUTED_PANEL_CLASS}`}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-[18px] font-semibold tracking-[-0.03em] text-[#272727]">
                  {phase.contact.name}
                </div>
                <div className={`mt-1 ${WIDGET_META_CLASS}`}>
                  {phase.contact.company || "已有联系人"} · 这次准备把关系往前推进一点
                </div>
              </div>
              <button
                onClick={reset}
                className="shrink-0 cursor-pointer leading-none text-gray-400 transition-colors hover:text-gray-600"
                style={{ fontSize: 16 }}
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setWarmLevel(level)}
                  className={`cursor-pointer rounded-[16px] border px-0 py-2 text-center transition ${
                    warmLevel >= level
                      ? "border-[#A04F47] bg-[#A04F47] text-white"
                      : "border-gray-200 bg-white text-gray-500 hover:border-[#A04F47]/40 hover:text-[#A04F47]"
                  }`}
                  title={`${level} 级升温`}
                >
                  <div className="text-[14px] font-semibold leading-none">{level}</div>
                  <div className="mt-1 text-[9px] leading-none opacity-80">
                    {WARM_LEVEL_LABELS[level - 1]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3">
            <span className={WIDGET_META_CLASS}>
              {warmLevel > 0
                ? `已选择 ${warmLevel} 级 · ${WARM_LEVEL_LABELS[warmLevel - 1]}`
                : "先选一个升温强度，再完成记录"}
            </span>
            <button
              onClick={() => handleWarmUp(phase.contact)}
              disabled={warmLevel === 0}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full bg-[#A04F47] px-4 py-2 text-[11px] font-medium text-white transition-colors hover:bg-[#A04F47] disabled:cursor-not-allowed disabled:opacity-40"
            >
              确认记录
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase.kind === "multi") {
    return (
      <div className={`${WIDGET_SHELL_CLASS} p-5`}>
        {renderTitle("找到多位同名联系人，请选择一位")}

        <div className={`flex min-h-0 flex-1 flex-col gap-2 p-2 ${WIDGET_MUTED_PANEL_CLASS}`}>
          <div className="mb-1 flex items-center justify-end">
            <button
              onClick={reset}
              className="cursor-pointer leading-none text-gray-400 transition-colors hover:text-gray-600"
              style={{ fontSize: 16 }}
            >
              ×
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {phase.contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => {
                  setPhase({ kind: "warmup", contact })
                  setWarmLevel(0)
                }}
                  className="w-full cursor-pointer rounded-[16px] border border-gray-200 bg-white px-3 py-3 text-left transition-colors hover:border-[#A04F47]/35 hover:bg-[#A04F47]/5"
              >
                <div className={`font-medium ${WIDGET_BODY_CLASS}`}>{contact.name}</div>
                <div className={`mt-1 ${WIDGET_META_CLASS}`}>{contact.company || "未填写公司"}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${WIDGET_SHELL_CLASS} p-5`}>
      {phase.kind === "done" ? (
        <>
          {renderTitle("今天的推进已经记录完成")}

          <div className="flex min-h-0 flex-1 flex-col justify-between gap-4">
            <div className="text-[18px] font-semibold tracking-[-0.03em] text-[#272727]">
              {phase.contactName}
            </div>
            <div className={`inline-flex w-fit rounded-full bg-[#fff3ea] px-3 py-1 text-[11px] text-[#A04F47]`}>
              本次升温 {phase.level} 级 · {WARM_LEVEL_LABELS[phase.level - 1]}
            </div>

            <button
              onClick={reset}
              className="inline-flex w-fit cursor-pointer items-center gap-1 rounded-full border border-gray-200 bg-white px-4 py-2 text-[11px] text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-800"
            >
              继续记录
              <ArrowRight size={12} />
            </button>
          </div>
        </>
      ) : (
        <>
          {renderTitle("输入姓名，已存在就直接记录升温；还没建档的人脉，会跳转去创建。")}

          <div className={`flex min-h-0 flex-1 flex-col justify-center p-4 ${WIDGET_MUTED_PANEL_CLASS}`}>
            <div className="flex items-center gap-2 rounded-[18px] border border-gray-200 bg-white px-3 py-2">
              <Search size={14} className="shrink-0 text-gray-400" />
              <input
                value={inputName}
                onChange={(event) => setInputName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch()
                }}
                placeholder={phase.kind === "searching" ? "搜索中..." : "输入联系人姓名"}
                disabled={phase.kind === "searching"}
                className="min-w-0 flex-1 bg-transparent text-[13px] text-gray-700 outline-none placeholder:text-gray-400 disabled:opacity-50"
              />
              <button
                onClick={handleSearch}
                disabled={!inputName.trim() || phase.kind === "searching"}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full bg-[#A04F47] px-3 py-2 text-[11px] font-medium text-white transition-colors hover:bg-[#A04F47] disabled:cursor-not-allowed disabled:opacity-40"
                title="开始记录"
              >
                {phase.kind === "searching" ? "搜索中" : "开始记录"}
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
