"use client"

import Image from "next/image"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useState } from "react"

const FONT_SANS = '"Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif'
const PAGE_GUTTER_CLASS = "px-[clamp(16px,4vw,72px)]"

const NAV_ITEMS = [
  { label: "产品", href: "#core" },
  { label: "工作流", href: "#workflow" },
  { label: "开始使用", href: "#start" },
]

export default function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/8 bg-[rgba(232,229,224,0.82)] backdrop-blur-xl">
      <div
        className={`relative flex w-full items-center justify-between gap-3 py-[clamp(12px,1.8vw,18px)] ${PAGE_GUTTER_CLASS}`}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/assets/brand/logo-icon.svg"
            alt="PeopleMine"
            width={74}
            height={40}
            className="h-[clamp(28px,2.4vw,34px)] w-auto object-contain"
            priority
          />
          <span
            className="text-[clamp(17px,1.5vw,21px)] font-semibold tracking-[-0.025em] text-[#3f3a35]"
            style={{ fontFamily: FONT_SANS }}
          >
            PeopleMine
          </span>
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/12 bg-white/80 text-[#3c3a37]"
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-black/8 bg-[#ece8e2] px-4 pb-4 pt-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-2xl border border-transparent px-3 py-2.5 text-[15px] text-[#4f4b47] transition hover:border-black/10 hover:bg-white/70"
                style={{ fontFamily: FONT_SANS }}
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
