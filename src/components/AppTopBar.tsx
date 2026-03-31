"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface AppTopBarProps {
  phone?: string
  name?: string | null
}

export default function AppTopBar({ phone, name }: AppTopBarProps) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const initials = name
    ? name.slice(0, 2)
    : phone
    ? phone.slice(0, 2)
    : "PM"

  async function handleLogout() {
    setLoggingOut(true)
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <header className="h-12 fixed top-0 left-0 right-0 z-50 bg-zinc-900 border-b border-zinc-800 flex items-center px-3 gap-3">
      {/* Hamburger */}
      <button className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors flex-shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Create button */}
      <Link
        href="/contacts/new"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors flex-shrink-0"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        新增
      </Link>

      {/* Search bar */}
      <button className="flex-1 flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm transition-colors max-w-xl mx-auto">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>搜索人脉...</span>
      </button>

      <div className="flex items-center gap-1 ml-auto flex-shrink-0">
        {/* Help */}
        <button className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* AI sparkle */}
        <button className="p-1.5 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-violet-300 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </button>

        {/* User avatar */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="点击退出登录"
          className="w-7 h-7 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center text-white text-xs font-bold transition-colors"
        >
          {initials}
        </button>
      </div>
    </header>
  )
}
