import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[108px] w-full rounded-[10px] border border-line-standard bg-[rgba(255,255,255,0.02)] px-3.5 py-2.5 text-[15px] text-text-primary shadow-surface outline-none font-sans [font-feature-settings:'cv01'_1,'ss03'_1] placeholder:text-text-muted focus-visible:border-brand-bright focus-visible:ring-[3px] focus-visible:ring-ring/70 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
