import { type ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "@/shared/lib/utils"

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger"
type ButtonSize = "sm" | "md" | "lg"

interface MFButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantColor: Record<ButtonVariant, string> = {
  primary: "#ffffff",
  secondary: "#ffffff",
  outline: "#4a4452",
  ghost: "#4a4452",
  danger: "#ffffff",
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary hover:bg-primary-container active:scale-95 transition-all disabled:bg-surface-container-high disabled:text-on-surface-muted",
  secondary:
    "bg-secondary hover:bg-secondary-container active:scale-95 transition-all disabled:bg-surface-container-high disabled:text-on-surface-muted",
  outline:
    "border border-outline-variant/30 bg-surface-lowest hover:bg-surface-container-high active:scale-95 transition-all disabled:border-surface-container-high disabled:text-on-surface-muted",
  ghost:
    "bg-transparent hover:text-primary active:scale-95 transition-all disabled:text-on-surface-muted",
  danger:
    "bg-error hover:bg-error-container active:scale-95 transition-all disabled:bg-surface-container-high disabled:text-on-surface-muted",
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-lg py-sm text-label-md",
  md: "px-xl py-md text-label-md",
  lg: "px-xxl py-md text-label-md font-bold",
}

export const MFButton = forwardRef<HTMLButtonElement, MFButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-sm rounded-full font-semibold shadow-sm",
          "focus-visible:outline-none",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        style={{ color: variantColor[variant] }}
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
