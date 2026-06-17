import * as React from 'react'
import { cn } from '@/shared/lib/utils'
import { AlertTriangle } from 'lucide-react'
import { Button } from './button'

export interface DangerZoneProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}

export function DangerZone({
  title,
  description,
  actionLabel,
  onAction,
  className,
  ...props
}: DangerZoneProps) {
  return (
    <div className={cn("border border-destructive/20 bg-destructive/5 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4", className)} {...props}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-destructive/10 p-2 shrink-0">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
      <Button variant="destructive" onClick={onAction} className="shrink-0">
        {actionLabel}
      </Button>
    </div>
  )
}
