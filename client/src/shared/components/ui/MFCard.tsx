import { type HTMLAttributes, forwardRef } from "react"
import { cn } from "@/shared/lib/utils"

interface MFCardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg"
}

const paddingStyles = {
  sm: "p-md",
  md: "p-lg",
  lg: "p-xl",
}

export const MFCard = forwardRef<HTMLDivElement, MFCardProps>(
  ({ className, padding = "md", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border border-outline-variant/30 bg-surface-lowest shadow-ambient",
          paddingStyles[padding],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)

MFCard.displayName = "MFCard"

export function MFCardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-md flex items-center justify-between", className)} {...props}>
      {children}
    </div>
  )
}

export function MFCardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-md flex items-center justify-between border-t border-outline-variant/20 pt-md", className)} {...props}>
      {children}
    </div>
  )
}
