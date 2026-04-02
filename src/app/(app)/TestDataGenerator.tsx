'use client'

import React, { useState } from 'react'

export default function TestDataGenerator() {
  const [count, setCount] = useState(10)
  const [tagVariability, setTagVariability] = useState(50)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // 生成随机联系人
  const handleGenerate = async () => {
    setIsGenerating(true)
    setMessage(null)

    try {
      const response = await fetch('/api/contacts/generate-random', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count, tagVariability }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `✓ 成功生成 ${data.count} 个随机联系人（${data.mode === 'ai' ? 'AI 真随机' : '本地随机'}）`,
        })
        // 刷新页面以显示新数据
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMessage({
          type: 'error',
          text: `✗ ${data.error || '生成失败'}`,
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `✗ 生成失败: ${String(error)}`,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // 清除所有联系人
  const handleClear = async () => {
    if (!window.confirm('确定要删除所有联系人吗？此操作不可撤销！')) {
      return
    }

    setIsClearing(true)
    setMessage(null)

    try {
      const response = await fetch('/api/contacts/clear-all', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `✓ 成功删除 ${data.count} 个联系人`,
        })
        // 刷新页面
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMessage({
          type: 'error',
          text: `✗ ${data.error || '删除失败'}`,
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `✗ 删除失败: ${String(error)}`,
      })
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-200 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🧪</span>
        <div>
          <h3 className="font-semibold text-gray-900">快速测试数据</h3>
          <p className="text-xs text-gray-600">一键生成测试联系人或清空数据库</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* 生成参数 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 生成数量 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              生成人员数量
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="500"
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
                disabled={isGenerating}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-500 disabled:opacity-50"
              />
              <span className="text-sm text-gray-600">个</span>
            </div>
          </div>

          {/* 标签波动性 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标签波动性
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={tagVariability}
                onChange={(e) => setTagVariability(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                disabled={isGenerating}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-500 disabled:opacity-50"
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
          </div>
        </div>

        {/* 滑块显示波动性 */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-600">标签规律性</span>
            <span className="text-violet-600 font-semibold">
              {100 - tagVariability}% 规律 / {tagVariability}% 随机
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={tagVariability}
            onChange={(e) => setTagVariability(parseInt(e.target.value))}
            disabled={isGenerating}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600 disabled:opacity-50"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>完全规律</span>
            <span>完全随机</span>
          </div>
        </div>

        {/* 信息提示 */}
        <div className="text-xs text-gray-600 bg-white bg-opacity-60 rounded p-3 border border-gray-200">
          💡 <strong>说明：</strong>
          <ul className="mt-2 space-y-1 ml-5 list-disc">
            <li>生成的数据包括：姓名、行业、公司、职位、标签、能量值、温度、信任度等</li>
            <li>标签波动性越高，生成的标签越随机；越低，标签越与行业相关</li>
            <li>数据完整度随机（某些字段可能为空）</li>
            <li>关系角色分布符合现实比例：GATEWAY(25%) &gt; ADVISOR(20%) &gt; ...</li>
          </ul>
        </div>

        {/* 提示消息 */}
        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 按钮组 */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || isClearing}
            className="px-4 py-2 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <span>✨</span>
                一键生成
              </>
            )}
          </button>

          <button
            onClick={handleClear}
            disabled={isGenerating || isClearing}
            className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {isClearing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                清除中...
              </>
            ) : (
              <>
                <span>🗑️</span>
                清除全部
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
