import { cn } from '@/lib/utils'
import { SPIRIT_ANIMAL_NEW_LABELS, type SpiritAnimalNew } from '@/types'

export default function SpiritAnimalNewBadge({
  animal,
  className,
  energy = 100,
}: {
  animal: SpiritAnimalNew | null | undefined
  className?: string
  energy?: number
}) {
  if (!animal) {
    return <span className={cn('inline-flex rounded-full border border-line-subtle bg-white/70 px-2.5 py-1 text-[11px] text-text-muted', className)}>未设气场动物</span>
  }

  const info = SPIRIT_ANIMAL_NEW_LABELS[animal]
  const opacity = Math.max(0.55, Math.min(1, energy / 100))
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full border border-line-standard bg-white/90 px-2.5 py-1 text-[11px] font-medium text-text-secondary shadow-surface', className)}
      style={{ opacity }}
    >
      <span>{info.emoji}</span>
      <span>{info.name}</span>
    </span>
  )
}
