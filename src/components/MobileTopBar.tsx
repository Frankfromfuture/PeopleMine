"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronLeft, Plus, Search, Settings } from "lucide-react"

const ROOT_PATHS = new Set(["/dashboard", "/contacts", "/journey", "/me"])

function normalizePath(pathname: string) {
  if (!pathname) return "/dashboard"
  if (pathname === "/") return "/dashboard"
  return pathname
}

export default function MobileTopBar() {
  const pathname = normalizePath(usePathname())
  const router = useRouter()
  const isRootPath = ROOT_PATHS.has(pathname)

  return (
    <header
      className="border-b border-black/10 bg-[#f7f7f6]/95 backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex min-w-0 items-center gap-2">
          {isRootPath ? (
            <Link href="/dashboard" className="inline-flex items-center">
              <Image
                src="/assets/brand/logo-with-pm.svg"
                alt="PeopleMine"
                width={108}
                height={20}
                className="h-5 w-auto"
                priority
              />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-[#3a3a3a]"
              aria-label="返回"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/contacts"
            aria-label="搜索联系人"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-[#4a4a4a]"
          >
            <Search size={16} />
          </Link>
          <Link
            href="/contacts/new"
            aria-label="新增联系人"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#8f1d31] bg-[#8f1d31] text-white transition hover:bg-[#7a1829]"
          >
            <Plus size={16} />
          </Link>
          <Link
            href="/settings"
            aria-label="设置"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-[#4a4a4a]"
          >
            <Settings size={16} />
          </Link>
        </div>
      </div>
    </header>
  )
}
