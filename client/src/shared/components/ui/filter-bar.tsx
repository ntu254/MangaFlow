import * as React from 'react'
import { cn } from '@/shared/lib/utils'
import { Search } from 'lucide-react'

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  children?: React.ReactNode // For status/role filters
  actionSlots?: React.ReactNode // For "Add User", "Export" buttons
}

export function FilterBar({
  className,
  onSearchChange,
  searchPlaceholder = "Search...",
  children,
  actionSlots,
  ...props
}: FilterBarProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border/50 rounded-lg bg-card", className)} {...props}>
      <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-3">
        {onSearchChange && (
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-full bg-background border border-border/50 rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}
        {(children || onSearchChange) && (
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            {children}
          </div>
        )}
      </div>
      {actionSlots && (
        <div className="flex items-center gap-2">
          {actionSlots}
        </div>
      )}
    </div>
  )
}
