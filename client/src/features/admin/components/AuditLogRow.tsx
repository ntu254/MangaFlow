import { cn } from '@/shared/lib/utils'

export interface AuditLogItem {
  id: string
  actor: string
  action: string
  target: string
  timestamp: string
  severity: 'info' | 'warning' | 'danger' | 'success'
}

export function AuditLogRow({ item, className }: { item: AuditLogItem, className?: string }) {
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'info': return 'text-blue-500 bg-blue-500/10'
      case 'warning': return 'text-amber-500 bg-amber-500/10'
      case 'danger': return 'text-red-500 bg-red-500/10'
      case 'success': return 'text-emerald-500 bg-emerald-500/10'
      default: return 'text-slate-500 bg-slate-500/10'
    }
  }

  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-border/50 hover:bg-muted/30 transition-colors gap-4", className)}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{item.actor}</span>
          <span className="text-muted-foreground text-sm">{item.action}</span>
          <span className="font-medium text-sm text-foreground">{item.target}</span>
        </div>
        <span className="text-xs text-muted-foreground">{item.timestamp}</span>
      </div>
      <div className="shrink-0">
        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium inline-block", getSeverityStyle(item.severity))}>
          {item.severity.toUpperCase()}
        </span>
      </div>
    </div>
  )
}
