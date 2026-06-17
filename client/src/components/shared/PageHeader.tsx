import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface PageHeaderProps {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
  align?: "default" | "split"
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  align = "split",
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-5 mb-2",
        align === "split" ? "lg:flex-row lg:items-start lg:justify-between lg:gap-6" : "",
        className
      )}
      data-testid="page-header"
    >
      <div className="min-w-0 max-w-3xl">
        {eyebrow && (
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
        )}
        <h1
          className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-[32px]"
          data-testid="page-header-title"
        >
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div
          className="flex flex-wrap items-center gap-2 shrink-0"
          data-testid="page-header-actions"
        >
          {actions}
        </div>
      )}
    </section>
  )
}

interface SectionHeaderProps {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4 mb-4", className)}>
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
        )}
        <h2 className="text-lg font-semibold leading-tight tracking-tight text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
