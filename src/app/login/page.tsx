'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PHONE_REGEX, OTP_LENGTH, OTP_RATE_LIMIT_SECONDS } from '@/lib/constants'

type Step = 'phone' | 'otp'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function startCountdown() {
    setCountdown(OTP_RATE_LIMIT_SECONDS)
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function handleSendOtp() {
    setError('')
    if (!PHONE_REGEX.test(phone)) {
      setError('请输入正确的手机号')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setStep('otp')
      startCountdown()
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp() {
    setError('')
    if (otp.length !== OTP_LENGTH) { setError(`请输入${OTP_LENGTH}位验证码`); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otp }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push(data.isNew ? '/onboarding' : '/')
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight">人迈</h1>
          <p className="text-slate-400 mt-1 text-sm">Your Asset, Your Mine</p>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          {step === 'phone' ? (
            <>
              <h2 className="text-white text-lg font-semibold mb-1">登录 / 注册</h2>
              <p className="text-slate-400 text-sm mb-5">输入手机号获取验证码</p>

              <div className="mb-4">
                <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 focus-within:border-blue-500 transition-colors">
                  <span className="text-slate-400 pl-4 pr-2 text-sm select-none">+86</span>
                  <input
                    type="tel"
                    maxLength={11}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                    placeholder="请输入手机号"
                    className="flex-1 bg-transparent text-white placeholder-slate-500 py-3 pr-4 text-sm outline-none"
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

              <button
                onClick={handleSendOtp}
                disabled={loading || phone.length !== 11}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-3 rounded-xl text-sm transition-colors"
              >
                {loading ? '发送中…' : '获取验证码'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep('phone'); setOtp(''); setError('') }}
                className="text-slate-400 hover:text-white text-sm mb-4 flex items-center gap-1 transition-colors"
              >
                ← 返回
              </button>

              <h2 className="text-white text-lg font-semibold mb-1">输入验证码</h2>
              <p className="text-slate-400 text-sm mb-5">
                已发送至 <span className="text-white">{phone}</span>
              </p>

              <div className="mb-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={OTP_LENGTH}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                  placeholder={`${OTP_LENGTH}位验证码`}
                  autoFocus
                  className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 text-white placeholder-slate-500 rounded-xl py-3 px-4 text-sm outline-none text-center tracking-[0.3em] text-base transition-colors"
                />
              </div>

              {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== OTP_LENGTH}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-3 rounded-xl text-sm transition-colors mb-3"
              >
                {loading ? '验证中…' : '登录'}
              </button>

              <button
                onClick={handleSendOtp}
                disabled={countdown > 0 || loading}
                className="w-full text-slate-400 hover:text-white disabled:text-slate-600 text-sm py-2 transition-colors"
              >
                {countdown > 0 ? `${countdown}秒后重新发送` : '重新发送'}
              </button>
            </>
          )}
        </div>

        <p className="text-slate-600 text-xs text-center mt-6">
          登录即代表同意服务条款和隐私政策
        </p>
      </div>
    </div>
  )
}
