'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

// ─── 消息库 ────────────────────────────────────────────────────────────────────

const MESSAGES = [
  '思考中', '计算中', '分析中', '处理中', '规划中',
  '推演中', '匹配中', '评估中', '构建中', '优化中',
  '连接中', '加载中', '解析中', '整合中', '检索中',
]

function randomMsg() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
}

// ─── Context ───────────────────────────────────────────────────────────────────

interface LoadingCtx {
  showLoading: () => void
  hideLoading: () => void
}

const LoadingContext = createContext<LoadingCtx>({
  showLoading: () => {},
  hideLoading: () => {},
})

export function useLoading() {
  return useContext(LoadingContext)
}

// ─── 浮动 Toast ────────────────────────────────────────────────────────────────

function Toast({ visible }: { visible: boolean }) {
  const [msg, setMsg] = useState(randomMsg)
  const [dots, setDots] = useState(1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!visible) return
    setMsg(randomMsg())
    setDots(1)

    intervalRef.current = setInterval(() => {
      setDots(d => {
        if (d >= 6) {
          setMsg(randomMsg())
          return 1
        }
        return d + 1
      })
    }, 350)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [visible])

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] pointer-events-none"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
      }}
    >
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-zinc-900/95 shadow-xl border border-zinc-700/60 backdrop-blur-sm">
        {/* 跳动三点 */}
        <div className="flex items-end gap-0.5 h-4">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-violet-400"
              style={{
                animation: visible ? `bounce 0.9s ease-in-out ${i * 0.15}s infinite` : 'none',
              }}
            />
          ))}
        </div>
        {/* 文字 */}
        <span className="text-sm text-zinc-100 font-medium tracking-wide whitespace-nowrap">
          {msg}
          <span className="text-violet-300">{'·'.repeat(dots)}</span>
        </span>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ─── Provider ──────────────────────────────────────────────────────────────────

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)
  const manualRef = useRef(false)     // true = 手动触发（AI分析），不被导航覆盖
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()

  const showLoading = useCallback(() => {
    manualRef.current = true
    setVisible(true)
  }, [])

  const hideLoading = useCallback(() => {
    manualRef.current = false
    setVisible(false)
  }, [])

  // 拦截链接点击 → 触发导航 loading
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (manualRef.current) return
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return
      const href = target.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return
      if (target.getAttribute('target') === '_blank') return
      // 内部导航：显示 loading
      setVisible(true)
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [])

  // 路由变化完成 → 关闭导航 loading（手动的不关）
  useEffect(() => {
    if (manualRef.current) return
    if (navTimerRef.current) clearTimeout(navTimerRef.current)
    // 给页面 300ms 渲染时间再关闭
    navTimerRef.current = setTimeout(() => setVisible(false), 300)
  }, [pathname])

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      <Toast visible={visible} />
    </LoadingContext.Provider>
  )
}
