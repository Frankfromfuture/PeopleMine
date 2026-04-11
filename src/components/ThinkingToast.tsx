'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import LottieLoader from '@/components/LottieLoader'

const MESSAGES = [
  '同步视图中',
  '生成航线建议中',
  '编排界面状态中',
  '准备下一步动作中',
  '计算关系权重中',
  '刷新数据快照中',
]

function randomMsg() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
}

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

function FloatingLoader({ visible }: { visible: boolean }) {
  const [msg, setMsg] = useState(MESSAGES[0])
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!visible) return
    setMsg(randomMsg())
    const timer = setInterval(() => setMsg(randomMsg()), 1900)
    return () => clearInterval(timer)
  }, [visible])

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.18 }}
          className="pointer-events-none fixed bottom-5 right-5 z-[9999]"
        >
          <div className="relative flex items-center gap-2">
            <LottieLoader className="h-10 w-10 shrink-0" />
            <div className="whitespace-nowrap text-[10px] italic text-gray-400/80">{msg}</div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export function InlineLoadingSpinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`} aria-hidden="true">
      <LottieLoader className="h-full w-full" />
    </span>
  )
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)
  const manualRef = useRef(false)
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (manualRef.current) return
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return
      const href = target.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return
      if (target.getAttribute('target') === '_blank') return
      setVisible(true)
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [])

  useEffect(() => {
    if (manualRef.current) return
    if (navTimerRef.current) clearTimeout(navTimerRef.current)
    navTimerRef.current = setTimeout(() => setVisible(false), 220)
  }, [pathname])

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      <FloatingLoader visible={visible} />
    </LoadingContext.Provider>
  )
}
