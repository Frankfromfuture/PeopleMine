import Link from "next/link"
import { ReactNode } from "react"

const NAV = [
  { href: "/product", label: "产品" },
  { href: "/solutions", label: "解决方案" },
  { href: "/pricing", label: "定价" },
]

export function MarketingFrame({ children, active }: { children: ReactNode; active?: string }) {
  return (
    <div className="min-h-screen bg-[#fbf7f5] text-[#1f2024]">
      <header className="sticky top-0 z-30 border-b border-[#c7bdc3]/40 bg-[#fbf7f5]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-36 rounded-sm border-2 border-dashed border-[#b8ab8d] bg-white" />
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors ${active === item.href ? "text-[#1d1f22]" : "text-[#666a72] hover:text-[#1d1f22]"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/login" className="rounded-full bg-[#1d1f22] px-5 py-2 text-sm font-medium text-white hover:bg-black">
            开始使用
          </Link>
        </div>
      </header>

      {children}

      <section className="bg-[#bf234f] px-6 py-14 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <h2 className="text-3xl font-semibold md:text-4xl">让团队协作、关系经营与目标推进在同一节奏里发生。</h2>
          <Link href="/login" className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#bf234f]">
            立即开始
          </Link>
        </div>
      </section>

      <footer className="bg-[#1d1f22] px-6 py-14 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-4">
          <div>
            <div className="mb-3 h-8 w-32 rounded-sm border border-white/40" />
            <p className="text-sm text-white/80">PeopleMine · 把人脉经营成可复利资产。</p>
          </div>
          {[
            ["产品", "功能总览", "标签系统", "能量追踪", "航程分析"],
            ["解决方案", "学生用户", "职场新人", "创业团队", "社区组织"],
            ["资源", "定价", "更新日志", "帮助中心", "联系我们"],
          ].map((col) => (
            <div key={col[0]}>
              <h4 className="mb-3 text-sm font-semibold">{col[0]}</h4>
              <ul className="space-y-2 text-sm text-white/75">
                {col.slice(1).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </div>
  )
}
