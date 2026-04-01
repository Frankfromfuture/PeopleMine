import { requireAuth } from "@/lib/session"
import { db } from "@/lib/db"
import Link from "next/link"
import { RELATION_ROLE_LABELS } from "@/types"
import type { RelationRole, Temperature } from "@/types"
import TestDataGenerator from "./TestDataGenerator"

// ─── helpers ───────────────────────────────────────────────────────────────

function getRoleStyle(role: RelationRole) {
  const map: Record<RelationRole, string> = {
    BIG_INVESTOR: "bg-amber-100 text-amber-700",
    GATEWAY: "bg-blue-100 text-blue-700",
    ADVISOR: "bg-violet-100 text-violet-700",
    THERMOMETER: "bg-rose-100 text-rose-700",
    LIGHTHOUSE: "bg-orange-100 text-orange-700",
    COMRADE: "bg-green-100 text-green-700",
  }
  return map[role] ?? "bg-gray-100 text-gray-600"
}

function getRoleEmoji(role: RelationRole) {
  const map: Record<RelationRole, string> = {
    BIG_INVESTOR: "💰",
    GATEWAY: "🚪",
    ADVISOR: "💡",
    THERMOMETER: "🌡️",
    LIGHTHOUSE: "🏔️",
    COMRADE: "🤝",
  }
  return map[role] ?? "👤"
}

function getRoleDotColor(role: RelationRole) {
  const map: Record<RelationRole, string> = {
    BIG_INVESTOR: "bg-amber-400",
    GATEWAY: "bg-blue-400",
    ADVISOR: "bg-violet-400",
    THERMOMETER: "bg-rose-400",
    LIGHTHOUSE: "bg-orange-400",
    COMRADE: "bg-green-400",
  }
  return map[role] ?? "bg-gray-300"
}

function getTempBadge(temp: Temperature | null) {
  if (!temp) return null
  const map: Record<Temperature, { label: string; cls: string }> = {
    HOT:  { label: "热", cls: "bg-rose-100 text-rose-600" },
    WARM: { label: "温", cls: "bg-amber-100 text-amber-600" },
    COLD: { label: "冷", cls: "bg-blue-100 text-blue-500" },
  }
  return map[temp]
}

function formatLastContact(date: Date | null) {
  if (!date) return "未记录"
  const days = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (days === 0) return "今天"
  if (days === 1) return "昨天"
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })
}

// ─── page ──────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  let userId: string
  try {
    ;({ userId } = await requireAuth())
  } catch {
    // 开发模式：找有联系人的用户，避免 dev-user 与 OTP 创建的用户 ID 不一致
    const withContacts = await db.contact.findFirst({
      select: { userId: true },
      orderBy: { createdAt: 'desc' },
    }).catch(() => null)
    userId = withContacts?.userId ?? 'dev-user'
  }

  let user: { name: string | null; phone: string | null } | null = null
  let allContacts: Awaited<ReturnType<typeof db.contact.findMany>> = []
  let dbError = null

  try {
    const [userData, contactsData] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { name: true, phone: true },
      }),
      db.contact.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      }),
    ])
    user = userData
    allContacts = contactsData
  } catch (error) {
    dbError = error instanceof Error ? error.message : '数据库连接失败'
    console.error('数据库错误:', error)
  }

  const displayName =
    user?.name ||
    (user?.phone ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") : "同学") ||
    "Demo 用户"

  // Stats
  const totalContacts = allContacts.length
  const hotContacts = allContacts.filter((c) => c.temperature === "HOT")
  const coldContacts = allContacts.filter((c) => c.temperature === "COLD")
  const recentContacts = allContacts.slice(0, 6)

  // Role distribution
  const roleCounts = Object.keys(RELATION_ROLE_LABELS).map((role) => ({
    role: role as RelationRole,
    count: allContacts.filter((c) => c.relationRole === role).length,
  }))

  // Greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "早安" : hour < 18 ? "下午好" : "晚上好"

  // Date
  const dateStr = new Date().toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  })

  return (
    <div className="min-h-full">
      {/* ── Database error warning ── */}
      {dbError && (
        <div className="bg-amber-50 border-b border-amber-200 px-8 py-4">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">⚠️ 数据库暂时不可用：</span> {dbError}
          </p>
          <p className="text-xs text-amber-700 mt-1">
            请检查 DATABASE_URL 配置或联系管理员。可以使用「生成测试数据」功能预览功能。
          </p>
        </div>
      )}

      {/* ── Page header ── */}
      <div className="px-8 pt-7 pb-5">
        <p className="text-xs text-gray-400 mb-1">{dateStr}</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            {displayName}，{greeting} 👋
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link
              href="/contacts/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              人物标签页
            </Link>
            <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
              我的人脉
              <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="h-4 w-px bg-gray-200" />
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              {hotContacts.length} 个热联系
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {totalContacts} 位联系人
            </span>
            <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
              自定义
            </button>
          </div>
        </div>
      </div>

      {/* ── Two-column main cards ── */}
      <div className="px-8 pb-6 grid grid-cols-2 gap-5">

        {/* LEFT: 待跟进人脉 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h2 className="font-semibold text-gray-900">待跟进人脉</h2>
            </div>
            <button className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-5 mt-3 gap-5 border-b border-gray-100">
            <button className="pb-2.5 text-sm font-medium text-violet-600 border-b-2 border-violet-600 -mb-px">
              即将联系
            </button>
            <button className="pb-2.5 text-sm text-gray-400 hover:text-gray-600 border-b-2 border-transparent -mb-px transition-colors">
              冷却中
              {coldContacts.length > 0 && (
                <span className="ml-1.5 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                  {coldContacts.length}
                </span>
              )}
            </button>
            <button className="pb-2.5 text-sm text-gray-400 hover:text-gray-600 border-b-2 border-transparent -mb-px transition-colors">
              已互动
            </button>
          </div>

          {/* Contact list */}
          <div className="px-3 py-2">
            {totalContacts === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">👥</div>
                <p className="text-sm text-gray-500 mb-4">还没有任何联系人</p>
                <Link
                  href="/contacts/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  新增第一个联系人
                </Link>
              </div>
            ) : (
              <>
                {recentContacts.map((contact) => {
                  const tempBadge = getTempBadge(contact.temperature as Temperature | null)
                  return (
                    <Link
                      key={contact.id}
                      href={`/contacts/${contact.id}`}
                      className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      {/* Circle checkbox */}
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300 group-hover:border-violet-400 flex-shrink-0 transition-colors" />

                      {/* Avatar */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getRoleStyle(contact.relationRole as RelationRole)}`}>
                        {contact.name.slice(0, 1)}
                      </div>

                      {/* Name + company */}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-800">{contact.name}</span>
                        {contact.company && (
                          <span className="text-xs text-gray-400 ml-1.5">{contact.company}</span>
                        )}
                      </div>

                      {/* Role + temp + date */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {tempBadge && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${tempBadge.cls}`}>
                            {tempBadge.label}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleStyle(contact.relationRole as RelationRole)}`}>
                          {RELATION_ROLE_LABELS[contact.relationRole as RelationRole].name}
                        </span>
                        <span className="text-xs text-gray-400 w-12 text-right">
                          {formatLastContact(contact.lastContactedAt)}
                        </span>
                      </div>
                    </Link>
                  )
                })}

                <Link
                  href="/contacts/new"
                  className="flex items-center gap-2 px-2 py-2 mt-1 text-sm text-gray-400 hover:text-violet-600 transition-colors rounded-lg hover:bg-violet-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  新增联系人
                </Link>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: 人脉分布 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">人脉分布</h2>
            <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              近期
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="p-5">
            {totalContacts === 0 ? (
              <div className="flex flex-col items-center py-8 gap-4">
                <Link
                  href="/contacts/new"
                  className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-violet-300 hover:bg-violet-50 transition-colors group"
                >
                  <svg className="w-6 h-6 text-gray-300 group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </Link>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">建立你的第一个人脉圈</p>
                  <p className="text-xs text-gray-400 mt-1">添加联系人后，这里将显示你的人脉分布</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {roleCounts.map(({ role, count }) => (
                  <Link
                    key={role}
                    href={`/contacts?role=${role}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50 transition-all group"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${getRoleStyle(role)} border border-current border-opacity-20`}>
                      {getRoleEmoji(role)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">
                          {RELATION_ROLE_LABELS[role].name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {RELATION_ROLE_LABELS[role].journeyRole}
                        </span>
                      </div>
                      {/* Mini progress bar */}
                      {totalContacts > 0 && (
                        <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${getRoleDotColor(role)}`}
                            style={{ width: `${(count / totalContacts) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <span className={`text-sm font-bold ${count > 0 ? "text-gray-700" : "text-gray-300"}`}>
                      {count}
                    </span>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Energy stats row ── */}
      <div className="px-8 pb-6">
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: "总联系人",
              value: totalContacts,
              icon: "👥",
              color: "text-violet-600",
              bg: "bg-violet-50",
            },
            {
              label: "热度关系",
              value: hotContacts.length,
              icon: "🔥",
              color: "text-rose-600",
              bg: "bg-rose-50",
            },
            {
              label: "需要维护",
              value: coldContacts.length,
              icon: "❄️",
              color: "text-blue-500",
              bg: "bg-blue-50",
            },
            {
              label: "平均能量",
              value:
                totalContacts > 0
                  ? Math.round(
                      allContacts.reduce((s, c) => s + c.energyScore, 0) /
                        totalContacts
                    )
                  : 0,
              icon: "⚡",
              color: "text-amber-600",
              bg: "bg-amber-50",
              suffix: "",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4"
            >
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center text-xl flex-shrink-0`}>
                {stat.icon}
              </div>
              <div>
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                  {stat.suffix !== undefined ? stat.suffix : ""}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Test Data Generator section (Dev/Demo mode) ── */}
      <div className="px-8 pb-8">
        <TestDataGenerator />
      </div>

      {/* ── Quick features section ── */}
      <div className="px-8 pb-10">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          快速了解人迈
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {FEATURE_CARDS.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-violet-200 hover:shadow-md transition-all group"
            >
              <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center text-2xl mb-4`}>
                {card.emoji}
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1.5">{card.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-xs text-violet-600 group-hover:text-violet-700 font-medium">
                开始使用
                <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

const FEATURE_CARDS = [
  {
    href: "/contacts/new",
    emoji: "⚡",
    iconBg: "bg-violet-100",
    title: "30秒快速录入",
    desc: "简易模式只需姓名 + 角色 + 行业标签，目标录入时间 ≤ 30 秒，随时记录新认识的人。",
  },
  {
    href: "/journey",
    emoji: "🧭",
    iconBg: "bg-blue-100",
    title: "人脉航程分析",
    desc: "告诉 AI 你的目标，它分析你的人脉网络，规划最优路径，并给出个性化沟通建议。",
  },
  {
    href: "/contacts",
    emoji: "⛏️",
    iconBg: "bg-amber-100",
    title: "能量可视化",
    desc: "初次录入半透明，多次互动后清晰立体，长期不联系后自动衰减，感知人脉活跃度。",
  },
]
