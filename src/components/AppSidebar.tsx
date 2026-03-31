"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navMain = [
  {
    href: "/",
    label: "首页",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/contacts",
    label: "人脉数据库",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: "/journey",
    label: "人脉航程",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
]

const navAnalytics = [
  { href: "/analytics/energy", label: "能量报告", emoji: "📊" },
  { href: "/analytics/graph", label: "关系图谱", emoji: "🌐" },
  { href: "/analytics/goals", label: "目标设定", emoji: "🎯" },
]

const navRoles = [
  { href: "/contacts?role=BIG_INVESTOR", label: "大金主", color: "bg-amber-400" },
  { href: "/contacts?role=GATEWAY", label: "传送门", color: "bg-blue-400" },
  { href: "/contacts?role=ADVISOR", label: "智囊", color: "bg-violet-400" },
  { href: "/contacts?role=LIGHTHOUSE", label: "灯塔", color: "bg-orange-400" },
  { href: "/contacts?role=COMRADE", label: "战友", color: "bg-green-400" },
  { href: "/contacts?role=THERMOMETER", label: "温度计", color: "bg-rose-400" },
]

export default function AppSidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    const path = href.split("?")[0]
    if (path === "/") return pathname === "/"
    return pathname.startsWith(path)
  }

  return (
    <aside className="w-[220px] fixed left-0 top-12 bottom-0 z-40 bg-zinc-900 flex flex-col overflow-y-auto">
      <div className="px-3 pt-3 pb-1">
        <Link
          href="/contacts/new"
          className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          新增人物标签
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navMain.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
              isActive(item.href)
                ? "bg-zinc-700 text-white font-medium"
                : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
            )}
          >
            <span className={isActive(item.href) ? "text-violet-400" : "text-zinc-500"}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}

        {/* Analytics section */}
        <div className="pt-5">
          <div className="flex items-center justify-between px-3 mb-1.5">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
              深入解析
            </span>
            <button className="text-zinc-600 hover:text-zinc-300 transition-colors text-sm w-4 h-4 flex items-center justify-center">
              +
            </button>
          </div>
          {navAnalytics.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <span className="text-base w-4 text-center">{item.emoji}</span>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Roles section */}
        <div className="pt-4">
          <div className="flex items-center justify-between px-3 mb-1.5">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
              人脉圈
            </span>
            <button className="text-zinc-600 hover:text-zinc-300 transition-colors text-sm w-4 h-4 flex items-center justify-center">
              +
            </button>
          </div>
          {navRoles.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                isActive(item.href.split("?")[0]) && pathname === item.href.split("?")[0]
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.color}`} />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom: invite */}
      <div className="border-t border-zinc-800 p-3">
        <Link
          href="/invite"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          邀请好友
        </Link>
      </div>
    </aside>
  )
}
