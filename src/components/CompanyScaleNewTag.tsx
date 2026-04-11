import { cn } from '@/lib/utils'
import { COMPANY_SCALE_NEW_LABELS, type CompanyScaleNew } from '@/types'

const SCALE_STYLES: Record<CompanyScaleNew, string> = {
  MILLION: 'border-gray-200 bg-gray-50 text-gray-600',
  TEN_MILLION: 'border-gray-200 bg-gray-50 text-gray-700',
  HUNDRED_MILLION: 'border-gray-200 bg-gray-50 text-gray-700',
  BILLION: 'border-gray-200 bg-gray-50 text-gray-700',
  TEN_BILLION: 'border-gray-200 bg-gray-50 text-gray-700',
}

export default function CompanyScaleNewTag({
  scale,
  className,
}: {
  scale: CompanyScaleNew | null | undefined
  className?: string
}) {
  if (!scale) return null
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
        SCALE_STYLES[scale],
        className,
      )}
    >
      {COMPANY_SCALE_NEW_LABELS[scale]}
    </span>
  )
}
