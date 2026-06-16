import * as React from "react"
import { cn } from "@/shared/lib/utils"

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  eyebrow?: string
  breadcrumb?: React.ReactNode
  primaryAction?: React.ReactNode
  secondaryAction?: React.ReactNode
  metadata?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  eyebrow,
  breadcrumb,
  primaryAction,
  secondaryAction,
  metadata,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 mb-8", className)} {...props}>
      {breadcrumb && <div className="text-sm text-slate-500">{breadcrumb}</div>}
      
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          {eyebrow && <span className="text-sm font-semibold tracking-wide text-violet-600 uppercase">{eyebrow}</span>}
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
            {metadata && <div>{metadata}</div>}
          </div>
          {description && <p className="text-slate-500 max-w-2xl text-[15px]">{description}</p>}
        </div>

        {(primaryAction || secondaryAction) && (
          <div className="flex items-center gap-3 shrink-0">
            {secondaryAction}
            {primaryAction}
          </div>
        )}
      </div>
    </div>
  )
}
