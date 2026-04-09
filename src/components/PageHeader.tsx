import type { ReactNode } from 'react'
import Link from 'next/link'

export type BreadcrumbItem = {
  label: string
  href?: string
}

export type PageHeaderProps = {
  items: BreadcrumbItem[]
  title: string
  titleNote?: ReactNode
  summary?: ReactNode
  hints: string[]
  actions?: ReactNode
  className?: string
}

function HintBadge({ items }: { items: string[] }) {
  return (
    <div className="group relative shrink-0">
      <button
        type="button"
        aria-label="浏览提示"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-gray-400 hover:text-gray-800 focus:border-gray-400 focus:text-gray-800 focus:outline-none"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <circle cx="7.5" cy="7.5" r="6.2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M7.5 6.3V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="7.5" cy="4.4" r="0.7" fill="currentColor" />
        </svg>
      </button>
      <div className="pointer-events-none absolute right-0 top-11 z-30 w-72 rounded-2xl border border-gray-200 bg-white p-4 text-left opacity-0 shadow-xl shadow-gray-200/70 transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        <p className="text-xs font-semibold text-gray-900">浏览提示</p>
        <div className="mt-3 space-y-2 text-xs leading-5 text-gray-500">
          {items.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PageHeader({
  items,
  title,
  titleNote,
  summary,
  hints,
  actions,
  className = '',
}: PageHeaderProps) {
  const resolvedTitleNote =
    titleNote ??
    (summary ? <span className="text-sm italic text-gray-500">{summary}</span> : undefined)
  const resolvedSummary = undefined

  return (
    <div className={`flex items-start justify-between gap-4 ${className}`.trim()}>
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-gray-400">
          {items.map((item, index) => (
            <span key={`${item.label}-${index}`}>
              {item.href ? (
                <Link href={item.href} className="transition hover:text-gray-700">
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
              {index < items.length - 1 ? <span className="mx-1">/</span> : null}
            </span>
          ))}
        </div>
        <div className="mt-2.5">
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <h1 className="text-[32px] font-semibold tracking-tight text-gray-900">{title}</h1>
            {resolvedTitleNote ? <div className="pb-1">{resolvedTitleNote}</div> : null}
          </div>
          {resolvedSummary ? <p className="mt-1.5 max-w-3xl text-sm leading-6 text-gray-500">{resolvedSummary}</p> : null}
        </div>
        {actions ? <div className="mt-4 flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
      <HintBadge items={hints} />
    </div>
  )
}
