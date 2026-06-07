import { type HTMLAttributes, forwardRef } from "react"
import { cn } from "@/shared/lib/utils"

export interface TabItem {
  id: string
  label: string
  count?: number
}

interface MFTabsProps extends HTMLAttributes<HTMLDivElement> {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export const MFTabs = forwardRef<HTMLDivElement, MFTabsProps>(
  ({ className, tabs, activeTab, onTabChange, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex gap-sm rounded-full bg-surface-container p-xs", className)} {...props}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-sm rounded-full px-lg py-sm text-label-sm font-semibold transition-all duration-150",
              "focus-visible:outline-none focus-visible:shadow-focus",
              tab.id === activeTab
                ? "bg-surface-lowest text-on-surface shadow-sm"
                : "text-on-surface-muted hover:text-on-surface",
            )}
            aria-selected={tab.id === activeTab}
            role="tab"
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-label-sm",
                tab.id === activeTab
                  ? "bg-primary-fixed text-on-primary-fixed"
                  : "bg-surface-container text-on-surface-muted",
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    )
  },
)

MFTabs.displayName = "MFTabs"
