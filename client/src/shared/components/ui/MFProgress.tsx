import { type HTMLAttributes, forwardRef } from "react"
import { cn } from "@/shared/lib/utils"
import { type StatusTone } from "@/shared/lib/status-ui"

interface MFProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  size?: "sm" | "md" | "lg"
  tone?: StatusTone
}

const toneBarStyles: Record<StatusTone, string> = {
  neutral: "bg-outline-variant",
  primary: "bg-primary",
  secondary: "bg-secondary",
  success: "bg-tertiary",
  warning: "bg-yellow",
  danger: "bg-error",
}

const sizeStyles = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-4",
}

export const MFProgress = forwardRef<HTMLDivElement, MFProgressProps>(
  ({ className, value = 0, max = 100, label, showValue = false, size = "md", tone = "primary", ...props }, ref) => {
    const percentage = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {(label || showValue) && (
          <div className="mb-sm flex items-center justify-between">
            {label && <span className="text-label-sm text-on-surface-muted">{label}</span>}
            {showValue && <span className="text-label-sm text-on-surface-muted">{percentage}%</span>}
          </div>
        )}
        <div className={cn("w-full overflow-hidden rounded-full bg-surface-container", sizeStyles[size])}>
          <div
            className={cn(
              "rounded-full transition-all duration-300",
              toneBarStyles[tone],
              sizeStyles[size],
            )}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label={label ?? `Progress: ${percentage}%`}
          />
        </div>
      </div>
    )
  },
)

MFProgress.displayName = "MFProgress"
