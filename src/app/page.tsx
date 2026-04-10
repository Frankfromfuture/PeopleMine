import Link from "next/link"
import AsciiUniverseCanvas from "@/components/AsciiUniverseCanvas"
import LandingNav from "@/components/LandingNav"

const FONT_SANS =
  '"Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif'
const FONT_MONO = '"Geist Mono", "SFMono-Regular", "Courier New", monospace'
const APP_VERSION = "v0.6.1"

const PRINCIPLES = [
  {
    index: "01",
    title: "把人脉沉淀成结构化网络",
    body: "把联系人、公司、标签、关系阶段和关键备注放进同一张图里，让人脉不再只是散落的记录。",
  },
  {
    index: "02",
    title: "让关系经营变成持续动作",
    body: "看见谁正在降温，谁值得优先跟进，谁需要重新连接，把关系维护从想起来再做变成稳定节奏。",
  },
  {
    index: "03",
    title: "围绕目标寻找连接路径",
    body: "从一个具体目标出发，借助已有关系网络找到更清晰的推进路径，也看见还缺失的关键节点。",
  },
]

const WORKFLOW = [
  {
    label: "Capture",
    title: "先快速记录，再慢慢补全",
    detail: "先把人记下来，不错过任何值得保留的连接，再随着互动逐步补充画像、标签与上下文。",
  },
  {
    label: "Detect",
    title: "持续感知关系热度变化",
    detail: "通过热度、互动和信号变化判断谁需要维护、谁值得推进，让经营动作更有依据。",
  },
  {
    label: "Navigate",
    title: "把下一步连接动作看清楚",
    detail: "把该联系谁、什么时候联系、还缺什么节点整理成可执行路径，而不是停留在模糊判断里。",
  },
]

function Hero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#fbf8f3] pt-20 text-[#111] sm:pt-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(255,255,255,0.88),transparent_24%),radial-gradient(circle_at_76%_34%,rgba(255,255,255,0.72),transparent_30%),linear-gradient(180deg,rgba(251,248,243,0.02)_0%,rgba(251,248,243,0.16)_34%,rgba(251,248,243,0.52)_62%,rgba(251,248,243,0.86)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(251,248,243,0.99)_0%,rgba(251,248,243,0.94)_18%,rgba(251,248,243,0.68)_48%,rgba(251,248,243,0.84)_100%)]" />
      <div className="pointer-events-none absolute inset-y-[-12%] right-[-12%] hidden w-[74vw] min-w-[860px] lg:block">
        <AsciiUniverseCanvas variant="light" quality="desktop" className="opacity-[0.94]" />
      </div>
      <div className="pointer-events-none absolute right-[-34%] top-[6%] h-[48vh] w-[95vw] sm:hidden">
        <AsciiUniverseCanvas variant="light" quality="mobile" className="opacity-[0.9]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100svh-5.5rem)] max-w-[1440px] items-center px-4 pb-12 sm:px-8 lg:px-12 lg:pb-16">
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,680px)_minmax(280px,1fr)] lg:items-center">
          <div className="max-w-[680px]">
            <div
              className="mb-7 inline-flex items-center gap-3 rounded-full border border-black/10 bg-black/[0.03] px-4 py-2 text-[11px] text-[#585858]"
              style={{ fontFamily: FONT_MONO, letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#2AA952] shadow-[0_0_0_3px_rgba(42,169,82,0.16)]" />
              Powered by XMiner AI Platfrom
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <p
                  className="text-[12px] text-[#6e6e6e] sm:text-[13px]"
                  style={{ fontFamily: FONT_MONO, letterSpacing: "0.24em", textTransform: "uppercase" }}
                >
                  PeopleMine
                </p>
                <h1
                  className="max-w-[10ch] text-[38px] font-semibold leading-[1.02] tracking-[-0.05em] text-[#161616] sm:text-[56px] lg:text-[74px]"
                  style={{ fontFamily: FONT_SANS }}
                >
                  把人脉经营成
                  <br />
                  可导航的资产宇宙
                </h1>
              </div>

              <p
                className="max-w-[34rem] text-[15px] leading-8 text-[#4f4f4f] sm:text-[17px]"
                style={{ fontFamily: FONT_SANS }}
              >
                PeopleMine 把联系人、公司、目标与关系状态组织成一张可以持续经营的网络图谱。
                你不必再靠记忆管理关系，而是能更清楚地知道谁值得跟进、谁正在降温、下一步该连接谁。
              </p>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="inline-flex h-14 items-center justify-center rounded-full border border-[#A04F47]/18 bg-[#A04F47] px-8 text-[16px] font-semibold text-white shadow-[0_14px_34px_rgba(160,79,71,0.16)] transition duration-300 hover:-translate-y-0.5 hover:border-[#8f443d] hover:bg-[#96463f] hover:shadow-[0_18px_38px_rgba(160,79,71,0.18)] active:translate-y-0 sm:h-16 sm:px-10 sm:text-[17px]"
                style={{ fontFamily: FONT_SANS }}
              >
                开始使用
              </Link>
              <Link
                href="/product"
                className="inline-flex h-14 items-center justify-center rounded-full border border-black/12 bg-white/72 px-8 text-[16px] font-semibold text-[#2f2f2f] shadow-[0_12px_28px_rgba(0,0,0,0.04)] transition duration-300 hover:-translate-y-0.5 hover:border-black/18 hover:bg-white hover:text-[#1f1f1f] hover:shadow-[0_16px_32px_rgba(0,0,0,0.06)] active:translate-y-0 sm:h-16 sm:px-10 sm:text-[17px]"
                style={{ fontFamily: FONT_SANS }}
              >
                查看产品
              </Link>
            </div>
          </div>

          <div className="hidden" aria-hidden="true">
            <div className="pointer-events-none absolute inset-y-0 right-[-4%] hidden w-[112%] overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_56%_50%,rgba(0,0,0,0.08),transparent_46%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(251,248,243,0)_0%,rgba(251,248,243,0.12)_18%,rgba(251,248,243,0.42)_72%,rgba(251,248,243,0.78)_100%)]" />
            </div>

            <div className="pointer-events-none absolute bottom-6 left-8 hidden">
              <p
                className="mb-3 text-[11px] text-[#5e5e5e]"
                style={{ fontFamily: FONT_MONO, letterSpacing: "0.22em", textTransform: "uppercase" }}
              >
                ASCII Sphere Field
              </p>
              <p
                className="max-w-[18rem] text-[14px] leading-7 text-[#575757]"
                style={{ fontFamily: FONT_SANS }}
              >
                右侧背景球并不是装饰噪点，而是在表达 PeopleMine 的视角:
                人脉是一张会变化、会连接、也能被重新点亮的关系网络。
              </p>
            </div>
          </div>
        </div>
      </div>

      <span
        className="absolute bottom-3 left-4 text-[10px] italic tracking-[0.08em] text-[#6d655d] sm:bottom-4 sm:left-8 lg:bottom-5 lg:left-12"
        style={{ fontFamily: FONT_SANS }}
      >
        {APP_VERSION}
      </span>
    </section>
  )
}

function Principles() {
  return (
    <section id="core" className="border-t border-white/8 bg-[#1a1a1a] py-20 sm:py-24">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-12">
        <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p
              className="mb-3 text-[11px] text-[#7d7d7d]"
              style={{ fontFamily: FONT_MONO, letterSpacing: "0.24em", textTransform: "uppercase" }}
            >
              Core Direction
            </p>
            <h2
              className="max-w-[14ch] text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-[#efefef] sm:text-[38px]"
              style={{ fontFamily: FONT_SANS }}
            >
              把零散的人脉记录
              <br />
              经营成长期资产
            </h2>
          </div>

          <p
            className="max-w-[32rem] text-[14px] leading-7 text-[#9e9e9e] sm:text-[15px]"
            style={{ fontFamily: FONT_SANS }}
          >
            PeopleMine 不是帮你多记几条备注，而是把联系人、公司、目标、热度和连接路径放到同一个系统里，
            让你能持续看见关系变化，也能更主动地经营关键节点。
          </p>
        </div>

        <div className="grid border-y border-white/8 lg:grid-cols-3">
          {PRINCIPLES.map((item) => (
            <div
              key={item.index}
              className="border-b border-white/8 py-8 last:border-b-0 lg:border-b-0 lg:px-8 lg:py-10 lg:[&:not(:last-child)]:border-r lg:[&:not(:last-child)]:border-white/8"
            >
              <p
                className="mb-5 text-[11px] text-[#707070]"
                style={{ fontFamily: FONT_MONO, letterSpacing: "0.22em", textTransform: "uppercase" }}
              >
                / {item.index}
              </p>
              <h3
                className="mb-4 text-[20px] font-semibold leading-8 text-[#ececec]"
                style={{ fontFamily: FONT_SANS }}
              >
                {item.title}
              </h3>
              <p
                className="max-w-[26rem] text-[14px] leading-8 text-[#aaaaaa]"
                style={{ fontFamily: FONT_SANS }}
              >
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Workflow() {
  return (
    <section
      id="workflow"
      className="relative overflow-hidden border-t border-white/8 bg-[#070707] py-20 sm:py-24"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      <div className="mx-auto max-w-[1440px] px-6 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div className="lg:pt-1">
            <p
              className="mb-3 text-[11px] text-[#767676]"
              style={{ fontFamily: FONT_MONO, letterSpacing: "0.24em", textTransform: "uppercase" }}
            >
              Product Workflow
            </p>
            <h2
              className="max-w-[10ch] text-[28px] font-semibold leading-[1.14] tracking-[-0.03em] text-[#ededed] sm:text-[38px]"
              style={{ fontFamily: FONT_SANS }}
            >
              从记录一个联系人开始
              <br />
              到看清下一步该连向谁
            </h2>
          </div>

          <div className="grid gap-0 border-l border-white/8">
            {WORKFLOW.map((item) => (
              <div
                key={item.label}
                className="grid gap-4 border-b border-white/8 py-7 pl-6 last:border-b-0 sm:grid-cols-[120px_1fr] sm:gap-6 sm:pl-8"
              >
                <p
                  className="text-[11px] text-[#6e6e6e]"
                  style={{ fontFamily: FONT_MONO, letterSpacing: "0.2em", textTransform: "uppercase" }}
                >
                  {item.label}
                </p>
                <div>
                  <h3
                    className="mb-2 text-[20px] font-semibold text-[#e6e6e6]"
                    style={{ fontFamily: FONT_SANS }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="max-w-[34rem] text-[14px] leading-8 text-[#9a9a9a]"
                    style={{ fontFamily: FONT_SANS }}
                  >
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function UniverseBand() {
  return (
    <section className="relative h-[340px] overflow-hidden border-t border-white/8 bg-[#141414] sm:h-[420px]">
      <AsciiUniverseCanvas className="opacity-95" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(20,20,20,0.9)_0%,rgba(20,20,20,0.28)_34%,rgba(20,20,20,0.92)_100%)]" />
      <div className="relative mx-auto flex h-full max-w-[1440px] items-center px-6 sm:px-8 lg:px-12">
        <div className="max-w-[38rem]">
          <p
            className="mb-3 text-[11px] text-[#878787]"
            style={{ fontFamily: FONT_MONO, letterSpacing: "0.24em", textTransform: "uppercase" }}
          >
            ASCII Horizon Field
          </p>
          <h2
            className="text-[28px] font-semibold leading-[1.16] tracking-[-0.03em] text-[#f0f0f0] sm:text-[42px]"
            style={{ fontFamily: FONT_SANS }}
          >
            在关系图谱里
            <br />
            看见机会与缺口
          </h2>
          <p
            className="mt-5 max-w-[34rem] text-[14px] leading-8 text-[#b3b3b3] sm:text-[15px]"
            style={{ fontFamily: FONT_SANS }}
          >
            当图谱被持续更新后，ASCII 球就像一幅抽象的关系星图:
            节点会连接、路径会变化，而你的目标，也能被拆解成一条更可执行的到达路线。
          </p>
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section id="start" className="border-t border-white/8 bg-[#050505] py-20 sm:py-24">
      <div className="mx-auto max-w-[960px] px-6 text-center sm:px-8">
        <p
          className="mb-4 text-[11px] text-[#7a7a7a]"
          style={{ fontFamily: FONT_MONO, letterSpacing: "0.24em", textTransform: "uppercase" }}
        >
          Start Mapping
        </p>
        <h2
          className="text-[30px] font-semibold leading-[1.16] tracking-[-0.03em] text-[#f0f0f0] sm:text-[46px]"
          style={{ fontFamily: FONT_SANS }}
        >
          从今天开始
          <br />
          把重要人脉经营起来
        </h2>
        <p
          className="mx-auto mt-5 max-w-[34rem] text-[15px] leading-8 text-[#9f9f9f]"
          style={{ fontFamily: FONT_SANS }}
        >
          不论你是在整理现有关系、准备做高质量拓展，还是想围绕一个具体目标找路径，
          PeopleMine 都会先帮你把网络看清，再帮你决定下一步。
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#A04F47] px-7 text-[13px] font-semibold text-white transition hover:bg-[#A04F47]/90"
            style={{ fontFamily: FONT_SANS }}
          >
            开始建立我的图谱
          </Link>
          <Link
            href="/product"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/12 px-7 text-[13px] font-medium text-[#d0d0d0] transition hover:border-white/22 hover:text-white"
            style={{ fontFamily: FONT_SANS }}
          >
            先看看产品
          </Link>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-black/8 bg-[#e8e5e0] py-8">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-6 text-[11px] text-[#6d6d6d] sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        <span style={{ fontFamily: FONT_MONO, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          PeopleMine
        </span>
        <span style={{ fontFamily: FONT_SANS }}>Your Asset, Your Mine.</span>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#e8e5e0] text-[#111]" style={{ fontFamily: FONT_SANS }}>
      <LandingNav />
      <Hero />
      <Principles />
      <Workflow />
      <UniverseBand />
      <FinalCta />
      <Footer />
    </div>
  )
}
