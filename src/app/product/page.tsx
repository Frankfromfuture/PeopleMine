import Link from "next/link"
import { MarketingFrame } from "@/components/marketing-frame"

export default function ProductPage() {
  return (
    <MarketingFrame active="/product">
      <main className="bg-[#fbf7f5] px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs uppercase tracking-[0.14em] text-[#7a8088]">产品</p>
          <h1 className="mt-2 text-5xl font-semibold text-[#1b1d21]">为人脉经营打造的完整工作系统</h1>
          <p className="mt-4 max-w-3xl text-lg text-[#5f646d]">把记录、分析、行动建议与团队协作统一到同一界面内，避免信息散落。</p>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {[
              ["快速录入", "30 秒创建联系人，先记录后补充，避免错过关键关系。", "#f4ede2", "#b8ab8d"],
              ["角色标签", "围绕目标节点建立角色结构，帮助你明确优先顺序。", "#eef1f5", "#a8b3bf"],
              ["能量时间线", "用冷温热变化追踪关系活跃度，主动触发维护动作。", "#f4ede2", "#b8ab8d"],
              ["航程分析", "输入目标后生成路径建议，告诉你先联系谁、如何沟通。", "#eef1f5", "#a8b3bf"],
            ].map(([title, desc, bg, border]) => (
              <div key={title} className="rounded-sm border p-7" style={{ background: bg as string, borderColor: border as string }}>
                <h2 className="text-2xl font-semibold">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#5f646d]">{desc}</p>
                <div className="mt-6 h-48 rounded-sm border bg-white" style={{ borderColor: border as string }} />
              </div>
            ))}
          </div>

          <div className="mt-14 flex justify-center">
            <Link href="/login" className="rounded-full bg-[#1d1f22] px-7 py-3 text-sm font-semibold text-white">开始使用</Link>
          </div>
        </div>
      </main>
    </MarketingFrame>
  )
}
