import { type HTMLAttributes, forwardRef, type ReactNode } from "react"
import { cn } from "@/shared/lib/utils"

interface MFSectionProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  actions?: ReactNode
}

export const MFSection = forwardRef<HTMLDivElement, MFSectionProps>(
  ({ className, title, description, actions, children, ...props }, ref) => {
    return (
      <section ref={ref} className={cn(className)} {...props}>
        <div className="mb-md flex items-start justify-between gap-md">
          <div>
            <h2 className="text-title-lg text-on-surface">{title}</h2>
            {description && <p className="mt-sm text-body-md text-on-surface-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-sm">{actions}</div>}
        </div>
        {children}
      </section>
    )
  },
)

MFSection.displayName = "MFSection"
