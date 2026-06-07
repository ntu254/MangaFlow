import { type HTMLAttributes, forwardRef } from "react"
import { cn } from "@/shared/lib/utils"
import { type StatusTone } from "@/shared/lib/status-ui"

interface MFBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone
  size?: "sm" | "md"
}

const toneStyles: Record<StatusTone, string> = {
  neutral: "bg-surface-container text-on-surface-muted",
  primary: "bg-primary-container text-primary-deep",
  secondary: "bg-secondary-container text-secondary-deep",
  success: "bg-tertiary-container text-tertiary-deep",
  warning: "bg-yellow/30 text-[#8b6f00]",
  danger: "bg-error-container text-error",
}

const sizeStyles = {
  sm: "px-2 py-0.5 text-label-sm",
  md: "px-3 py-1 text-label-md",
}

export const MFBadge = forwardRef<HTMLSpanElement, MFBadgeProps>(
  ({ className, tone = "neutral", size = "sm", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full font-semibold",
          toneStyles[tone],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {children}
      </span>
    )
  },
)

MFBadge.displayName = "MFBadge"
