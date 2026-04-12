import Link from "next/link"
import AsciiUniverseCanvas from "@/components/AsciiUniverseCanvas"
import LandingNav from "@/components/LandingNav"
import { APP_VERSION } from "@/lib/version"

const FONT_SANS =
  '"Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif'
const FONT_MONO = '"Geist Mono", "SFMono-Regular", "Courier New", monospace'
const PAGE_GUTTER_CLASS = "px-[clamp(16px,4vw,72px)]"

const PRINCIPLES = [
  {
    index: "01",
    title: "把人脉沉淀成结构化网络",
    body: "把联系人、公司、标签、关系阶段和关键备注放进同一张图里，让人脉不再只是零散的记录。",
  },
  {
    index: "02",
    title: "让关系经营变成持续动作",
    body: "看见谁正在降温、谁值得优先跟进、谁需要重新连接，把关系维护从想起来再做变成稳定节奏。",
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
    <section className="relative min-h-[100svh] overflow-hidden bg-[#f1f1f1] pt-[96px] text-[#111] sm:pt-[clamp(74px,9vw,118px)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(132%_90%_at_12%_-10%,#f6f6f6_0%,#efefef_58%,#e2e2e2_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(78%_58%_at_36%_102%,rgba(218,218,218,0.94)_0%,rgba(226,226,226,0.68)_40%,rgba(241,241,241,0)_74%)]" />
      <div className="pointer-events-none absolute inset-0">
        <AsciiUniverseCanvas
          variant="light"
          quality="auto"
          maxDpr={1.5}
          lightDesktopRadiusScale={0.67}
          lightMobileRadiusScale={1.3}
          lightMobileCharScale={0.7}
          className="translate-y-[8%] opacity-[0.25] sm:translate-y-0"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(92%_66%_at_42%_38%,rgba(236,236,236,0.16)_0%,rgba(240,240,240,0.84)_70%,rgba(241,241,241,0.98)_100%)]" />

      <div
        className={`relative flex min-h-[calc(100svh-6.5rem)] w-full items-center pb-[88px] sm:min-h-[calc(100svh-5.5rem)] sm:pb-[clamp(48px,6vw,80px)] ${PAGE_GUTTER_CLASS}`}
      >
        <div className="grid w-full gap-10 sm:gap-[clamp(20px,4vw,56px)] xl:grid-cols-[minmax(560px,48vw)_minmax(320px,1fr)] xl:items-center">
          <div className="flex max-w-[min(760px,100vw)] flex-col justify-center gap-8 py-8 sm:gap-[clamp(16px,2.8vh,30px)] sm:py-[clamp(8px,2vh,24px)]">
            <div
              className="inline-flex w-fit items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-[clamp(8px,1vw,12px)] py-[clamp(4px,0.55vw,6px)] text-[clamp(9px,0.72vw,11px)] leading-none text-[#585858]"
              style={{ fontFamily: FONT_MONO, letterSpacing: "0.18em", textTransform: "uppercase" }}
            >
              <span className="inline-block h-[5px] w-[5px] animate-pulse rounded-full bg-[#2AA952] shadow-[0_0_0_3px_rgba(42,169,82,0.16)]" />
              Powered by XMiner AI Platform
            </div>

            <div className="space-y-6 sm:space-y-[clamp(14px,2vh,24px)]">
              <div className="space-y-4 sm:space-y-[clamp(10px,1.6vh,18px)]">
                <p
                  className="text-[clamp(11px,1.1vw,13px)] text-[#6e6e6e]"
                  style={{ fontFamily: FONT_MONO, letterSpacing: "0.24em", textTransform: "uppercase" }}
                >
                  PeopleMine
                </p>
                <h1
                  className="max-w-[10.8ch] text-[clamp(42px,14vw,62px)] font-semibold leading-[1.08] tracking-[-0.04em] text-[#A04F47] [text-wrap:balance] sm:max-w-none sm:text-[clamp(30px,10vw,82px)] sm:leading-[1.03] sm:tracking-[-0.05em]"
                  style={{ fontFamily: FONT_SANS }}
                >
                  <span className="sm:block sm:whitespace-nowrap">每天10分钟</span>
                  <span className="sm:block sm:whitespace-nowrap">将你的人脉变为长期资产</span>
                </h1>
              </div>

              <p
                className="mt-3 max-w-[34rem] text-[15px] leading-[1.95] text-[#4f4f4f] sm:mt-0 sm:max-w-[40rem] sm:text-[clamp(14px,1.5vw,18px)] sm:leading-[1.9]"
                style={{ fontFamily: FONT_SANS }}
              >
                通过创新的录入与整理方式，PeopleMine会神奇地将你的人脉变成你的专属资源宇宙。你以后不必再靠记忆，专属的XMiner_AI平台会帮助你整理、跟进与分析人脉资源，制定路径实现目标。
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <Link
                href="/login"
                className="inline-flex h-[clamp(50px,5.2vw,64px)] items-center justify-center rounded-full border border-[#A04F47]/18 bg-[#A04F47] px-[clamp(24px,2.5vw,42px)] text-[clamp(15px,1.45vw,18px)] font-semibold text-white shadow-[0_14px_34px_rgba(160,79,71,0.16)] transition duration-300 hover:-translate-y-0.5 hover:border-[#8f443d] hover:bg-[#96463f] hover:shadow-[0_18px_38px_rgba(160,79,71,0.18)] active:translate-y-0"
                style={{ fontFamily: FONT_SANS }}
              >
                开始使用
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
                右侧背景球并不是装饰噪点，而是在表达 PeopleMine 的视觉隐喻：人脉是一张会变化、会连接、也能被重新点亮的关系网络。
              </p>
            </div>
          </div>
        </div>
      </div>

      <span
        className="absolute bottom-[clamp(12px,2vw,24px)] left-[clamp(16px,4vw,72px)] text-[10px] italic tracking-[0.08em] text-[#6d655d]"
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
      <div className={`w-full ${PAGE_GUTTER_CLASS}`}>
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
            PeopleMine 不是帮你多记几条备注，而是把联系人、公司、目标、热度和连接路径放到同一个系统里，让你能持续看见关系变化，也能更主动地经营关键节点。
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
      <div className={`w-full ${PAGE_GUTTER_CLASS}`}>
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
      <div className={`relative flex h-full w-full items-center ${PAGE_GUTTER_CLASS}`}>
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
            当人脉资产持续更新，你的人脉将会神奇的变为关系星图与资源宇宙：节点会连接、路径会变化、隐性关系被挖掘，而你的目标也将被拆解成一条更可执行的到达路线。
          </p>
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section id="start" className="border-t border-white/8 bg-[#050505] py-20 sm:py-24">
      <div className={`w-full text-center ${PAGE_GUTTER_CLASS}`}>
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
          不论你是在整理现有关系、准备做高质量拓展，还是想围绕一个具体目标找路径，PeopleMine 都会先帮你把网络看清，再帮你决定下一步。
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#A04F47] px-7 text-[13px] font-semibold text-white transition hover:bg-[#A04F47]/90"
            style={{ fontFamily: FONT_SANS }}
          >
            开始建立我的图谱
          </Link>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-black/8 bg-[#e8e5e0] py-8">
      <div
        className={`flex w-full flex-col gap-3 text-[11px] text-[#6d6d6d] lg:flex-row lg:items-center lg:justify-between ${PAGE_GUTTER_CLASS}`}
      >
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

