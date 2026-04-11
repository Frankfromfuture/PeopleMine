'use client'

import React from 'react'

interface GoalInputProps {
  onSubmit: (goal: string) => void
  isLoading: boolean
}

const GOAL_EXAMPLES = [
  '我想认识字节跳动产品团队的负责人',
  '我需要找一位科技行业的天使投资人',
  '我想了解区块链行业的最新动态',
  '我想和我的行业大佬建立联系',
]

export default function GoalInput({ onSubmit, isLoading }: GoalInputProps) {
  const [goal, setGoal] = React.useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (goal.trim()) {
      onSubmit(goal.trim())
    }
  }

  const handleExample = (example: string) => {
    setGoal(example)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          你的目标是什么？
        </label>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="例如：我想认识更多投资人"
          className="w-full h-24 px-4 py-3 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-500 resize-none placeholder-gray-400"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-1">
          描述你的目标越具体，AI 分析越准确
        </p>
      </div>

      {/* 示例快速填充 */}
      {!isLoading && goal.length === 0 && (
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">示例目标：</p>
          <div className="grid grid-cols-1 gap-2">
            {GOAL_EXAMPLES.map((example, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleExample(example)}
                className="text-left px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition text-gray-700"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 提交按钮 */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading || goal.trim().length === 0}
          className="flex-1 px-4 py-2 rounded-lg bg-gray-600 text-white font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isLoading ? '分析中...' : '开始分析'}
        </button>
      </div>
    </form>
  )
}
