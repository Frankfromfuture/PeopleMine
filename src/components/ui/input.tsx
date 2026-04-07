import * as React from "react"

import { cn } from "@/lib/utils"

const inputBase =
  "flex h-10 w-full rounded-[10px] border border-line-standard bg-[rgba(255,255,255,0.02)] px-3.5 py-2 text-[15px] text-text-primary shadow-surface outline-none font-sans [font-feature-settings:'cv01'_1,'ss03'_1] placeholder:text-text-muted focus-visible:border-brand-bright focus-visible:ring-[3px] focus-visible:ring-ring/70 disabled:cursor-not-allowed disabled:opacity-50"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return <input type={type} className={cn(inputBase, className)} ref={ref} {...props} />
})
Input.displayName = "Input"

export { Input }
