import { type HTMLAttributes, forwardRef } from "react"
import { cn } from "@/shared/lib/utils"

interface MFCardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg"
}

const paddingStyles = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
}

export const MFCard = forwardRef<HTMLDivElement, MFCardProps>(
  ({ className, padding = "md", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-3xl bg-surface-lowest shadow-card",
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
    <div className={cn("mb-4 flex items-center justify-between", className)} {...props}>
      {children}
    </div>
  )
}

export function MFCardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-4 flex items-center justify-between border-t border-outline-variant pt-4", className)} {...props}>
      {children}
    </div>
  )
}
