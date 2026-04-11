import Link from "next/link"
import { MarketingFrame } from "@/components/marketing-frame"

export default function SolutionsPage() {
  return (
    <MarketingFrame active="/solutions">
      <main className="bg-[#fbf7f5] px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs uppercase tracking-[0.14em] text-[#7a8088]">解决方案</p>
          <h1 className="mt-2 text-5xl font-semibold text-[#1b1d21]">不同阶段、不同策略，同一套温和高效的经营方法</h1>
          <p className="mt-4 max-w-3xl text-lg text-[#5f646d]">无论你处于学习期、职业起步期还是业务扩张期，都能找到对应的人脉经营路径。</p>

          <div className="mt-12 space-y-5">
            {[
              ["学生与研究生", "建立导师、校友、实习合作方三层网络，为毕业与转型提前布局。", "#f4ede2", "#b8ab8d"],
              ["职场新人", "让零散社交变成可持续关系池，减少临时抱佛脚式联系。", "#eef1f5", "#a8b3bf"],
              ["创业者与业务负责人", "围绕关键资源节点构建关系路径，提升合作与转介绍效率。", "#f4ede2", "#b8ab8d"],
              ["组织与社群运营者", "把成员关系维护纳入节奏化机制，提升活跃度与粘性。", "#eef1f5", "#a8b3bf"],
            ].map(([title, desc, bg, border]) => (
              <div key={title} className="rounded-sm border p-7" style={{ background: bg as string, borderColor: border as string }}>
                <h2 className="text-2xl font-semibold">{title}</h2>
                <p className="mt-3 max-w-4xl text-sm leading-7 text-[#5f646d]">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 flex justify-center">
            <Link href="/login" className="rounded-full bg-[#A04F47] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#A04F47]/90">开始试用</Link>
          </div>
        </div>
      </main>
    </MarketingFrame>
  )
}