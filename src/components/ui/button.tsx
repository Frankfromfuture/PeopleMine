"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[10px] border text-sm font-medium outline-none ring-offset-0 transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 data-[slot=button]:font-sans [font-feature-settings:'cv01'_1,'ss03'_1] focus-visible:ring-[3px] focus-visible:ring-ring/70 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-brand bg-brand text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)] hover:border-brand-hover hover:bg-brand-hover",
        secondary:
          "border-line-standard bg-app-strong text-text-primary hover:bg-[rgba(255,255,255,0.08)]",
        outline:
          "border-line-standard bg-transparent text-text-secondary hover:border-line-strong hover:bg-app-surface hover:text-text-primary",
        ghost:
          "border-transparent bg-transparent text-text-secondary shadow-none hover:bg-app-surface hover:text-text-primary",
        subtle:
          "border-line-subtle bg-[rgba(255,255,255,0.02)] text-text-secondary hover:border-line-standard hover:bg-app-strong hover:text-text-primary",
        destructive:
          "border-transparent bg-danger/90 text-white hover:bg-danger",
        link: "border-transparent bg-transparent px-0 text-text-secondary shadow-none hover:text-brand-bright hover:underline",
      },
      size: {
        default: "h-9 gap-2 px-4",
        xs: "h-7 gap-1.5 rounded-[8px] px-2.5 text-xs",
        sm: "h-8 gap-1.5 px-3 text-[13px]",
        lg: "h-10 gap-2 px-5 text-[15px]",
        icon: "size-9",
        "icon-xs": "size-7 rounded-[8px] [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-10 rounded-[12px] [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "secondary",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
