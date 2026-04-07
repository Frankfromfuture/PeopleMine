'use client'

import Link from 'next/link'

export default function LandingNav() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(7,7,7,0.82)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <span
        style={{
          fontFamily: '"Courier New", monospace',
          fontSize: 13,
          letterSpacing: '0.28em',
          color: '#d0d0d0',
          fontWeight: 600,
          textTransform: 'uppercase',
        }}
      >
        PEOPLEMINE
      </span>

      <nav className="hidden md:flex items-center gap-8">
        {['产品', '解决方案', '定价'].map((label) => (
          <a
            key={label}
            href="#"
            className="landing-nav-link"
            style={{
              fontFamily: '"Courier New", monospace',
              fontSize: 11,
              letterSpacing: '0.16em',
              color: '#555',
              textDecoration: 'none',
              transition: 'color 0.2s',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </a>
        ))}
      </nav>

      <Link
        href="/login"
        style={{
          fontFamily: '"Courier New", monospace',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#0a0a0a',
          background: '#d8d8d8',
          padding: '7px 18px',
          textDecoration: 'none',
          fontWeight: 700,
        }}
      >
        进入
      </Link>

      <style>{`
        .landing-nav-link:hover { color: #aaa !important; }
      `}</style>
    </header>
  )
}
