import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[-0.02em] font-sans [font-feature-settings:'cv01'_1,'ss03'_1] transition-colors",
  {
    variants: {
      variant: {
        default: "border-line-subtle bg-[rgba(255,255,255,0.03)] text-text-secondary",
        secondary: "border-line-standard bg-app-strong text-text-primary",
        outline: "border-line-standard bg-transparent text-text-secondary",
        accent: "border-brand/40 bg-brand/15 text-brand-hover",
        success: "border-gray-500/20 bg-gray-500/15 text-gray-300",
        blue: "border-brand/40 bg-brand/15 text-brand-hover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
