import PageShell from '@/components/PageShell'
import MeForm from './MeForm'

export default function MePage() {
  return (
    <PageShell
      items={[
        { label: '首页', href: '/dashboard' },
        { label: '我' },
      ]}
      title="我"
      hints={[
        '页面结构、卡片层级与“+人脉”保持一致，方便在同一套节奏里录入和维护。',
        '先补全最核心的身份、目标和资源，后续系统建议会更贴合你的真实方向。',
        '当前保存为本地草稿，适合快速迭代你的个人画像。',
      ]}
      contentClassName="flex-1"
    >
      <MeForm />
    </PageShell>
  )
}
