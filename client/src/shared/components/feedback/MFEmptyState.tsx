import type { ReactNode } from "react"
import { MFIconCircle } from "@/shared/components/ui/MFIconCircle"

interface MFEmptyStateProps {
  title: string
  description: string
  icon?: string
  action?: ReactNode
}

export function MFEmptyState({
  title,
  description,
  icon = "inbox",
  action,
}: MFEmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl bg-surface-low p-xl text-center">
      <MFIconCircle variant="surface" size="lg">
        <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
          {icon}
        </span>
      </MFIconCircle>
      <h3 className="mt-md text-title-lg text-on-surface">{title}</h3>
      <p className="mt-sm max-w-md text-body-md text-on-surface-muted">{description}</p>
      {action ? <div className="mt-lg">{action}</div> : null}
    </div>
  )
}
