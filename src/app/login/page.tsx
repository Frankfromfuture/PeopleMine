'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, Code2, ShieldCheck, Sparkles } from 'lucide-react'
import PeopleMineLogo from '@/components/PeopleMineLogo'

const FONT_SANS =
  '"Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif'
const USE_TEST_LOGIN = true

const COPY = {
  backHome: '返回首页',
  signIn: 'Sign In',
  loginTitle: '登录 PeopleMine',
  phone: '手机号',
  phonePlaceholder: '输入中国大陆手机号',
  code: '验证码',
  codePlaceholder: '输入 6 位验证码',
  resend: '重新发送',
  editPhone: '返回修改手机号',
  sendCode: '发送验证码',
  verifyLogin: '验证并进入',
  devOtpHint:
    '开发环境下验证码固定为 000000，可直接体验主流程。',
  prodOtpHint:
    '验证码有效期 5 分钟，发送后请尽快完成验证。',
  workspaceLabel: 'Relationship Workspace',
  workspaceTitle: 'Xminer_AI 人脉资产管理与分析系统',
  badgeAuthTitle: '验证码登录',
  badgeAuthBody:
    '用手机号进入，不需要记忆额外密码，适合快速回到你的关系工作流。',
  badgeFlowTitle: '继续你的经营节奏',
  badgeFlowBody:
    '进入后可以直接查看热度变化，补齐联系人信息，或继续推进当前目标。',
  badgeDevTitle: '开发者模式',
  badgeDevBodyDev:
    '当前是开发环境，下面保留了一个临时直达入口，便于调试界面与主流程。',
  badgeDevBodyProd:
    '生产环境不会显示开发者临时入口，默认走正式验证码登录流程。',
  devMode: 'Developer Mode',
  devEntryBody:
    '临时入口只在开发环境可见。你可以跳过登录，直接进入主工作台或开发者实验室。',
  devDashboard: '临时进入 Dashboard',
  devLab: '打开开发者实验室',
  phoneInvalid: '请输入正确的 11 位手机号。',
  sendFallback: '验证码发送失败，请稍后再试。',
  sendNetwork: '验证码发送失败，请检查网络后重试。',
  sendDevSuccess: '开发环境验证码固定为 000000。',
  sendProdSuccess: '验证码已发送，请留意短信。',
  codeInvalid: '请输入 6 位验证码。',
  phoneStepInvalid: '手机号格式不正确，请返回上一步检查。',
  verifyFallback: '登录失败，请重新验证。',
  verifyNetwork: '登录失败，请稍后再试。',
  verifySuccess: '登录成功，正在进入工作台。',
} as const

type Feedback = {
  type: 'error' | 'success' | 'info'
  text: string
}

function InfoBadge({
  icon,
  title,
  body,
}: {
  icon: ReactNode
  title: string
  body: string
}) {
  return (
    <div className="flex gap-3 border-t border-black/8 py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#A04F47]/10 text-[#A04F47]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-[#1d1b18]">{title}</p>
        <p className="mt-1 text-[13px] leading-6 text-[#6d655e]">{body}</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [countdown, setCountdown] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (countdown <= 0) return

    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [countdown])

  const sanitizedPhone = useMemo(() => phone.replace(/\D/g, '').slice(0, 11), [phone])
  const sanitizedCode = useMemo(() => code.replace(/\D/g, '').slice(0, 6), [code])

  async function handlePreviewEntry(target: '/dashboard' | '/dev-lab') {
    startTransition(async () => {
      try {
        setFeedback(null)
        const res = await fetch('/api/auth/dev-login', { method: 'POST' })
        const data = await res.json()

        if (!res.ok) {
          setFeedback({ type: 'error', text: String(data.error || COPY.verifyFallback) })
          return
        }

        setFeedback({ type: 'success', text: COPY.verifySuccess })
        router.push(target)
        router.refresh()
      } catch {
        setFeedback({ type: 'error', text: COPY.verifyNetwork })
      }
    })
  }

  async function handleSendOtp() {
    if (!/^1[3-9]\d{9}$/.test(sanitizedPhone)) {
      setFeedback({ type: 'error', text: COPY.phoneInvalid })
      return
    }

    startTransition(async () => {
      try {
        setFeedback(null)
        const res = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: sanitizedPhone }),
        })
        const data = await res.json()

        if (!res.ok) {
          setFeedback({ type: 'error', text: String(data.error || COPY.sendFallback) })
          return
        }

        setStep('code')
        setCountdown(60)
        setFeedback({
          type: 'success',
          text: USE_TEST_LOGIN ? COPY.sendDevSuccess : COPY.sendProdSuccess,
        })
      } catch {
        setFeedback({ type: 'error', text: COPY.sendNetwork })
      }
    })
  }

  async function handleVerifyOtp() {
    if (!/^1[3-9]\d{9}$/.test(sanitizedPhone)) {
      setFeedback({ type: 'error', text: COPY.phoneStepInvalid })
      return
    }

    if (sanitizedCode.length !== 6) {
      setFeedback({ type: 'error', text: COPY.codeInvalid })
      return
    }

    startTransition(async () => {
      try {
        setFeedback(null)
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: sanitizedPhone, code: sanitizedCode }),
        })
        const data = await res.json()

        if (!res.ok) {
          setFeedback({ type: 'error', text: String(data.error || COPY.verifyFallback) })
          return
        }

        setFeedback({ type: 'success', text: COPY.verifySuccess })
        router.push('/dashboard')
        router.refresh()
      } catch {
        setFeedback({ type: 'error', text: COPY.verifyNetwork })
      }
    })
  }

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#f6f1ea] text-[#1d1b18]" style={{ fontFamily: FONT_SANS }}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.84),transparent_24%),radial-gradient(circle_at_78%_24%,rgba(160,79,71,0.10),transparent_22%),linear-gradient(180deg,rgba(246,241,234,0.92)_0%,rgba(246,241,234,1)_100%)]" />
      <div
        className="relative mx-auto flex min-h-[100dvh] max-w-[1500px] flex-col px-4 pt-4 sm:px-8 sm:pt-5 lg:px-10 lg:pt-6"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        <header className="flex items-center justify-between gap-3">
          <PeopleMineLogo />
          <Link
            href="/"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3.5 text-[12px] text-[#5f584f] transition hover:border-black/20 hover:text-[#1d1b18] sm:h-10 sm:px-4 sm:text-[13px]"
          >
            <ArrowLeft className="h-4 w-4" />
            {COPY.backHome}
          </Link>
        </header>

        <main className="flex flex-1 items-start py-4 sm:items-center sm:py-5 lg:py-6">
          <div className="grid w-full gap-4 sm:gap-6 lg:grid-cols-[minmax(0,540px)_minmax(0,1fr)] lg:gap-8">
            <section className="relative overflow-hidden rounded-[24px] border border-black/8 bg-[rgba(255,255,255,0.78)] p-4 shadow-[0_18px_80px_rgba(40,24,16,0.08)] backdrop-blur-xl sm:rounded-[28px] sm:p-7">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#A04F47] via-[#c78982] to-transparent" />

              <div className="mb-6">
                <div className="sm:hidden">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#8a827a]">{COPY.workspaceLabel}</p>
                  <h1 className="mt-2 text-[24px] font-semibold leading-[1.14] tracking-[-0.03em] text-[#1d1b18]">
                    {COPY.workspaceTitle}
                  </h1>
                  <p className="mt-2 text-[18px] font-medium leading-tight text-[#4d463f]">{COPY.loginTitle}</p>
                </div>

                <div className="hidden sm:block">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#A04F47]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-[#A04F47]">
                    <Sparkles className="h-3.5 w-3.5" />
                    {COPY.signIn}
                  </div>
                  <h1 className="mt-4 text-[26px] font-semibold leading-[1.08] tracking-[-0.04em] text-[#1d1b18] sm:text-[38px]">
                    {COPY.loginTitle}
                  </h1>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[13px] font-medium text-[#413a34]">{COPY.phone}</label>
                  <input
                    value={sanitizedPhone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder={COPY.phonePlaceholder}
                    inputMode="numeric"
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-[15px] text-[#1d1b18] outline-none transition focus:border-[#A04F47]/45 focus:ring-4 focus:ring-[#A04F47]/10"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <label className="block text-[13px] font-medium text-[#413a34]">{COPY.code}</label>
                    {step === 'code' ? (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={countdown > 0 || isPending}
                        className="text-[12px] text-[#A04F47] transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        {countdown > 0 ? `${countdown}s 后可重发` : COPY.resend}
                      </button>
                    ) : null}
                  </div>
                  <input
                    value={sanitizedCode}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder={COPY.codePlaceholder}
                    inputMode="numeric"
                    disabled={step !== 'code'}
                    className="h-12 w-full rounded-2xl border border-black/10 bg-white px-4 text-[15px] tracking-[0.26em] text-[#1d1b18] outline-none transition placeholder:tracking-normal focus:border-[#A04F47]/45 focus:ring-4 focus:ring-[#A04F47]/10 disabled:cursor-not-allowed disabled:bg-[#f4efe8] disabled:text-[#a39b93]"
                  />
                </div>

                <div
                  className={`rounded-2xl px-4 py-3 text-[13px] leading-6 ${
                    feedback
                      ? feedback.type === 'error'
                        ? 'bg-[#a04f47]/10 text-[#8d433c]'
                        : feedback.type === 'success'
                          ? 'bg-[#244a38]/10 text-[#244a38]'
                          : 'bg-black/5 text-[#4f4a44]'
                      : 'bg-black/[0.03] text-[#615951]'
                  }`}
                >
                  {feedback ? feedback.text : USE_TEST_LOGIN ? COPY.devOtpHint : COPY.prodOtpHint}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={step === 'phone' ? handleSendOtp : handleVerifyOtp}
                    disabled={isPending}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#A04F47] px-6 text-[14px] font-medium text-white transition hover:bg-[#A04F47]/90 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[188px] sm:flex-1"
                  >
                    {step === 'phone' ? COPY.sendCode : COPY.verifyLogin}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  {step === 'code' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setStep('phone')
                        setCode('')
                        setFeedback(null)
                      }}
                      disabled={isPending}
                      className="inline-flex h-10 w-full items-center justify-center rounded-full border border-black/10 px-6 text-[14px] font-medium text-[#4c463f] transition hover:border-black/20 hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[188px] sm:w-auto"
                    >
                      {COPY.editPhone}
                    </button>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="flex flex-col justify-between rounded-[24px] border border-black/8 bg-[rgba(255,255,255,0.54)] p-4 shadow-[0_8px_40px_rgba(40,24,16,0.05)] backdrop-blur-sm sm:rounded-[28px] sm:p-7">
              <div className="hidden sm:block">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#8a827a]">{COPY.workspaceLabel}</p>
                <h2 className="mt-3 text-[22px] font-semibold leading-[1.08] tracking-[-0.04em] text-[#1d1b18] sm:text-[32px] xl:text-[38px]">
                  {COPY.workspaceTitle}
                </h2>
              </div>

              <div className="mt-5 hidden gap-3 sm:grid xl:grid-cols-1">
                <InfoBadge
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title={COPY.badgeAuthTitle}
                  body={COPY.badgeAuthBody}
                />
                <InfoBadge
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  title={COPY.badgeFlowTitle}
                  body={COPY.badgeFlowBody}
                />
                <InfoBadge
                  icon={<Code2 className="h-5 w-5" />}
                  title={COPY.badgeDevTitle}
                  body={USE_TEST_LOGIN ? COPY.badgeDevBodyDev : COPY.badgeDevBodyProd}
                />
              </div>

              {USE_TEST_LOGIN ? (
                <div className="mt-5 rounded-[24px] border border-[#A04F47]/18 bg-[#A04F47]/6 p-4">
                  <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-[#A04F47]">
                    {COPY.devMode}
                  </p>
                  <p className="mt-2 text-[13px] leading-6 text-[#5d554e]">{COPY.devEntryBody}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handlePreviewEntry('/dashboard')}
                      disabled={isPending}
                      className="inline-flex h-10 min-w-[188px] items-center justify-center rounded-full bg-[#A04F47] px-6 text-[13px] font-medium text-white transition hover:bg-[#A04F47]/90"
                    >
                      {COPY.devDashboard}
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePreviewEntry('/dev-lab')}
                      disabled={isPending}
                      className="inline-flex h-10 min-w-[188px] items-center justify-center rounded-full border border-[#A04F47]/20 px-6 text-[13px] font-medium text-[#A04F47] transition hover:bg-[#A04F47]/6"
                    >
                      {COPY.devLab}
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
