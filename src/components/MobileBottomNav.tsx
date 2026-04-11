"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Orbit, UserRound, UsersRound } from "lucide-react"
import type { LucideIcon } from "lucide-react"

type TabItem = {
  label: string
  href: string
  icon: LucideIcon
  isActive: (pathname: string) => boolean
}

const TABS: TabItem[] = [
  {
    label: "首页",
    href: "/dashboard",
    icon: LayoutDashboard,
    isActive: (pathname) => pathname === "/dashboard",
  },
  {
    label: "联系人",
    href: "/contacts",
    icon: UsersRound,
    isActive: (pathname) => pathname.startsWith("/contacts"),
  },
  {
    label: "宇宙",
    href: "/journey",
    icon: Orbit,
    isActive: (pathname) => pathname.startsWith("/journey"),
  },
  {
    label: "我的",
    href: "/me",
    icon: UserRound,
    isActive: (pathname) => pathname === "/me",
  },
]

export default function MobileBottomNav() {
  const pathname = usePathname() || ""

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-[#f7f7f6]/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="移动端底部导航"
    >
      <div className="mx-auto grid h-16 max-w-xl grid-cols-4 px-1">
        {TABS.map((tab) => {
          const active = tab.isActive(pathname)
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="group flex min-w-0 flex-col items-center justify-center gap-1 px-1"
              aria-current={active ? "page" : undefined}
            >
              <div
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
                  active
                    ? "border-[#A04F47]/20 bg-[#A04F47]/10 text-[#8f443d]"
                    : "border-transparent bg-transparent text-[#707070] group-hover:border-black/10 group-hover:text-[#3a3a3a]"
                }`}
              >
                <Icon size={16} />
              </div>
              <span className={`truncate text-[11px] ${active ? "font-medium text-[#5a3a37]" : "text-[#6a6a6a]"}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
