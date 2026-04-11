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
      titleNote={<span className="text-sm italic text-gray-500">XMiner做分析的起点</span>}
      hints={[
        '先填核心信息：身份、目标、资源。',
        '内容保存在本地浏览器。',
      ]}
      contentClassName="flex-1"
    >
      <MeForm />
    </PageShell>
  )
}
