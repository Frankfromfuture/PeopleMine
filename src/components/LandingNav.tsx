'use client'

import Image from 'next/image'
import Link from 'next/link'

const FONT_SANS =
  '"Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif'
const PAGE_GUTTER_CLASS = 'px-[clamp(16px,4vw,72px)]'

const NAV_ITEMS = [
  { label: '产品', href: '#core' },
  { label: '工作流', href: '#workflow' },
  { label: '开始使用', href: '#start' },
]

export default function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/8 bg-[rgba(232,229,224,0.78)] backdrop-blur-xl">
      <div
        className={`relative flex w-full items-center justify-between gap-4 py-[clamp(12px,1.8vw,18px)] ${PAGE_GUTTER_CLASS}`}
      >
        <Link href="/" className="flex items-center gap-3">
          <div className="h-[clamp(32px,2.8vw,44px)] w-auto">
            <Image
              src="/assets/brand/logo-with-pm.svg"
              alt="PeopleMine"
              width={250}
              height={36}
              className="h-full w-auto object-contain"
              priority
              unoptimized
            />
          </div>
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

        <Link
          href="/login"
          className="inline-flex h-[clamp(40px,3.8vw,46px)] shrink-0 items-center justify-center rounded-full border border-[#A04F47]/18 bg-[#A04F47] px-[clamp(16px,1.8vw,26px)] text-[clamp(13px,1.2vw,15px)] font-medium text-white shadow-[0_10px_28px_rgba(160,79,71,0.16)] transition duration-250 hover:-translate-y-0.5 hover:border-[#8f443d] hover:bg-[#96463f] hover:shadow-[0_14px_30px_rgba(160,79,71,0.18)] active:translate-y-0"
          style={{ fontFamily: FONT_SANS }}
        >
          开始使用
        </Link>
      </div>
    </header>
  )
}
