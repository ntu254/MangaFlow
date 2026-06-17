import { Card } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'

export interface ConfigCardProps {
  title: string
  description: string
  status: 'active' | 'inactive' | 'draft' | 'archived'
  lastUpdated?: string
  onPrimaryAction?: () => void
  primaryActionLabel?: string
  onSecondaryAction?: () => void
  secondaryActionLabel?: string
}

export function ConfigCard({
  title,
  description,
  status,
  lastUpdated,
  onPrimaryAction,
  primaryActionLabel = 'Edit',
  onSecondaryAction,
  secondaryActionLabel = 'Settings'
}: ConfigCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-transparent'
      case 'inactive': return 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 border-transparent'
      case 'draft': return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-transparent'
      case 'archived': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-transparent'
      default: return 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 border-transparent'
    }
  }

  return (
    <Card className="p-5 flex flex-col h-full hover:border-primary/30 transition-colors shadow-none">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h3 className="font-semibold text-base">{title}</h3>
          {lastUpdated && <p className="text-xs text-muted-foreground mt-1">Updated: {lastUpdated}</p>}
        </div>
        <Badge variant="outline" className={getStatusColor(status)}>
          {status.toUpperCase()}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-6 flex-1 leading-relaxed">{description}</p>
      <div className="flex items-center gap-2 mt-auto">
        {onPrimaryAction && (
          <Button size="sm" onClick={onPrimaryAction} className="flex-1">
            {primaryActionLabel}
          </Button>
        )}
        {onSecondaryAction && (
          <Button size="sm" variant="outline" onClick={onSecondaryAction} className="flex-1">
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </Card>
  )
}
