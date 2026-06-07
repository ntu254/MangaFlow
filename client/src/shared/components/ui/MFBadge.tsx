import { type HTMLAttributes, forwardRef } from "react"
import { cn } from "@/shared/lib/utils"
import { type StatusTone } from "@/shared/lib/status-ui"

interface MFBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone
  size?: "sm" | "md"
}

const toneStyles: Record<StatusTone, string> = {
  neutral: "bg-surface-container text-on-surface-muted",
  primary: "bg-primary-fixed text-on-primary-fixed",
  secondary: "bg-secondary-fixed text-on-secondary-fixed",
  success: "bg-tertiary-fixed text-on-tertiary-fixed",
  warning: "bg-yellow/40 text-[#6b4f00]",
  danger: "bg-error-container text-on-error-container",
}

const sizeStyles = {
  sm: "px-md py-xs text-label-sm",
  md: "px-lg py-sm text-label-md",
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
