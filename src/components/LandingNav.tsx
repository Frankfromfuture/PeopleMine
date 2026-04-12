"use client"

import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useEffect, useState } from "react"
import PeopleMineLogo from "@/components/PeopleMineLogo"

const FONT_SANS = '"Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif'
const PAGE_GUTTER_CLASS = "px-[clamp(16px,4vw,72px)]"

const NAV_ITEMS = [
  { label: "产品", href: "#core" },
  { label: "工作流", href: "#workflow" },
  { label: "开始使用", href: "#start" },
]

export default function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false)

  useEffect(() => {
    if (mobileMenuOpen) {
      setMobileMenuVisible(true)
      return
    }

    const timer = window.setTimeout(() => {
      setMobileMenuVisible(false)
    }, 260)

    return () => window.clearTimeout(timer)
  }, [mobileMenuOpen])

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/8 bg-[rgba(232,229,224,0.82)] backdrop-blur-xl">
      <div
        className={`relative flex w-full items-center justify-between gap-3 py-[clamp(12px,1.8vw,18px)] ${PAGE_GUTTER_CLASS}`}
      >
        <Link href="/" className="flex items-center">
          <PeopleMineLogo className="h-[28px] w-auto sm:h-[34px]" />
        </Link>

        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-[clamp(44px,7vw,96px)] md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="group relative inline-flex items-center text-[clamp(16px,1.7vw,20px)] font-medium text-[#5a544d] transition duration-200 hover:text-[#A04F47]"
              style={{ fontFamily: FONT_SANS }}
            >
              <span className="relative z-10">{item.label}</span>
              <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-[linear-gradient(90deg,rgba(160,79,71,0),rgba(160,79,71,0.95),rgba(160,79,71,0))] transition-transform duration-250 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="inline-flex h-[clamp(40px,3.8vw,46px)] shrink-0 items-center justify-center rounded-full border border-[#A04F47]/18 bg-[#A04F47] px-[clamp(16px,1.8vw,26px)] text-[clamp(13px,1.2vw,15px)] font-medium text-white shadow-[0_10px_28px_rgba(160,79,71,0.16)] transition duration-250 hover:-translate-y-0.5 hover:border-[#8f443d] hover:bg-[#96463f] hover:shadow-[0_14px_30px_rgba(160,79,71,0.18)] active:translate-y-0"
            style={{ fontFamily: FONT_SANS }}
          >
            开始使用
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-full border border-[#A04F47]/20 bg-[#A04F47] px-4 text-[13px] font-medium text-white"
            style={{ fontFamily: FONT_SANS }}
          >
            开始
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            aria-label={mobileMenuOpen ? "关闭菜单" : "打开菜单"}
            aria-expanded={mobileMenuOpen}
            aria-controls="landing-mobile-menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/12 bg-white/80 text-[#3c3a37] transition duration-200 hover:bg-white"
          >
            <span
              className={`transition-transform duration-300 ${mobileMenuOpen ? "rotate-90 scale-95" : "rotate-0 scale-100"}`}
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </span>
          </button>
        </div>
      </div>

      {mobileMenuVisible ? (
        <div
          id="landing-mobile-menu"
          className={`overflow-hidden border-t border-black/8 bg-[#ece8e2] px-4 transition-[max-height,opacity,transform] duration-300 ease-out md:hidden ${
            mobileMenuOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav
            className={`flex flex-col gap-1 pb-4 pt-3 transition duration-300 ease-out ${
              mobileMenuOpen ? "translate-y-0 scale-100" : "-translate-y-2 scale-[0.98]"
            }`}
          >
            {NAV_ITEMS.map((item, index) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-2xl border border-transparent px-3 py-2.5 text-[15px] text-[#4f4b47] transition-[background-color,border-color,transform,opacity] duration-300 hover:border-black/10 hover:bg-white/70"
                style={{
                  fontFamily: FONT_SANS,
                  transitionDelay: mobileMenuOpen ? `${index * 45}ms` : "0ms",
                  opacity: mobileMenuOpen ? 1 : 0,
                  transform: mobileMenuOpen ? "translateY(0)" : "translateY(-8px)",
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  )
}
