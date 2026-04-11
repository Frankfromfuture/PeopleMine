'use client'

import PageShell from '@/components/PageShell'
import CompanyUniverseView from '../../../(app)/journey/CompanyUniverseView'

export default function CompanyUniversePage() {
  return (
    <PageShell
      items={[
        { label: '首页', href: '/dashboard' },
        { label: '企业宇宙' },
      ]}
      title="企业宇宙"
      summary="从公司维度观察你的人脉网络分布、组织关系和重点连接节点。"
      hints={[
        '这个视图延续宇宙页面的全屏工作台布局。',
        '右侧详情和画布区域会随着窗口尺寸自适应铺满。',
        '后续如需强化数据说明，可继续在这个壳层内扩展。',
      ]}
    >
      <div className="min-h-[720px] flex-1 overflow-hidden rounded-[32px] border border-gray-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="h-full overflow-hidden rounded-[24px] border border-gray-200 bg-[#fbfbfa]">
          <CompanyUniverseView />
        </div>
      </div>
    </PageShell>
  )
}
