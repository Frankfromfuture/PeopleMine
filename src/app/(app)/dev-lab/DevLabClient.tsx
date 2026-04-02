'use client'

import { useState } from 'react'
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
    <div className="h-full flex flex-col px-8 py-7">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-lg">⚗️</span>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 leading-tight">人脉方程 · 开发者实验室</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            仅在 development 模式下可见 · 正式上线后自动隐藏
          </p>
        </div>
        <span className="ml-auto px-2.5 py-1 text-xs rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-medium">
          DEV ONLY
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <TabBtn active={tab === 'tags'} onClick={() => setTab('tags')}>
          🏷 标签目录编辑器
        </TabBtn>
        <TabBtn active={tab === 'formula'} onClick={() => setTab('formula')}>
          🧮 航程公式编辑器
        </TabBtn>
        <TabBtn active={tab === 'company'} onClick={() => setTab('company')}>
          🏢 企业测试
        </TabBtn>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {tab === 'tags' && (
          <div className="h-full overflow-y-auto pr-1">
            <p className="text-sm text-gray-500 mb-4">
              在此处编辑人物标签的一级目录与子目录结构。保存后，「新增 / 编辑人物标签页」中的行业标签将自动同步。
            </p>
            <TagEditor initialConfig={tagConfig} />
          </div>
        )}
        {tab === 'formula' && (
          <div className="h-full overflow-hidden">
            <p className="text-sm text-gray-500 mb-4">
              调整航程评分公式的权重、表达式与条件筛选器。右侧可实时测试评分结果。
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
          ? 'border-violet-600 text-violet-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  )
}
