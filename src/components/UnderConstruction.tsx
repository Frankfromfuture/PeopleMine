import { Construction } from 'lucide-react'
import PageShell from '@/components/PageShell'

export default function UnderConstruction({
  title,
  summary,
  hints,
}: {
  title: string
  summary?: string
  hints?: string[]
}) {
  return (
    <PageShell
      items={[
        { label: '首页', href: '/dashboard' },
        { label: title },
      ]}
      title={title}
      summary={summary ?? `${title} 页面正在整理为统一工作台风格，功能入口会继续保留在这里。`}
      hints={
        hints ?? [
          '这个页面已接入统一题头和铺满画布的布局语言。',
          '后续功能会继续在这里补齐，不会影响导航结构。',
          '当前阶段先保留简洁占位，避免页面视觉割裂。',
        ]
      }
    >
      <div className="flex flex-1 items-center justify-center rounded-[32px] border border-gray-200 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <Construction className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-gray-900">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            这一页的视觉骨架已经统一到当前设计系统，具体内容模块还在继续补齐。
          </p>
        </div>
      </div>
    </PageShell>
  )
}
