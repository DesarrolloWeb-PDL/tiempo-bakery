import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-gold text-white hover:bg-brand-gold-dark",
        secondary:
          "border-transparent hover:opacity-80",
        destructive:
          "border-transparent bg-red-500 text-white hover:bg-red-600",
        outline: "",
        success:
          "border-transparent bg-green-100 text-green-800",
        warning:
          "border-transparent bg-yellow-100 text-yellow-800",
        info:
          "border-transparent bg-blue-100 text-blue-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  const style: React.CSSProperties = {}
  if (variant === 'secondary') {
    style.backgroundColor = 'var(--brand-muted-bg)'
    style.color = 'var(--brand-text-muted)'
  } else if (variant === 'outline') {
    style.color = 'var(--brand-text-primary)'
    style.borderColor = 'var(--brand-border)'
  }
  return <div className={cn(badgeVariants({ variant }), className)} style={style} {...props} />
}

export { Badge, badgeVariants }
