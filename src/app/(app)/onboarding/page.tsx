import PageShell from '@/components/PageShell'

export default function OnboardingPage() {
  return (
    <PageShell
      items={[
        { label: '首页', href: '/dashboard' },
        { label: '新手引导' },
      ]}
      title="新手引导"
      summary="这里会承接首次使用时的引导流程，帮助你更快进入人脉整理与目标推进。"
      hints={[
        '当前先接入统一题头和工作区壳层。',
        '后续引导模块补齐后会直接沿用这套布局。',
        '页面会跟随当前可用宽度自适应铺开。',
      ]}
    >
      <div className="flex flex-1 items-center justify-center rounded-[32px] border border-gray-200 bg-white p-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div>
          <div className="mb-3 text-4xl">钩</div>
          <p className="text-sm text-gray-500">新手引导即将上线</p>
        </div>
      </div>
    </PageShell>
  )
}
