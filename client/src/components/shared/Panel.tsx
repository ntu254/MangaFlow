import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PanelProps {
  eyebrow?: string
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  children: ReactNode
  className?: string
  padding?: "default" | "compact" | "none"
  /** Make the panel clickable / liftable on hover */
  interactive?: boolean
}

/**
 * Soft modern card panel — rounded-xl, soft shadow, slate border, white surface.
 */
export function Panel({
  eyebrow,
  title,
  description,
  action,
  icon,
  children,
  className,
  padding = "default",
  interactive,
}: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card shadow-soft",
        interactive && "surface-interactive cursor-pointer",
        className
      )}
    >
      {(eyebrow || title || action) && (
        <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border">
          <div className="min-w-0 flex items-start gap-3">
            {icon && (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {eyebrow && (
                <p className="text-[11px] font-medium uppercase tracking-wider text-primary">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h3 className="mt-0.5 text-base font-semibold leading-tight tracking-tight text-foreground">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div
        className={cn(
          padding === "default" && "p-5",
          padding === "compact" && "p-3",
          padding === "none" && "p-0"
        )}
      >
        {children}
      </div>
    </section>
  )
}
