import Link from 'next/link'
import AsciiUniverseCanvas from '@/components/AsciiUniverseCanvas'
import LandingNav from '@/components/LandingNav'

const SERIF = '"Noto Serif SC", "Source Han Serif SC", serif'
const MONO  = '"Courier New", monospace'

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: '100svh', background: '#030303' }}
    >
      {/* 3D ASCII Network Canvas */}
      <AsciiUniverseCanvas />

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 20%, #030303 100%)',
        }}
      />

      {/* Center content */}
      <div className="relative z-10 text-center px-6" style={{ maxWidth: 760 }}>
        {/* Status badge */}
        <div
          className="inline-flex items-center gap-2 mb-10"
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '5px 14px',
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#a0a0a0',
              display: 'inline-block',
              animation: 'pulse 2s infinite',
            }}
          />
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.22em',
              color: '#555',
              textTransform: 'uppercase',
            }}
          >
            DEMO 1.0 · 公测中
          </span>
        </div>

        {/* Main headline */}
        <h1
          style={{
            fontFamily: SERIF,
            fontSize: 'clamp(30px, 5.5vw, 62px)',
            lineHeight: 1.2,
            color: '#e6e6e6',
            fontWeight: 600,
            letterSpacing: '0.02em',
            marginBottom: 28,
          }}
        >
          把人脉经营成
          <br />
          <span style={{ color: '#777777', fontWeight: 300 }}>可复利的资产</span>
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontFamily: SERIF,
            fontSize: 'clamp(13px, 1.6vw, 16px)',
            lineHeight: 2.2,
            color: '#3e3e3e',
            fontWeight: 300,
            letterSpacing: '0.08em',
            maxWidth: 520,
            margin: '0 auto 44px',
          }}
        >
          三层引擎：标签识别 → 能量追踪 → 航程规划
          <br />
          让「认识谁、先找谁、怎么聊」变成可执行的日常流程。
        </p>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/login"
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#080808',
              background: '#d4d4d4',
              padding: '13px 30px',
              textDecoration: 'none',
              fontWeight: 700,
              transition: 'background 0.2s',
            }}
          >
            开始使用 →
          </Link>
          <Link
            href="/product"
            style={{
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#444',
              background: 'transparent',
              padding: '13px 30px',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.08)',
              transition: 'color 0.2s, border-color 0.2s',
            }}
          >
            查看产品
          </Link>
        </div>

        {/* Scroll hint */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: 48 }}
        >
          <div
            style={{
              width: 1,
              height: 52,
              background: 'linear-gradient(to bottom, transparent, #2a2a2a)',
              margin: '0 auto 10px',
            }}
          />
          <span
            style={{
              fontFamily: MONO,
              fontSize: 9,
              letterSpacing: '0.28em',
              color: '#282828',
              textTransform: 'uppercase',
            }}
          >
            SCROLL
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
      `}</style>
    </section>
  )
}

// ── Feature section ───────────────────────────────────────────────────────────
interface Feature {
  index: string
  title: string
  desc: string
  tags: string[]
}

const FEATURES: Feature[] = [
  {
    index: '01',
    title: '标签系统 · 三层识别',
    desc: '气场动物 → 关系角色 → 行业快签，渐进式录入，30 秒完成初步建档。',
    tags: ['LION', 'GATEWAY', 'ADVISOR', 'BIG_INVESTOR'],
  },
  {
    index: '02',
    title: '能量追踪 · 冷热可视',
    desc: '随互动频率动态衰减或强化，关系温度一眼可见，维护节点不再遗漏。',
    tags: ['HOT', 'WARM', 'COLD', 'ENERGY_SCORE'],
  },
  {
    index: '03',
    title: '人脉航程 · AI 路径规划',
    desc: '输入目标，AI 从人脉宇宙中计算最优路径、备选路径与缺失节点提示。',
    tags: ['PRIMARY_PATH', 'ALTERNATIVE', 'MISSING_NODE'],
  },
]

function Features() {
  return (
    <section style={{ background: '#040404', padding: '120px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px' }}>
        {/* Section label */}
        <p
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.3em',
            color: '#2a2a2a',
            textTransform: 'uppercase',
            marginBottom: 64,
          }}
        >
          CORE · FEATURES
        </p>

        <div className="grid md:grid-cols-3 gap-0" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
          {FEATURES.map((f) => (
            <div
              key={f.index}
              style={{
                borderRight: '1px solid rgba(255,255,255,0.06)',
                padding: '40px 36px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  color: '#222',
                  display: 'block',
                  marginBottom: 28,
                }}
              >
                /{f.index}
              </span>
              <h3
                style={{
                  fontFamily: SERIF,
                  fontSize: 16,
                  color: '#b8b8b8',
                  fontWeight: 500,
                  lineHeight: 1.5,
                  marginBottom: 16,
                  letterSpacing: '0.04em',
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontFamily: SERIF,
                  fontSize: 13,
                  color: '#3c3c3c',
                  lineHeight: 2.1,
                  marginBottom: 28,
                  fontWeight: 300,
                }}
              >
                {f.desc}
              </p>
              <div className="flex flex-wrap gap-2">
                {f.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontFamily: MONO,
                      fontSize: 9,
                      letterSpacing: '0.15em',
                      color: '#303030',
                      border: '1px solid #1a1a1a',
                      padding: '3px 8px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Mini universe demo banner ─────────────────────────────────────────────────
function UniverseDemo() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: '#030303', height: 360, borderTop: '1px solid rgba(255,255,255,0.04)' }}
    >
      <AsciiUniverseCanvas />
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{
          background: 'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(3,3,3,0) 0%, rgba(3,3,3,0.92) 100%)',
        }}
      >
        <p
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.3em',
            color: '#2a2a2a',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          NETWORK · UNIVERSE
        </p>
        <p
          style={{
            fontFamily: SERIF,
            fontSize: 'clamp(18px, 3vw, 32px)',
            color: '#5e5e5e',
            fontWeight: 300,
            letterSpacing: '0.06em',
            textAlign: 'center',
          }}
        >
          每一个节点，都是一段可能性
        </p>
      </div>
    </section>
  )
}

// ── Why section ───────────────────────────────────────────────────────────────
const WHY = [
  { label: '低阻力录入', detail: '先简后全，首次 30 秒完成，完整模式不逃课' },
  { label: '关系可衰减', detail: '能量值随时间动态变化，提醒你哪段关系需要维护' },
  { label: '航程可解释', detail: 'AI 给出路径的同时说明理由，不是黑箱，是顾问' },
  { label: '界面耐久看', detail: '极简信息密度，支持每日打开，不制造视觉疲劳' },
]

function WhySection() {
  return (
    <section style={{ background: '#050505', padding: '120px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px' }}>
        <p
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.3em',
            color: '#2a2a2a',
            textTransform: 'uppercase',
            marginBottom: 56,
          }}
        >
          WHY · PEOPLEMINE
        </p>
        <div className="grid md:grid-cols-2 gap-px" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {WHY.map((item) => (
            <div
              key={item.label}
              style={{
                background: '#050505',
                padding: '40px 36px',
              }}
            >
              <div className="flex items-start gap-4">
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    color: '#222',
                    marginTop: 4,
                    flexShrink: 0,
                    letterSpacing: '0.1em',
                  }}
                >
                  ○
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: SERIF,
                      fontSize: 15,
                      color: '#a8a8a8',
                      fontWeight: 500,
                      letterSpacing: '0.06em',
                      marginBottom: 10,
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontFamily: SERIF,
                      fontSize: 13,
                      color: '#383838',
                      lineHeight: 2.1,
                      fontWeight: 300,
                    }}
                  >
                    {item.detail}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CTA Banner ────────────────────────────────────────────────────────────────
function CtaBanner() {
  return (
    <section
      style={{
        background: '#060606',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '96px 48px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: '0.3em',
          color: '#222',
          textTransform: 'uppercase',
          marginBottom: 28,
        }}
      >
        GET · STARTED
      </p>
      <h2
        style={{
          fontFamily: SERIF,
          fontSize: 'clamp(22px, 3.5vw, 42px)',
          color: '#b8b8b8',
          fontWeight: 500,
          lineHeight: 1.4,
          letterSpacing: '0.04em',
          maxWidth: 600,
          margin: '0 auto 40px',
        }}
      >
        你的人脉网络，
        <br />
        <span style={{ color: '#383838', fontWeight: 300 }}>正在等你建图。</span>
      </h2>
      <Link
        href="/login"
        style={{
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#080808',
          background: '#c4c4c4',
          padding: '14px 36px',
          textDecoration: 'none',
          fontWeight: 700,
          display: 'inline-block',
        }}
      >
        免费开始使用 →
      </Link>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: '#030303', padding: '60px 48px 40px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="flex flex-col md:flex-row justify-between gap-10" style={{ marginBottom: 48 }}>
          <div>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 12,
                letterSpacing: '0.28em',
                color: '#333',
                display: 'block',
                marginBottom: 12,
                textTransform: 'uppercase',
              }}
            >
              PEOPLEMINE
            </span>
            <p
              style={{
                fontFamily: MONO,
                fontSize: 11,
                color: '#222',
                lineHeight: 1.8,
                letterSpacing: '0.06em',
              }}
            >
              Your Asset, Your Mine.
            </p>
          </div>

          <div className="flex gap-16">
            {[
              ['产品', '功能总览', '标签系统', '人脉航程'],
              ['公司', '关于我们', '更新日志', '联系我们'],
            ].map(([title, ...items]) => (
              <div key={title}>
                <p
                  style={{
                    fontFamily: MONO,
                    fontSize: 9,
                    letterSpacing: '0.28em',
                    color: '#222',
                    textTransform: 'uppercase',
                    marginBottom: 16,
                  }}
                >
                  {title}
                </p>
                {items.map((item) => (
                  <a
                    key={item}
                    href="#"
                    style={{
                      fontFamily: SERIF,
                      fontSize: 12,
                      color: '#2e2e2e',
                      display: 'block',
                      marginBottom: 10,
                      textDecoration: 'none',
                      fontWeight: 300,
                    }}
                  >
                    {item}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.03)',
            paddingTop: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: '#1e1e1e',
              letterSpacing: '0.12em',
            }}
          >
            © 2025 PEOPLEMINE
          </span>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 9,
              color: '#1a1a1a',
              letterSpacing: '0.2em',
            }}
          >
            v0.4 · DEMO
          </span>
        </div>
      </div>
    </footer>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ background: '#030303', minHeight: '100vh', color: '#e0e0e0' }}>
      <LandingNav />
      <Hero />
      <Features />
      <UniverseDemo />
      <WhySection />
      <CtaBanner />
      <Footer />
    </div>
  )
}
