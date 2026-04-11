import type { CSSProperties, ReactNode } from 'react'
import PageHeader, { type BreadcrumbItem } from '@/components/PageHeader'

type PageShellProps = {
  items: BreadcrumbItem[]
  title: string
  titleNote?: ReactNode
  summary?: ReactNode
  hints: string[]
  actions?: ReactNode
  children: ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
  style?: CSSProperties
}

export default function PageShell({
  items,
  title,
  titleNote,
  summary,
  hints,
  actions,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
  style,
}: PageShellProps) {
  const resolvedTitleNote =
    titleNote ??
    (summary ? <span className="text-sm italic text-gray-500">{summary}</span> : undefined)

  return (
    <div className={`min-h-full bg-[#f6f6f4] ${className}`.trim()} style={style}>
      <div className="flex min-h-screen w-full min-w-0 flex-col px-6 py-4 lg:px-8">
        <PageHeader
          items={items}
          title={title}
          titleNote={resolvedTitleNote}
          summary={titleNote ? summary : undefined}
          hints={hints}
          actions={actions}
          className={`pb-4 lg:pb-5 ${headerClassName}`.trim()}
        />
        <div className={`mt-1 flex min-h-0 flex-1 flex-col ${contentClassName}`.trim()}>{children}</div>
      </div>
    </div>
  )
}
