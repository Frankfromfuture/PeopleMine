import Link from "next/link"
import { MarketingFrame } from "@/components/marketing-frame"

const stats = [
  "线索到行动转化效率提升",
  "关系维护节奏更稳定",
  "跨团队协作更清晰",
  "目标路径决策更可解释",
]

export default function LandingPage() {
  return (
    <MarketingFrame active="/">
      <main>
        <section className="border-b border-[#c7bdc3]/35 bg-[#fbf7f5] px-6 pb-20 pt-16">
          <div className="mx-auto max-w-7xl text-center">
            <h1 className="mx-auto max-w-4xl text-5xl font-semibold leading-tight text-[#1c1e22] md:text-6xl">
              让团队在同一平台上完成
              <span className="text-[#bf234f]"> 关系经营与业务推进</span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#5f646d]">
              PeopleMine 以标签、能量与航程三层引擎，把“认识谁、先找谁、怎么聊”变成可执行的日常流程。
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/login" className="rounded-full bg-[#1d1f22] px-6 py-3 text-sm font-semibold text-white">开始使用</Link>
              <Link href="/product" className="rounded-full border border-[#b8ab8d] bg-[#f4ede2] px-6 py-3 text-sm font-semibold text-[#2a2d33]">查看产品</Link>
            </div>
            <div className="mx-auto mt-12 h-[430px] max-w-5xl rounded-md border border-[#b8ab8d]/50 bg-[#d5b9af]/18 p-4">
              <div className="h-full w-full rounded-sm border border-[#c7bdc3] bg-white" />
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs uppercase tracking-[0.14em] text-[#7a8088]">第一部分</p>
            <h2 className="mt-2 text-4xl font-semibold text-[#1b1d21]">工作推进与关系管理并行</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-sm border border-[#b8ab8d]/50 bg-[#f4ede2] p-6">
                <h3 className="text-xl font-semibold">任务与关系共视图</h3>
                <p className="mt-3 text-sm leading-7 text-[#5f646d]">每个目标都能看到“当前进度 + 关键联系人 + 下一步动作”。</p>
                <div className="mt-5 h-64 rounded-sm border border-[#b8ab8d]/60 bg-white" />
              </div>
              <div className="rounded-sm border border-[#a8b3bf]/55 bg-[#eef1f5] p-6">
                <h3 className="text-xl font-semibold">AI 提醒下一步</h3>
                <p className="mt-3 text-sm leading-7 text-[#5f646d]">根据关系温度、角色权重与历史互动，智能给出可执行建议。</p>
                <div className="mt-5 h-64 rounded-sm border border-[#a8b3bf]/70 bg-white" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f1ece8] px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs uppercase tracking-[0.14em] text-[#7a8088]">第二部分</p>
            <h2 className="mt-2 text-4xl font-semibold text-[#1b1d21]">可量化的关系经营结果</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {stats.map((item, i) => (
                <div key={item} className={`rounded-sm border p-5 text-sm leading-7 ${i % 2 === 0 ? "border-[#c7bdc3] bg-white" : "border-[#b8ab8d] bg-[#f4ede2]"}`}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#a8b3bf]/20 px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs uppercase tracking-[0.14em] text-[#6f7580]">第三部分</p>
            <h2 className="mt-2 text-4xl font-semibold text-[#1b1d21]">为什么 PeopleMine 与众不同</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {[
                "标签录入低阻力：先简后全，30 秒可完成第一步",
                "关系能量可视化：冷、温、热变化一眼掌握",
                "航程路径可解释：为什么先联系谁清晰可追溯",
                "界面温和耐看：支持长期使用，不制造信息疲劳",
              ].map((item) => (
                <div key={item} className="rounded-sm bg-[#6a003b] p-6 text-sm leading-7 text-white">{item}</div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs uppercase tracking-[0.14em] text-[#7a8088]">第四部分</p>
            <h2 className="mt-2 text-4xl font-semibold text-[#1b1d21]">可连接 300+ 工具与渠道</h2>
            <div className="mt-10 grid grid-cols-3 gap-4 md:grid-cols-8">
              {new Array(16).fill(0).map((_, i) => (
                <div key={i} className="h-14 rounded-sm border border-[#c7bdc3]/50 bg-white" />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f1ece8] px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs uppercase tracking-[0.14em] text-[#7a8088]">第五部分</p>
            <h2 className="mt-2 text-4xl font-semibold text-[#1b1d21]">顶级团队都在用同一种工作语言</h2>
            <div className="mt-10 rounded-sm border border-[#b8ab8d]/60 bg-[#f4ede2] p-8">
              <div className="h-64 rounded-sm border border-[#b8ab8d]/60 bg-white" />
            </div>
          </div>
        </section>
      </main>
    </MarketingFrame>
  )
}
