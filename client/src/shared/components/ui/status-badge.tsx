import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"
import { type StatusUiConfig } from "@/shared/lib/status-ui"

const statusBadgeVariants = cva(
  "inline-flex items-center justify-center font-medium border transition-colors",
  {
    variants: {
      size: {
        sm: "h-6 px-2 text-xs rounded-md gap-1",
        md: "h-7 px-3 text-[13px] rounded-lg gap-1.5",
      },
      variant: {
        soft: "", // Colors are provided by config.className
        outline: "bg-transparent", 
        solid: "", 
      }
    },
    defaultVariants: {
      size: "md",
      variant: "soft",
    },
  }
)

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof statusBadgeVariants> {
  config: StatusUiConfig;
  showIcon?: boolean;
}

export function StatusBadge({
  config,
  showIcon = true,
  size,
  variant,
  className,
  ...props
}: StatusBadgeProps) {
  const Icon = config.icon
  return (
    <div
      className={cn(
        statusBadgeVariants({ size, variant }),
        config.className,
        className
      )}
      {...props}
    >
      {showIcon && <Icon className={cn("shrink-0", size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />}
      <span>{config.label}</span>
    </div>
  )
}
