"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Command,
  Search,
  Send,
  Shuffle,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"
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

interface MatchedContact {
  id: string
  name: string
  fullName?: string | null
  company?: string | null
  companyName?: string | null
  jobTitle?: string | null
  title?: string | null
}

type AIConnectionStatus = "checking" | "online" | "offline"

const WIDGET_TITLE_CLASS = "text-[13px] font-semibold text-[#232323]"
const WIDGET_BODY_CLASS = "text-[12px] text-gray-700"
const WIDGET_SHELL_CLASS =
  "flex h-full flex-col overflow-hidden rounded-[24px] border border-[#e2e2e2] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
const WIDGET_HEADER_CLASS = "flex min-h-6 items-start justify-between gap-3"
const BTN_PRIMARY_CLASS =
  "inline-flex items-center justify-center gap-1 rounded-[14px] bg-gradient-to-r from-[#1e1e1e] via-[#333333] to-[#595959] text-[12px] font-medium text-white transition hover:from-[#151515] hover:via-[#2a2a2a] hover:to-[#4d4d4d] disabled:cursor-not-allowed disabled:opacity-60"
const BTN_SOLID_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#242424] to-[#464646] text-[12px] font-semibold text-white transition hover:from-[#1d1d1d] hover:to-[#3d3d3d] disabled:cursor-not-allowed disabled:opacity-60"

const SLASH_COMMANDS = [
  { cmd: "/分析人脉", desc: "分析当前人脉结构" },
  { cmd: "/生成报告", desc: "生成本周关系洞察" },
  { cmd: "/推荐连接", desc: "寻找值得拓展的新联系人" },
  { cmd: "/查找同行", desc: "在现有人脉中筛选同业资源" },
  { cmd: "/维护提醒", desc: "安排需要跟进的人脉" },
  { cmd: "/导出数据", desc: "导出当前人脉数据" },
] as const

const WARM_LEVELS = [
  { level: 1, label: "轻触达", desc: "简单问候或同步近况" },
  { level: 2, label: "延续联系", desc: "跟进上次话题" },
  { level: 3, label: "推动关系", desc: "分享信息或主动邀约" },
  { level: 4, label: "关系升温", desc: "进入更深度互动" },
  { level: 5, label: "高强维护", desc: "强连接动作，显著提升热度" },
] as const

const WARM_LEVEL_ICONS: Record<number, React.ElementType> = {
  1: Send,
  2: Shuffle,
  3: Sparkles,
  4: Users,
  5: Zap,
}

function WidgetHeader({
  icon: Icon,
  title,
  end,
}: {
  icon: React.ElementType
  title: string
  end?: React.ReactNode
}) {
  return (
    <div className={WIDGET_HEADER_CLASS}>
      <div className="flex min-w-0 items-center gap-2">
        <Icon size={13} strokeWidth={1.6} className="text-gray-500" />
        <span className={`truncate ${WIDGET_TITLE_CLASS}`}>{title}</span>
      </div>
      {end ? <div className="shrink-0">{end}</div> : null}
    </div>
  )
}

function normalizeContactName(contact: MatchedContact) {
  return contact.fullName || contact.name || "未命名联系人"
}

function normalizeCompany(contact: MatchedContact) {
  return contact.companyName || contact.company || "已有关联人脉"
}

function normalizeTitle(contact: MatchedContact) {
  return contact.title || contact.jobTitle || ""
}

export function StatCard({
  icon: Icon,
  label,
  value,
  headerEnd,
  summary,
}: {
  icon: React.ElementType
  label: string
  value: string
  headerEnd?: React.ReactNode
  summary?: React.ReactNode
}) {
  return (
    <div className={`${WIDGET_SHELL_CLASS} justify-between p-5`}>
      <WidgetHeader icon={Icon} title={label} end={headerEnd} />
      <span
        className="text-gray-900"
        style={{
          fontSize: 52,
          lineHeight: 1,
          fontWeight: 700,
          textShadow: "0 2px 10px rgba(0,0,0,0.08)",
          letterSpacing: -1,
        }}
      >
        {value}
      </span>
      {summary ? <div className="mt-4 flex flex-wrap items-center gap-2">{summary}</div> : null}
    </div>
  )
}

export function AIChatWidget() {
  const [connectionStatus, setConnectionStatus] = useState<AIConnectionStatus>("checking")
  const [messages, setMessages] = useState<{ role: "ai" | "user"; text: string }[]>([
    {
      role: "ai",
      text: "Xminer 已就绪。你可以让我分析人脉结构，或直接生成今天的维护建议。",
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

  useEffect(() => {
    let cancelled = false

    const checkConnection = async () => {
      try {
        const response = await fetch("/api/qwen/status", { cache: "no-store" })
        if (!cancelled) {
          setConnectionStatus(response.ok ? "online" : "offline")
        }
      } catch {
        if (!cancelled) {
          setConnectionStatus("offline")
        }
      }
    }

    checkConnection()

    return () => {
      cancelled = true
    }
  }, [])

  const statusDotClassName =
    connectionStatus === "online"
      ? "bg-[#2f5d46] shadow-[0_0_0_4px_rgba(47,93,70,0.12)] animate-[xminerPulse_1.35s_ease-in-out_infinite]"
      : "bg-gray-400"
  const statusLabel =
    connectionStatus === "online" ? "已连接" : connectionStatus === "offline" ? "未连接" : "检测中"
  const statusShellClassName =
    connectionStatus === "online"
      ? "border border-[#d8e5dd] bg-[#eef5f1] text-[#385645]"
      : connectionStatus === "offline"
        ? "border border-gray-200 bg-gray-100 text-gray-500"
        : "border border-gray-200 bg-white text-gray-500"

  const send = () => {
    const text = input.trim()
    if (!text) return

    setMessages((current) => [
      ...current,
      { role: "user", text },
      {
        role: "ai",
        text: "已收到。我会结合最近互动与关系热度，整理下一步维护建议。",
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
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#2f2f2f]">
            <span className="text-[12px] font-bold tracking-[-0.03em] text-white">X</span>
          </div>
          <span className="text-[13px] font-semibold tracking-[0.02em] text-[#2f2f2f]">Xminer</span>
        </div>

        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-[4px] ${statusShellClassName}`}>
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusDotClassName}`} />
          <span className="text-[11px] font-medium">{statusLabel}</span>
        </div>
      </div>

      <div className="mb-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-1.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "ai" ? (
              <div className="mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded border border-gray-300 bg-gray-100">
                <span className="text-[9px] font-bold text-gray-700">X</span>
              </div>
            ) : null}

            <div
              className={`max-w-[78%] border px-3 py-[7px] ${
                message.role === "user"
                  ? "border-[#444] bg-[#2f2f2f] text-white"
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
          className={`shrink-0 rounded border px-2 py-[7px] transition-colors ${
            showCommands
              ? "border-gray-700 bg-gray-700 text-white"
              : "border-gray-200 bg-white text-gray-500 hover:border-gray-500 hover:text-gray-700"
          }`}
          style={{ borderRadius: 5, fontSize: 12, fontWeight: 600 }}
          title="显示斜杠命令"
        >
          <Command size={14} />
        </button>

        <div className="flex-1 rounded-[14px] border border-gray-200 bg-white px-3 py-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                send()
              }
            }}
            placeholder="询问 Xminer：谁值得优先维护？"
            className="w-full bg-transparent text-[12px] text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>

        <button onClick={send} className={`${BTN_PRIMARY_CLASS} px-3 py-2`}>
          <Send size={13} />
          发送
        </button>

        {showCommands ? (
          <div className="absolute bottom-[calc(100%+8px)] left-0 z-10 w-[280px] rounded-[18px] border border-gray-200 bg-white p-2 shadow-lg">
            {SLASH_COMMANDS.map((item) => (
              <button
                key={item.cmd}
                onClick={() => applyCommand(item.cmd)}
                className="flex w-full items-start justify-between rounded-[12px] px-3 py-2 text-left transition hover:bg-gray-50"
              >
                <span className="text-[12px] font-medium text-gray-700">{item.cmd}</span>
                <span className="ml-3 text-[10px] text-gray-400">{item.desc}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function RandomGeneratorWidget() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const generate = async () => {
    try {
      setLoading(true)
      await fetch("/api/contacts/generate-random", { method: "POST" })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${WIDGET_SHELL_CLASS} p-5`}>
      <WidgetHeader icon={Shuffle} title="测试数据生成" />
      <div className="mt-4 flex flex-1 flex-col justify-between gap-4">
        <p className={`${WIDGET_BODY_CLASS} max-w-[260px]`}>
          用于本地演示或调试，生成后会自动刷新 dashboard 数据。
        </p>
        <button onClick={generate} disabled={loading} className={`${BTN_SOLID_CLASS} w-fit px-4 py-2`}>
          <Shuffle size={14} />
          {loading ? "生成中..." : "生成联系人"}
        </button>
      </div>
    </div>
  )
}

export function ContributionWidget({ stats }: { stats: DashboardStats | null }) {
  return (
    <div className={`${WIDGET_SHELL_CLASS} p-5`}>
      <WidgetHeader icon={Sparkles} title="新增与活跃" />
      <div className="mt-3 flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2">
          <div className="inline-block pl-1 pr-0">
            <ContributionGrid activityData={stats?.dailyActivity} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function TraitsSummaryWidget({ stats }: { stats: DashboardStats | null }) {
  const radarData =
    stats?.radarData ??
    [
      { trait: "社交力", value: 0 },
      { trait: "影响力", value: 0 },
      { trait: "行业深度", value: 0 },
      { trait: "资源整合", value: 0 },
      { trait: "信任度", value: 0 },
      { trait: "活跃度", value: 0 },
    ]

  const industries = stats?.topIndustries?.length ? stats.topIndustries : ["待补充", "待补充"]

  return (
    <div className={`${WIDGET_SHELL_CLASS} p-5`}>
      <WidgetHeader icon={Zap} title="人脉结构画像" />
      <div className="mt-4 grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_190px]">
        <div className="min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="70%">
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="trait" tick={{ fill: "#6b7280", fontSize: 11 }} />
              <Radar dataKey="value" stroke="#3f3f46" fill="#3f3f46" fillOpacity={0.1} strokeWidth={2} />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: "#e5e7eb" }}
                formatter={(value) => [String(value ?? ""), "得分"]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-gray-500">Top 行业</p>
            <div className="flex flex-wrap gap-2">
              {industries.map((item) => (
                <span key={item} className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] text-gray-600">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-gray-200 px-4 py-3">
            <p className="text-[11px] text-gray-500">强关系占比</p>
            <p className="mt-2 text-[34px] font-semibold tracking-tight text-gray-900">
              {stats?.strongRelationPct ?? 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function NetworkTrendWidget({ stats }: { stats: DashboardStats | null }) {
  const data =
    stats?.monthlyGrowth && stats.monthlyGrowth.length > 0
      ? stats.monthlyGrowth
      : Array.from({ length: 12 }, (_, index) => ({ month: `${index + 1}月`, value: 0 }))

  return (
    <div className={`${WIDGET_SHELL_CLASS} p-5`}>
      <WidgetHeader icon={Activity} title="人脉增长趋势" />
      <div className="mt-4 min-h-[180px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="networkTrendFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#3f3f46" stopOpacity={0.16} />
                <stop offset="100%" stopColor="#3f3f46" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#efefef" />
            <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} tickLine={false} axisLine={false} width={34} />
            <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#e5e7eb" }} />
            <Area type="monotone" dataKey="value" stroke="#3f3f46" strokeWidth={2} fill="url(#networkTrendFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function NeedsMaintenanceWidget({ stats }: { stats: DashboardStats | null }) {
  const list = stats?.maintenanceList ?? []

  return (
    <div className={`${WIDGET_SHELL_CLASS} p-5`}>
      <WidgetHeader
        icon={AlertTriangle}
        title="需要维护的人脉"
        end={
          <span className="mt-0.5 rounded-full bg-gray-100 px-2.5 py-[5px] text-[10px] text-gray-600 md:mt-0">
            {`${stats?.needsMaintenance ?? 0} 位待跟进`}
          </span>
        }
      />

      <div className="mt-4 flex flex-1 flex-col gap-2 overflow-y-auto pr-1 md:grid md:grid-cols-2 md:overflow-visible">
        {list.length ? (
          list.map((contact) => (
            <div key={contact.id} className="flex items-center justify-between gap-3 rounded-[18px] border border-gray-200 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400">#{contact.rank}</span>
                  <span className="truncate text-[13px] font-medium text-gray-800">{contact.name}</span>
                </div>
                <p className="mt-1 truncate text-[11px] text-gray-500">
                  {[contact.title, contact.company].filter(Boolean).join(" · ") || "暂无职位与公司信息"}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-[11px] text-gray-500">{`上次联系 ${contact.lastDays} 天前`}</p>
                <p className="mt-1 text-[11px] text-gray-600">{`关系能量 ${contact.energyScore}`}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex h-full min-h-[180px] items-center justify-center rounded-[18px] border border-dashed border-gray-200 text-[12px] text-gray-400 md:col-span-2">
            暂无需要维护的人脉
          </div>
        )}
      </div>
    </div>
  )
}

type TodayPhase =
  | { kind: "idle" }
  | { kind: "searching" }
  | { kind: "multi"; contacts: MatchedContact[] }
  | { kind: "warmup"; contact: MatchedContact }
  | { kind: "done"; contact: MatchedContact; level: number }

export function TodayExpandWidget() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [phase, setPhase] = useState<TodayPhase>({ kind: "idle" })
  const [error, setError] = useState<string | null>(null)

  const selectedSummary = useMemo(() => {
    if (phase.kind !== "warmup" && phase.kind !== "done") return null
    const contact = phase.contact
    return {
      name: normalizeContactName(contact),
      company: normalizeCompany(contact),
      title: normalizeTitle(contact),
    }
  }, [phase])

  const handleSearch = async (event?: React.FormEvent) => {
    event?.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setError(null)
    setPhase({ kind: "searching" })

    try {
      const response = await fetch(`/api/contacts/search-by-name?name=${encodeURIComponent(trimmed)}`)
      const data = (await response.json()) as { contacts?: MatchedContact[] }
      const contacts = data.contacts ?? []

      if (contacts.length === 0) {
        router.push(`/contacts/new?name=${encodeURIComponent(trimmed)}`)
        return
      }

      if (contacts.length === 1) {
        setPhase({ kind: "warmup", contact: contacts[0] })
        return
      }

      setPhase({ kind: "multi", contacts })
    } catch {
      setPhase({ kind: "idle" })
      setError("查找联系人失败，请稍后再试。")
    }
  }

  const handleWarmUp = async (contact: MatchedContact, level: number) => {
    try {
      setError(null)
      await fetch(`/api/contacts/${contact.id}/warm-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      })
      setPhase({ kind: "done", contact, level })
      router.refresh()
    } catch {
      setError("记录维护失败，请稍后重试。")
    }
  }

  const reset = () => {
    setName("")
    setError(null)
    setPhase({ kind: "idle" })
  }

  const isIdleLayout = phase.kind === "idle" && !error

  return (
    <div
      className={`${WIDGET_SHELL_CLASS} p-5`}
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.72), rgba(255,255,255,0.72)), url('/assets/people.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <WidgetHeader icon={Users} title="今天见了谁？" />

      <div
        className={`mt-3 min-h-0 flex flex-1 flex-col ${
          phase.kind === "warmup" ? "overflow-hidden" : "overflow-y-auto"
        } ${isIdleLayout ? "justify-center" : ""}`}
      >
        <form
          onSubmit={handleSearch}
          className={`flex w-full flex-col gap-2 sm:flex-row ${isIdleLayout ? "mx-auto max-w-[560px]" : ""}`}
        >
          <div className="flex min-h-[48px] flex-1 items-center rounded-[16px] border border-gray-200 bg-white px-4">
            <Search size={15} className="mr-2 text-gray-400" />
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="输入姓名"
              className="w-full bg-transparent text-[13px] text-gray-700 outline-none placeholder:text-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={phase.kind === "searching"}
            className={`${BTN_PRIMARY_CLASS} min-h-[48px] rounded-[16px] px-5 text-[13px] font-semibold`}
          >
            {phase.kind === "searching" ? "查找中..." : "开始记录"}
          </button>
        </form>

        {error ? <p className="mt-3 text-[12px] text-gray-600">{error}</p> : null}

        {phase.kind === "multi" ? (
          <div className="mt-3 space-y-2">
            {phase.contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setPhase({ kind: "warmup", contact })}
                className="flex w-full items-center justify-between rounded-[16px] border border-gray-200 px-4 py-3 text-left transition hover:border-gray-400 hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-gray-800">{normalizeContactName(contact)}</p>
                  <p className="mt-1 truncate text-[11px] text-gray-500">
                    {[normalizeTitle(contact), normalizeCompany(contact)].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <ArrowRight size={14} className="shrink-0 text-gray-400" />
              </button>
            ))}
          </div>
        ) : null}

        {phase.kind === "warmup" ? (
          <div className="mt-3 flex-1">
            <div className="mb-3">
              <p className="text-[14px] font-medium text-gray-900">{selectedSummary?.name}</p>
              <p className="mt-1 text-[11px] text-gray-500">
                {[selectedSummary?.title, selectedSummary?.company].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="mt-auto grid grid-cols-5 gap-2">
              {WARM_LEVELS.map((item) => {
                const Icon = WARM_LEVEL_ICONS[item.level] ?? Sparkles

                return (
                  <button
                    key={item.level}
                    onClick={() => handleWarmUp(phase.contact, item.level)}
                    title={item.desc}
                    className="rounded-[14px] border border-gray-200 bg-white px-2 py-2 text-center transition hover:border-gray-400 hover:bg-gray-50"
                  >
                    <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                      <Icon size={14} />
                    </div>
                    <p className="mt-1 truncate text-[11px] font-medium text-gray-800">{item.label}</p>
                    <p className="text-[10px] text-gray-500">{`Lv.${item.level}`}</p>
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        {phase.kind === "done" ? (
          <div className="mt-3 flex flex-1 flex-col justify-between">
            <div>
              <span className="inline-flex rounded-full border border-gray-300 px-3 py-1 text-[11px] text-gray-700">
                {`已记录维护 · Lv.${phase.level}`}
              </span>
              <div className="mt-3">
                <p className="text-[15px] font-medium text-gray-900">{selectedSummary?.name}</p>
                <p className="mt-1 text-[11px] text-gray-500">
                  {[selectedSummary?.title, selectedSummary?.company].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>

            <button
              onClick={reset}
              className="mt-4 inline-flex w-fit items-center rounded-full border border-gray-200 px-4 py-2 text-[12px] font-medium text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
            >
              继续记录
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
