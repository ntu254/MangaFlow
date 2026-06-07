import { type HTMLAttributes, forwardRef } from "react"
import { cn } from "@/shared/lib/utils"

type IconCircleSize = "sm" | "md" | "lg"
type IconCircleVariant = "primary" | "secondary" | "tertiary" | "surface"

interface MFIconCircleProps extends HTMLAttributes<HTMLDivElement> {
  size?: IconCircleSize
  variant?: IconCircleVariant
}

const sizeStyles: Record<IconCircleSize, string> = {
  sm: "h-lg w-lg",
  md: "h-xl w-xl",
  lg: "h-14 w-14",
}

const variantStyles: Record<IconCircleVariant, string> = {
  primary: "bg-primary-fixed text-on-primary-fixed",
  secondary: "bg-secondary-fixed text-on-secondary-fixed",
  tertiary: "bg-tertiary-fixed text-on-tertiary-fixed",
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
