import { cn } from '@/lib/utils'
import { VALUE_LEVEL_LABELS, type ValueLevel } from '@/types'

const VALUE_STYLES: Record<ValueLevel, string> = {
  LOW: 'border-gray-200 bg-gray-50 text-gray-600',
  MEDIUM: 'border-gray-200 bg-gray-50 text-gray-700',
  HIGH: 'border-gray-200 bg-gray-50 text-gray-700',
  EXTREME: 'border-gray-200 bg-gray-50 text-gray-700',
}

export default function ValueLevelBadge({
  level,
  className,
}: {
  level: ValueLevel | null | undefined
  className?: string
}) {
  if (!level) return null
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
        VALUE_STYLES[level],
        className,
      )}
    >
      {VALUE_LEVEL_LABELS[level]}
    </span>
  )
}
