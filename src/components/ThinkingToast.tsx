'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

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

  const dots = useMemo(() => [0, 1, 2], [])

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: reduceMotion ? 0.1 : 0.2 }}
          className="pointer-events-none fixed bottom-6 right-6 z-[9999]"
        >
          <div className="relative flex items-center gap-2.5 overflow-hidden rounded-[14px] border border-line-standard bg-white/92 px-4 py-2.5 shadow-dialog backdrop-blur-md">
            <motion.div
              className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(113,112,255,0.08)_50%,transparent_100%)]"
              animate={reduceMotion ? undefined : { x: ['-120%', '120%'] }}
              transition={reduceMotion ? undefined : { duration: 2.2, repeat: Infinity, ease: 'linear' }}
            />

            <div className="relative flex h-4 items-end gap-0.5">
              {dots.map((i) => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-brand"
                  animate={reduceMotion ? undefined : { y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                  transition={reduceMotion ? undefined : { duration: 0.9, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
                />
              ))}
            </div>

            <span className="relative whitespace-nowrap text-sm font-medium text-text-primary">{msg}</span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
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
