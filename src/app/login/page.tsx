'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, Code2, ShieldCheck, Sparkles } from 'lucide-react'

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

function PeopleMineLogo() {
  return (
    <svg
      viewBox="0 0 2180 314"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-[28px] w-auto sm:h-[34px] lg:h-[38px]"
      aria-label="PeopleMine"
      role="img"
    >
      <path d="M120 214C120 186.386 142.386 164 170 164H220C247.614 164 270 186.386 270 214V264C270 291.614 247.614 314 220 314H170C142.386 314 120 291.614 120 264V214Z" fill="url(#login_pm_f0)"/>
      <path d="M270 50C270 22.3858 292.386 0 320 0H370C397.614 0 420 22.3858 420 50V100C420 127.614 397.614 150 370 150H320C292.386 150 270 127.614 270 100V50Z" fill="url(#login_pm_f1)"/>
      <path d="M270 100C270 127.614 292.386 150 320 150C292.386 150 270 172.386 270 200V214C270 186.386 247.614 164 220 164C247.614 164 270 141.614 270 114V100Z" fill="url(#login_pm_f2)"/>
      <path d="M420 197C420 169.386 442.386 147 470 147H520C547.614 147 570 169.386 570 197V247C570 274.614 547.614 297 520 297H470C442.386 297 420 274.614 420 247V197Z" fill="#8F959E"/>
      <path d="M300 222C300 202.67 315.67 187 335 187H355C374.33 187 390 202.67 390 222V242C390 261.33 374.33 277 355 277H335C315.67 277 300 261.33 300 242V222Z" fill="#8F959E"/>
      <path d="M150 82C150 62.67 165.67 47 185 47H205C224.33 47 240 62.67 240 82V102C240 121.33 224.33 137 205 137H185C165.67 137 150 121.33 150 102V82Z" fill="#A04F47"/>
      <path d="M0 242C0 222.67 15.67 207 35 207H55C74.33 207 90 222.67 90 242V262C90 281.33 74.33 297 55 297H35C15.67 297 0 281.33 0 262V242Z" fill="#A04F47"/>
      <path d="M2112 256C2112 242.193 2123.19 231 2137 231H2155C2168.81 231 2180 242.193 2180 256V274C2180 287.807 2168.81 299 2155 299H2137C2123.19 299 2112 287.807 2112 274V256Z" fill="#A04F47"/>
      <path d="M692.85 295.676H654.66C653.553 295.676 653 295.122 653 294.014L653.664 60.1526C653.664 59.2661 654.107 58.8229 654.992 58.8229H720.412C741.223 58.8229 757.661 65.1944 769.726 77.9373C781.903 90.5695 787.991 107.8 787.991 129.629C787.991 145.586 784.836 159.492 778.527 171.349C772.106 183.094 763.804 192.181 753.62 198.608C743.437 205.035 732.367 208.248 720.412 208.248H694.51V294.014C694.51 295.122 693.957 295.676 692.85 295.676ZM720.412 99.2125L694.51 99.545V167.027H720.412C727.607 167.027 733.862 163.592 739.175 156.722C744.488 149.741 747.145 140.71 747.145 129.629C747.145 120.765 744.765 113.507 740.005 107.856C735.245 102.094 728.714 99.2125 720.412 99.2125Z" fill="url(#login_pm_t0)"/>
      <path d="M919.661 295.676H809.742C808.857 295.676 808.414 295.122 808.414 294.014L808.746 60.1526C808.746 59.2661 809.189 58.8229 810.074 58.8229H919.329C920.214 58.8229 920.657 59.3769 920.657 60.485V98.5477C920.657 99.4342 920.214 99.8774 919.329 99.8774H849.592V153.065H919.329C920.214 153.065 920.657 153.509 920.657 154.395L920.989 192.956C920.989 193.843 920.546 194.286 919.661 194.286H849.592V253.79H919.661C920.546 253.79 920.989 254.344 920.989 255.452V294.346C920.989 295.233 920.546 295.676 919.661 295.676Z" fill="url(#login_pm_t1)"/>
      <path d="M1014.14 299C1002.07 299 990.948 295.897 980.764 289.692C970.691 283.487 962.555 275.232 956.356 264.926C950.268 254.51 947.224 243.097 947.224 230.687L947.556 122.815C947.556 110.183 950.6 98.8247 956.688 88.7411C962.665 78.5468 970.746 70.4024 980.93 64.3079C991.114 58.1026 1002.18 55 1014.14 55C1026.54 55 1037.66 58.0472 1047.51 64.1417C1057.47 70.2362 1065.44 78.436 1071.42 88.7411C1077.51 98.9355 1080.55 110.293 1080.55 122.815L1080.89 230.687C1080.89 243.097 1077.9 254.455 1071.92 264.76C1065.83 275.176 1057.75 283.487 1047.68 289.692C1037.6 295.897 1026.42 299 1014.14 299ZM1014.14 257.945C1021 257.945 1026.98 255.175 1032.07 249.635C1037.16 243.984 1039.71 237.668 1039.71 230.687L1039.38 122.815C1039.38 115.28 1037 108.908 1032.24 103.7C1027.48 98.4923 1021.44 95.8883 1014.14 95.8883C1007.16 95.8883 1001.19 98.4369 996.205 103.534C991.224 108.631 988.734 115.058 988.734 122.815V230.687C988.734 238.111 991.224 244.538 996.205 249.967C1001.19 255.286 1007.16 257.945 1014.14 257.945Z" fill="url(#login_pm_t2)"/>
      <path d="M1146.47 295.676H1108.28C1107.18 295.676 1106.62 295.122 1106.62 294.014L1107.29 60.1526C1107.29 59.2661 1107.73 58.8229 1108.61 58.8229H1174.03C1194.85 58.8229 1211.28 65.1944 1223.35 77.9373C1235.53 90.5695 1241.61 107.8 1241.61 129.629C1241.61 145.586 1238.46 159.492 1232.15 171.349C1225.73 183.094 1217.43 192.181 1207.24 198.608C1197.06 205.035 1185.99 208.248 1174.03 208.248H1148.13V294.014C1148.13 295.122 1147.58 295.676 1146.47 295.676ZM1174.03 99.2125L1148.13 99.545V167.027H1174.03C1181.23 167.027 1187.48 163.592 1192.8 156.722C1198.11 149.741 1200.77 140.71 1200.77 129.629C1200.77 120.765 1198.39 113.507 1193.63 107.856C1188.87 102.094 1182.34 99.2125 1174.03 99.2125Z" fill="url(#login_pm_t3)"/>
      <path d="M1375.94 295.676H1266.02C1265.14 295.676 1264.69 295.122 1264.69 294.014L1265.02 60.485C1265.02 59.3769 1265.58 58.8229 1266.69 58.8229H1304.54C1305.65 58.8229 1306.2 59.3769 1306.2 60.485L1305.87 253.79H1375.94C1377.05 253.79 1377.6 254.344 1377.6 255.452V294.014C1377.6 295.122 1377.05 295.676 1375.94 295.676Z" fill="url(#login_pm_t4)"/>
      <path d="M1511.1 295.676H1401.18C1400.29 295.676 1399.85 295.122 1399.85 294.014L1400.18 60.1526C1400.18 59.2661 1400.62 58.8229 1401.51 58.8229H1510.76C1511.65 58.8229 1512.09 59.3769 1512.09 60.485V98.5477C1512.09 99.4342 1511.65 99.8774 1510.76 99.8774H1441.03V153.065H1510.76C1511.65 153.065 1512.09 153.509 1512.09 154.395L1512.43 192.956C1512.43 193.843 1511.98 194.286 1511.1 194.286H1441.03V253.79H1511.1C1511.98 253.79 1512.43 254.344 1512.43 255.452V294.346C1512.43 295.233 1511.98 295.676 1511.1 295.676Z" fill="url(#login_pm_t5)"/>
      <path d="M1582.49 295.676H1543.97C1543.09 295.676 1542.64 295.122 1542.64 294.014L1543.31 60.1526C1543.31 59.2661 1543.75 58.8229 1544.64 58.8229H1586.15C1587.03 58.8229 1587.81 59.2661 1588.47 60.1526L1619.52 105.03L1650.4 60.1526C1651.07 59.2661 1651.9 58.8229 1652.9 58.8229H1694.57C1695.57 58.8229 1696.07 59.2661 1696.07 60.1526L1696.73 294.014C1696.73 295.122 1696.29 295.676 1695.4 295.676H1656.88C1655.99 295.676 1655.55 295.122 1655.55 294.014L1655.22 120.322L1619.52 172.18L1584.15 120.322L1583.82 294.014C1583.82 295.122 1583.38 295.676 1582.49 295.676Z" fill="url(#login_pm_t6)"/>
      <path d="M1765.47 295.676H1726.95C1725.84 295.676 1725.29 295.122 1725.29 294.014L1725.62 60.1526C1725.62 59.2661 1726.06 58.8229 1726.95 58.8229H1765.14C1766.02 58.8229 1766.47 59.2661 1766.47 60.1526L1766.8 294.014C1766.8 295.122 1766.36 295.676 1765.47 295.676Z" fill="url(#login_pm_t7)"/>
      <path d="M1833.71 295.676H1799.67C1797.9 295.676 1797.02 294.9 1797.02 293.349L1796.69 61.4823C1796.69 59.7094 1797.57 58.8229 1799.34 58.8229H1830.06L1887.51 192.956L1885.85 61.4823C1885.85 59.7094 1886.85 58.8229 1888.84 58.8229H1922.54C1923.87 58.8229 1924.54 59.7094 1924.54 61.4823L1924.87 293.681C1924.87 295.011 1924.32 295.676 1923.21 295.676H1893.32L1834.38 170.352L1836.87 293.016C1836.87 294.789 1835.82 295.676 1833.71 295.676Z" fill="url(#login_pm_t8)"/>
      <path d="M2065.67 295.676H1955.75C1954.87 295.676 1954.42 295.122 1954.42 294.014L1954.76 60.1526C1954.76 59.2661 1955.2 58.8229 1956.08 58.8229H2065.34C2066.22 58.8229 2066.67 59.3769 2066.67 60.485V98.5477C2066.67 99.4342 2066.22 99.8774 2065.34 99.8774H1995.6V153.065H2065.34C2066.22 153.065 2066.67 153.509 2066.67 154.395L2067 192.956C2067 193.843 2066.56 194.286 2065.67 194.286H1995.6V253.79H2065.67C2066.56 253.79 2067 254.344 2067 255.452V294.346C2067 295.233 2066.56 295.676 2065.67 295.676Z" fill="url(#login_pm_t9)"/>
      <defs>
        <linearGradient id="login_pm_f0" x1="120" y1="305.468" x2="420" y2="8.53204" gradientUnits="userSpaceOnUse">
          <stop offset="0.365385" stopColor="#A04F47"/>
          <stop offset="0.625" stopColor="#8F959E"/>
        </linearGradient>
        <linearGradient id="login_pm_f1" x1="120" y1="305.468" x2="420" y2="8.53204" gradientUnits="userSpaceOnUse">
          <stop offset="0.365385" stopColor="#A04F47"/>
          <stop offset="0.625" stopColor="#8F959E"/>
        </linearGradient>
        <linearGradient id="login_pm_f2" x1="120" y1="305.468" x2="420" y2="8.53204" gradientUnits="userSpaceOnUse">
          <stop offset="0.365385" stopColor="#A04F47"/>
          <stop offset="0.625" stopColor="#8F959E"/>
        </linearGradient>
        <linearGradient id="login_pm_t0" x1="653" y1="177" x2="2067" y2="177" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8F959E"/>
          <stop offset="1" stopColor="#333538"/>
        </linearGradient>
        <linearGradient id="login_pm_t1" x1="653" y1="177" x2="2067" y2="177" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8F959E"/>
          <stop offset="1" stopColor="#333538"/>
        </linearGradient>
        <linearGradient id="login_pm_t2" x1="653" y1="177" x2="2067" y2="177" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8F959E"/>
          <stop offset="1" stopColor="#333538"/>
        </linearGradient>
        <linearGradient id="login_pm_t3" x1="653" y1="177" x2="2067" y2="177" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8F959E"/>
          <stop offset="1" stopColor="#333538"/>
        </linearGradient>
        <linearGradient id="login_pm_t4" x1="653" y1="177" x2="2067" y2="177" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8F959E"/>
          <stop offset="1" stopColor="#333538"/>
        </linearGradient>
        <linearGradient id="login_pm_t5" x1="653" y1="177" x2="2067" y2="177" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8F959E"/>
          <stop offset="1" stopColor="#333538"/>
        </linearGradient>
        <linearGradient id="login_pm_t6" x1="653" y1="177" x2="2067" y2="177" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A04F47"/>
          <stop offset="1" stopColor="#A04F47"/>
        </linearGradient>
        <linearGradient id="login_pm_t7" x1="653" y1="177" x2="2067" y2="177" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A04F47"/>
          <stop offset="1" stopColor="#A04F47"/>
        </linearGradient>
        <linearGradient id="login_pm_t8" x1="653" y1="177" x2="2067" y2="177" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A04F47"/>
          <stop offset="1" stopColor="#A04F47"/>
        </linearGradient>
        <linearGradient id="login_pm_t9" x1="653" y1="177" x2="2067" y2="177" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A04F47"/>
          <stop offset="1" stopColor="#A04F47"/>
        </linearGradient>
      </defs>
    </svg>
  )
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
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-[#A04F47] px-5 text-[14px] font-medium text-white transition hover:bg-[#A04F47]/90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-auto sm:py-2.5"
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
                      className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 px-5 text-[14px] font-medium text-[#4c463f] transition hover:border-black/20 hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-50 sm:h-auto sm:py-2.5"
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
                      className="inline-flex h-10 items-center justify-center rounded-full bg-[#A04F47] px-5 text-[13px] font-medium text-white transition hover:bg-[#A04F47]/90 sm:h-auto sm:py-2.5"
                    >
                      {COPY.devDashboard}
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePreviewEntry('/dev-lab')}
                      disabled={isPending}
                      className="inline-flex h-10 items-center justify-center rounded-full border border-[#A04F47]/20 px-5 text-[13px] font-medium text-[#A04F47] transition hover:bg-[#A04F47]/6 sm:h-auto sm:py-2.5"
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
