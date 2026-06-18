import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Input } from "./input"

/**
 * Horizontal action bar for table/list screens (Admin pattern):
 * [ search ............. ] [ filters slot ]   [ actions slot ]
 */
interface CommandBarProps extends React.HTMLAttributes<HTMLDivElement> {
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  filters?: React.ReactNode
  actions?: React.ReactNode
}

export function CommandBar({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filters,
  actions,
  className,
  ...props
}: CommandBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-card p-3",
        className
      )}
      {...props}
    >
      <div className="flex flex-1 items-center gap-3 min-w-0">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 h-9 bg-secondary/50"
          />
        </div>
        {filters}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
