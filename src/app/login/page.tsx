import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#fbf7f5] text-[#1d1f22]">
      <header className="border-b border-[#c7bdc3]/40 bg-[#fbf7f5]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-sm text-[#666a72] hover:text-[#1d1f22]">← 返回首页</Link>
          <div className="h-9 w-36 rounded-sm border-2 border-dashed border-[#b8ab8d] bg-white" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 rounded-sm border border-[#a8b3bf]/60 bg-[#eef1f5] p-8 md:grid-cols-2">
          <div>
            <p className="inline-flex rounded-full border border-[#b8ab8d] bg-[#f4ede2] px-3 py-1 text-xs text-[#5f533c]">开发入口</p>
            <h1 className="mt-4 text-4xl font-semibold text-[#1d1f22]">欢迎回来，继续经营你的人脉资产</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#5f646d]">当前阶段登录流程暂时简化，点击下方按钮可直接进入 PeopleMine 主界面。</p>
            <Link href="/dashboard" className="mt-8 inline-flex rounded-full bg-[#1d1f22] px-6 py-3 text-sm font-semibold text-white">
              开发模式进入主界面
            </Link>
          </div>
          <div className="rounded-sm border border-[#b8ab8d]/60 bg-[#f4ede2] p-6">
            <h2 className="text-lg font-semibold text-[#1d1f22]">当前可测试范围</h2>
            <ul className="mt-4 space-y-3 text-sm text-[#5f646d]">
              <li>• 官网首页、产品页、解决方案页、定价页</li>
              <li>• 主界面仪表盘与部件拖拽布局</li>
              <li>• 联系人、企业、航程页面跳转</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
