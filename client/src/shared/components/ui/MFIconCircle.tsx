import { type HTMLAttributes, forwardRef } from "react"
import { cn } from "@/shared/lib/utils"

type IconCircleSize = "sm" | "md" | "lg"
type IconCircleVariant = "primary" | "secondary" | "tertiary" | "surface"

interface MFIconCircleProps extends HTMLAttributes<HTMLDivElement> {
  size?: IconCircleSize
  variant?: IconCircleVariant
}

const sizeStyles: Record<IconCircleSize, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
}

const variantStyles: Record<IconCircleVariant, string> = {
  primary: "bg-primary-container text-primary-deep",
  secondary: "bg-secondary-container text-secondary-deep",
  tertiary: "bg-tertiary-container text-tertiary-deep",
  surface: "bg-surface-low text-on-surface-muted",
}

export const MFIconCircle = forwardRef<HTMLDivElement, MFIconCircleProps>(
  ({ className, size = "md", variant = "primary", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          sizeStyles[size],
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)

MFIconCircle.displayName = "MFIconCircle"
