'use client'

import Image from 'next/image'
import Link from 'next/link'

const FONT_SANS =
  '"Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif'

const NAV_ITEMS = [
  { label: '产品', href: '#core' },
  { label: '工作流', href: '#workflow' },
  { label: '开始使用', href: '#start' },
]

export default function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-black/8 bg-[rgba(232,229,224,0.78)] backdrop-blur-xl">
      <div className="relative mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-8 w-auto sm:h-9">
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

        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-[84px] md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="group relative inline-flex items-center text-[19.6px] font-medium text-[#5a544d] transition duration-200 hover:text-[#A04F47]"
              style={{ fontFamily: FONT_SANS }}
            >
              <span className="relative z-10">{item.label}</span>
              <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-[linear-gradient(90deg,rgba(160,79,71,0),rgba(160,79,71,0.95),rgba(160,79,71,0))] transition-transform duration-250 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <Link
          href="/login"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-[#A04F47]/18 bg-[#A04F47] px-5 text-[14px] font-medium text-white shadow-[0_10px_28px_rgba(160,79,71,0.16)] transition duration-250 hover:-translate-y-0.5 hover:border-[#8f443d] hover:bg-[#96463f] hover:shadow-[0_14px_30px_rgba(160,79,71,0.18)] active:translate-y-0 sm:px-6"
          style={{ fontFamily: FONT_SANS }}
        >
          开始使用
        </Link>
      </div>
    </header>
  )
}
