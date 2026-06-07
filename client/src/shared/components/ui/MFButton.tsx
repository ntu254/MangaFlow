import { type ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "@/shared/lib/utils"

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger"
type ButtonSize = "sm" | "md" | "lg"

interface MFButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-deep focus-visible:shadow-focus disabled:bg-surface-high disabled:text-on-surface-muted",
  secondary:
    "bg-secondary text-white hover:bg-secondary-deep focus-visible:shadow-focus disabled:bg-surface-high disabled:text-on-surface-muted",
  outline:
    "border-2 border-outline-variant bg-white text-on-surface hover:bg-surface-low focus-visible:shadow-focus disabled:border-surface-high disabled:text-on-surface-muted",
  ghost:
    "bg-transparent text-on-surface hover:bg-surface-low focus-visible:shadow-focus disabled:text-on-surface-muted",
  danger:
    "bg-error text-white hover:bg-red-700 focus-visible:shadow-[0_0_0_4px_rgba(186,26,26,0.16)] disabled:bg-surface-high disabled:text-on-surface-muted",
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-1.5 text-label-sm",
  md: "px-6 py-2.5 text-label-md",
  lg: "px-8 py-3 text-label-md",
}

export const MFButton = forwardRef<HTMLButtonElement, MFButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150",
          "focus-visible:outline-none",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  },
)

MFButton.displayName = "MFButton"
