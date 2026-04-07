import { cn } from '@/lib/utils'
import { ROLE_ARCHETYPE_LABELS, type RoleArchetype } from '@/types'
import { Rocket, Megaphone, Search, Link2, UserRound } from 'lucide-react'

export const ARCHETYPE_STYLES: Record<RoleArchetype, string> = {
  BREAKER: 'border-gray-200 bg-gray-50 text-gray-800',
  EVANGELIST: 'border-gray-200 bg-gray-50 text-gray-800',
  ANALYST: 'border-gray-200 bg-gray-50 text-gray-800',
  BINDER: 'border-gray-200 bg-gray-50 text-gray-800',
}

export const ARCHETYPE_DOT_COLORS: Record<RoleArchetype, string> = {
  BREAKER: 'bg-gray-400',
  EVANGELIST: 'bg-gray-400',
  ANALYST: 'bg-gray-400',
  BINDER: 'bg-gray-400',
}

const ARCHETYPE_ICONS = {
  BREAKER: Rocket,
  EVANGELIST: Megaphone,
  ANALYST: Search,
  BINDER: Link2,
} satisfies Record<RoleArchetype, typeof UserRound>

export default function RoleArchetypeTag({
  role,
  className,
  showIcon = true,
}: {
  role: RoleArchetype
  className?: string
  showIcon?: boolean
}) {
  const Icon = ARCHETYPE_ICONS[role] ?? UserRound
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[-0.02em]',
        ARCHETYPE_STYLES[role],
        className,
      )}
    >
      {showIcon ? <Icon className="h-3.5 w-3.5" strokeWidth={2} /> : null}
      {ROLE_ARCHETYPE_LABELS[role].name}
    </span>
  )
}
