import * as React from "react"
import { cn } from "@/shared/lib/utils"

/**
 * Two-pane review/queue layout: a scrollable list (master) on the left and a
 * detail pane on the right. Use under a `bleed` page so it fills the viewport.
 * On mobile the panes stack; when an item is selected, show the detail.
 */
interface MasterDetailLayoutProps {
  list: React.ReactNode
  detail: React.ReactNode
  /** width of the master pane on desktop */
  listWidth?: string
  /** true when an item is selected — controls mobile pane visibility */
  hasSelection?: boolean
  className?: string
}

export function MasterDetailLayout({
  list,
  detail,
  listWidth = "22rem",
  hasSelection = false,
  className,
}: MasterDetailLayoutProps) {
  return (
    <div className={cn("flex h-full min-h-0 w-full", className)}>
      <div
        className={cn(
          "min-h-0 shrink-0 overflow-y-auto border-r border-border bg-card",
          "w-full md:w-[var(--md-list-w)]",
          hasSelection ? "hidden md:block" : "block"
        )}
        style={{ ["--md-list-w" as string]: listWidth }}
      >
        {list}
      </div>
      <div
        className={cn(
          "min-h-0 min-w-0 flex-1 overflow-y-auto bg-background",
          hasSelection ? "block" : "hidden md:block"
        )}
      >
        {detail}
      </div>
    </div>
  )
}
