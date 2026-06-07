import { forwardRef, type ButtonHTMLAttributes } from "react"
import { cn } from "@/shared/lib/utils"

type MFIconButtonVariant = "ghost" | "surface"

interface MFIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: MFIconButtonVariant
}

const variantStyles: Record<MFIconButtonVariant, string> = {
  ghost: "bg-transparent text-on-surface-variant hover:bg-primary-fixed/50",
  surface: "bg-surface-lowest text-on-surface-variant shadow-sm hover:bg-surface-container-high",
}

export const MFIconButton = forwardRef<HTMLButtonElement, MFIconButtonProps>(
  ({ className, variant = "ghost", type = "button", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
          "transition-colors focus-visible:outline-none focus-visible:shadow-focus",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)

MFIconButton.displayName = "MFIconButton"
