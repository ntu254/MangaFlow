import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Soft status badges — bg-{color}-50, text-{color}-700, border-{color}-200.
 * Used for all status, role, priority indicators.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        // Neutral / default — slate
        default:
          "border-slate-200 bg-slate-50 text-slate-700",
        outline:
          "border-slate-200 bg-transparent text-slate-700",
        solid:
          "border-transparent bg-slate-900 text-white",
        // Brand
        violet:
          "border-violet-200 bg-violet-50 text-violet-700",
        // Semantic
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        warning:
          "border-amber-200 bg-amber-50 text-amber-700",
        destructive:
          "border-red-200 bg-red-50 text-red-700",
        info:
          "border-blue-200 bg-blue-50 text-blue-700",
        review:
          "border-purple-200 bg-purple-50 text-purple-700",
        board:
          "border-orange-200 bg-orange-50 text-orange-700",
        ai:
          "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
        task:
          "border-blue-200 bg-blue-50 text-blue-700",
        // Aliases used by older code
        secondary:
          "border-slate-200 bg-slate-50 text-slate-700",
        soft:
          "border-violet-200 bg-violet-50 text-violet-700",
        accent:
          "border-violet-200 bg-violet-50 text-violet-700",
        draft:
          "border-slate-200 bg-slate-50 text-slate-500",
      },
      size: {
        default: "h-6",
        sm: "h-5 px-1.5 text-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
