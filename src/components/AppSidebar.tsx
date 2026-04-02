"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type MouseEvent as ReactMouseEvent, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const IS_DEV = process.env.NODE_ENV === 'development'

export default function AppSidebar() {
  const pathname = usePathname()
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const [rolesOpen, setRolesOpen] = useState(false)
  const [width, setWidth] = useState(220)

  useEffect(() => {
    const saved = Number(localStorage.getItem("pm-sidebar-width") ?? "220")
    const initial = Number.isFinite(saved) ? Math.min(360, Math.max(180, saved)) : 220
    setWidth(initial)
    document.documentElement.style.setProperty("--sidebar-width", `${initial}px`)
  }, [])

  function startResize(e: ReactMouseEvent<HTMLDivElement>) {
    e.preventDefault()
    const startX = e.clientX
    const startW = width
    let latest = startW
    const onMove = (ev: MouseEvent) => {
      const next = Math.min(360, Math.max(180, startW + (ev.clientX - startX)))
      latest = next
      setWidth(next)
      document.documentElement.style.setProperty("--sidebar-width", `${next}px`)
    }
    const onUp = () => {
      localStorage.setItem("pm-sidebar-width", String(latest))
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }

  function isActive(href: string) {
    const path = href.split("?")[0]
    if (path === "/") return pathname === "/"
    // /resources 也匹配 /contacts/* 和 /companies/* 子路由
    if (path === "/resources") {
      return pathname.startsWith("/resources") || pathname.startsWith("/contacts") || pathname.startsWith("/companies")
    }
    return pathname.startsWith(path)
  }

  const navMain = [
    {
      href: "/dashboard",
      label: "首页",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: "/me",
      label: "我",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      href: "/resources",
      label: "资源数据库",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
    },
    {
      href: "/journey",
      label: "航程分析",
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
    { href: "/resources?type=contacts&role=BIG_INVESTOR", label: "大金主", color: "bg-amber-400" },
    { href: "/resources?type=contacts&role=GATEWAY", label: "传送门", color: "bg-blue-400" },
    { href: "/resources?type=contacts&role=ADVISOR", label: "智囊", color: "bg-violet-400" },
    { href: "/resources?type=contacts&role=LIGHTHOUSE", label: "灯塔", color: "bg-orange-400" },
    { href: "/resources?type=contacts&role=COMRADE", label: "战友", color: "bg-green-400" },
    { href: "/resources?type=contacts&role=THERMOMETER", label: "温度计", color: "bg-rose-400" },
  ]

  return (
    <aside
      className="fixed left-0 top-12 bottom-0 z-40 flex flex-col overflow-y-auto border-r border-slate-200/80 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 shadow-[inset_-1px_0_0_rgba(148,163,184,0.25)]"
      style={{ width }}
    >
      <div className="px-3 pt-3 pb-1 space-y-1.5">
        <motion.div whileTap={{ scale: 0.98 }}>
          <Link
            href="/contacts/new"
            className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            新增
          </Link>
        </motion.div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navMain.map((item) => (
          <motion.div key={item.href} whileHover={{ x: 2 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}>
            <Link
              href={item.href}
              className={cn(
                "relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive(item.href)
                  ? "bg-white text-slate-900 font-medium border border-slate-200"
                  : "text-slate-600 hover:bg-white hover:text-slate-900"
              )}
            >
              {isActive(item.href) && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-violet-500" />}
              <span className={isActive(item.href) ? "text-violet-500" : "text-slate-400"}>{item.icon}</span>
              {item.label}
            </Link>
          </motion.div>
        ))}

        <div className="pt-4">
          <button
            onClick={() => setAnalyticsOpen((o) => !o)}
            className="flex items-center justify-between w-full px-3 mb-1.5 group"
          >
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">
              深入解析
            </span>
            <span className={cn("text-slate-400 group-hover:text-slate-600 transition-transform text-xs", analyticsOpen && "rotate-180")}>
              ▼
            </span>
          </button>
          {analyticsOpen && navAnalytics.map((item) => (
            <motion.div key={item.href} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
              <Link
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-white hover:text-slate-800 transition-colors"
              >
                <span className="text-base w-4 text-center">{item.emoji}</span>
                {item.label}
              </Link>
            </motion.div>
          ))}
          {!analyticsOpen && <p className="px-3 text-xs text-slate-400">点击展开</p>}
        </div>

        <div className="pt-3">
          <button
            onClick={() => setRolesOpen((o) => !o)}
            className="flex items-center justify-between w-full px-3 mb-1.5 group"
          >
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">
              人脉圈
            </span>
            <span className={cn("text-slate-400 group-hover:text-slate-600 transition-transform text-xs", rolesOpen && "rotate-180")}>
              ▼
            </span>
          </button>
          {rolesOpen && navRoles.map((item) => (
            <motion.div key={item.href} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
              <Link
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-white hover:text-slate-800 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.color}`} />
                {item.label}
              </Link>
            </motion.div>
          ))}
          {!rolesOpen && <p className="px-3 text-xs text-slate-400">点击展开</p>}
        </div>
      </nav>

      {IS_DEV && (
        <div className="border-t border-slate-200 px-2 py-2">
          <div className="px-3 mb-1">
            <span className="text-[10px] font-semibold text-amber-600/70 uppercase tracking-widest">Dev Only</span>
          </div>
          <Link
            href="/dev-lab"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
              isActive("/dev-lab")
                ? "bg-amber-900/40 text-amber-300 font-medium"
                : "text-amber-600/70 hover:bg-amber-900/30 hover:text-amber-400"
            )}
          >
            <span className={isActive("/dev-lab") ? "text-amber-400" : "text-amber-700"}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15a2.25 2.25 0 01-2.15 2.395H6.35A2.25 2.25 0 014.2 15m15.6 0a2.25 2.25 0 00.15-.89V6.375a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.375V14.11a2.25 2.25 0 00.15.89" />
              </svg>
            </span>
            人脉方程
          </Link>
        </div>
      )}

      <div className="border-t border-slate-200 p-3">
        <Link
          href="/invite"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-white hover:text-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          邀请好友
        </Link>
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        onMouseDown={startResize}
        className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-violet-300/40"
      />
    </aside>
  )
}
