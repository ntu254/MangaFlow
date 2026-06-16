import * as React from "react"
import { cn } from "@/shared/lib/utils"
import { type LucideIcon } from "lucide-react"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  primaryAction?: React.ReactNode
  secondaryAction?: React.ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-center p-12 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-100 mb-5 text-slate-400">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-2 max-w-sm">{description}</p>}
      
      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-3 mt-6">
          {secondaryAction}
          {primaryAction}
        </div>
      )}
    </div>
  )
}
