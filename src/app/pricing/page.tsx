import Link from "next/link"
import { MarketingFrame } from "@/components/marketing-frame"

const plans = [
  { name: "个人版", price: "¥0", desc: "适合日常记录", bg: "#f4ede2", border: "#b8ab8d", features: ["150 位联系人", "基础标签体系", "单人使用"] },
  { name: "成长版", price: "¥39/月", desc: "适合持续经营", bg: "#eef1f5", border: "#a8b3bf", features: ["不限联系人", "关系能量分析", "路径建议"] },
  { name: "团队版", price: "¥129/月", desc: "适合协作推进", bg: "#f4ede2", border: "#b8ab8d", features: ["团队空间", "共享视图", "优先支持"] },
]

export default function PricingPage() {
  return (
    <MarketingFrame active="/pricing">
      <main className="bg-[#fbf7f5] px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs uppercase tracking-[0.14em] text-[#7a8088]">定价</p>
          <h1 className="mt-2 text-5xl font-semibold text-[#1b1d21]">按成长节奏选择方案，先轻量再进阶</h1>
          <p className="mt-4 max-w-3xl text-lg text-[#5f646d]">每个方案都保留完整体验风格，差异主要在容量与协作深度。</p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name} className="rounded-sm border p-7" style={{ background: plan.bg, borderColor: plan.border }}>
                <h2 className="text-2xl font-semibold">{plan.name}</h2>
                <p className="mt-1 text-sm text-[#5f646d]">{plan.desc}</p>
                <p className="mt-6 text-4xl font-bold text-[#1b1d21]">{plan.price}</p>
                <ul className="mt-6 space-y-2 text-sm text-[#4f5660]">
                  {plan.features.map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
                <Link href="/login" className="mt-7 inline-flex rounded-full bg-[#A04F47] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#A04F47]/90">
                  立即开始
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>
    </MarketingFrame>
  )
}