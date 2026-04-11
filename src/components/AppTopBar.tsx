"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Command, HelpCircle, Plus } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"

interface AppTopBarProps {
  phone?: string
  name?: string | null
}

export default function AppTopBar({ phone, name }: AppTopBarProps) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [focusSearch, setFocusSearch] = useState(false)

  const initials = name ? name.slice(0, 2) : phone ? phone.slice(0, 2) : "PM"

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setFocusSearch(true)
        setTimeout(() => setFocusSearch(false), 900)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="pm-panel mx-auto flex h-[68px] w-full max-w-[1520px] items-center gap-3 rounded-[18px] px-4 sm:px-5 lg:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-line-standard bg-white">
            <Image
              src="/assets/brand/logo-icon.svg"
              alt="PeopleMine 人迈"
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
              priority
              unoptimized
            />
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="text-sm font-medium tracking-[-0.02em] text-text-primary">PeopleMine</p>
            <p className="text-xs text-text-subtle">Linear Light Workspace</p>
          </div>
        </Link>

        <div className="hidden min-w-0 flex-1 items-center md:flex">
          <button
            type="button"
            className="pm-input-shell flex h-11 w-full max-w-2xl items-center gap-3 px-4 text-left"
            style={focusSearch ? { boxShadow: "0 0 0 3px var(--focus-ring)" } : undefined}
          >
            <Command className="h-4 w-4 shrink-0 text-text-subtle" strokeWidth={1.8} />
            <span className="truncate text-sm text-text-muted">搜索人脉、企业、标签，或快速跳转…</span>
            <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-line-subtle bg-white px-2 py-1 text-[11px] font-medium text-text-subtle shadow-surface">
              <span>Ctrl</span>
              <span>K</span>
            </span>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/contacts/new" className={buttonVariants({ size: "sm", variant: "default" })}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            新增
          </Link>

          <button
            type="button"
            title="帮助"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-line-standard bg-white text-text-secondary shadow-surface hover:bg-app-surface-hover hover:text-text-primary"
          >
            <HelpCircle className="h-4 w-4" strokeWidth={1.8} />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            title="点击退出登录"
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-[10px] border border-line-standard bg-white px-2.5 text-sm font-medium tracking-[-0.02em] text-text-primary shadow-surface hover:bg-app-surface-hover"
          >
            {loggingOut ? "..." : initials}
          </button>
        </div>
      </div>
    </header>
  )
}
