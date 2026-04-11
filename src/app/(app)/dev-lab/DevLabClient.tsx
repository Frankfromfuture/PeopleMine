'use client'

import { useState } from 'react'
import PageShell from '@/components/PageShell'
import type { TagConfig } from '@/lib/dev/tag-store'
import type { FormulaConfig } from '@/lib/dev/formula-store'
import TagEditor from './TagEditor'
import FormulaEditor from './FormulaEditor'
import CompanyTestPanel from './CompanyTestPanel'

type Tab = 'tags' | 'formula' | 'company'

export default function DevLabClient({
  tagConfig,
  formulaConfig,
}: {
  tagConfig: TagConfig
  formulaConfig: FormulaConfig
}) {
  const [tab, setTab] = useState<Tab>('tags')

  return (
    <PageShell
      items={[
        { label: '首页', href: '/dashboard' },
        { label: '开发者实验室' },
      ]}
      title="开发者实验室"
      summary="仅在开发模式下开放，用来调整标签体系、公式参数和企业测试数据。"
      hints={[
        '这里是开发环境专用页面，不会影响正式用户入口。',
        '题头和内容容器已接入统一工作台规则。',
        '内部标签页逻辑保持原样，只统一了外层布局语言。',
      ]}
      actions={
        <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600">
          DEV ONLY
        </span>
      }
    >
      <div className="min-h-0 flex-1 overflow-hidden rounded-[32px] border border-gray-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex h-full flex-col">
          <div className="mb-6 flex gap-1 border-b border-gray-200">
            <TabBtn active={tab === 'tags'} onClick={() => setTab('tags')}>
              标签目录编辑器
            </TabBtn>
            <TabBtn active={tab === 'formula'} onClick={() => setTab('formula')}>
              航程公式编辑器
            </TabBtn>
            <TabBtn active={tab === 'company'} onClick={() => setTab('company')}>
              企业测试
            </TabBtn>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {tab === 'tags' && (
              <div className="h-full overflow-y-auto pr-1">
                <p className="mb-4 text-sm text-gray-500">
                  在这里编辑人物标签的一级目录与子目录结构。保存后，新建或编辑人物标签页会自动同步。
                </p>
                <TagEditor initialConfig={tagConfig} />
              </div>
            )}
            {tab === 'formula' && (
              <div className="h-full overflow-hidden">
                <p className="mb-4 text-sm text-gray-500">
                  调整航程评分公式的权重、表达式与筛选条件，并在右侧实时验证结果。
                </p>
                <div className="h-[calc(100%-2.5rem)] overflow-hidden">
                  <FormulaEditor initialConfig={formulaConfig} />
                </div>
              </div>
            )}
            {tab === 'company' && (
              <div className="h-full overflow-y-auto pr-1">
                <CompanyTestPanel />
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-gray-700 text-gray-800'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  )
}
