import { useId, useState, type ReactNode } from "react"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFIconButton } from "@/shared/components/ui/MFIconButton"
import { cn } from "@/shared/lib/utils"

export type WorkspacePanel = "left" | "canvas" | "right"

interface WorkspaceShellProps {
  leftPanel?: ReactNode
  canvas?: ReactNode
  rightPanel?: ReactNode
  leftLabel?: string
  canvasLabel?: string
  rightLabel?: string
  toolbar?: ReactNode
  initialMobilePanel?: WorkspacePanel
  className?: string
}

const PANEL_ICONS: Record<WorkspacePanel, string> = {
  left: "view_sidebar",
  canvas: "image",
  right: "dock_to_right",
}

function EmptyWorkspacePanel({ label }: { label: string }) {
  return (
    <MFEmptyState
      icon="space_dashboard"
      title={`${label} is empty`}
      description="Content will appear here when the workspace feature supplies it."
    />
  )
}

export function WorkspaceShell({
  leftPanel,
  canvas,
  rightPanel,
  leftLabel = "Pages and context",
  canvasLabel = "Workspace canvas",
  rightLabel = "Details and actions",
  toolbar,
  initialMobilePanel = "canvas",
  className,
}: WorkspaceShellProps) {
  const instanceId = useId()
  const [mobilePanel, setMobilePanel] = useState<WorkspacePanel>(initialMobilePanel)
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false)
  const [isRightCollapsed, setIsRightCollapsed] = useState(false)

  const panels: Array<{
    id: WorkspacePanel
    label: string
    content?: ReactNode
  }> = [
    { id: "left", label: leftLabel, content: leftPanel },
    { id: "canvas", label: canvasLabel, content: canvas },
    { id: "right", label: rightLabel, content: rightPanel },
  ]

  return (
    <section
      className={cn(
        "flex min-h-[calc(100vh-9rem)] flex-col overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-lowest shadow-ambient",
        className,
      )}
      aria-label="MangaFlow workspace"
    >
      <div className="flex min-h-14 items-center justify-between gap-md border-b border-outline-variant/30 bg-surface-low px-md py-sm">
        <div className="min-w-0 flex-1">{toolbar}</div>
        <div className="hidden items-center gap-xs md:flex">
          <MFIconButton
            aria-label={isLeftCollapsed ? `Show ${leftLabel}` : `Hide ${leftLabel}`}
            aria-expanded={!isLeftCollapsed}
            aria-controls={`${instanceId}-left`}
            onClick={() => setIsLeftCollapsed((current) => !current)}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {isLeftCollapsed ? "left_panel_open" : "left_panel_close"}
            </span>
          </MFIconButton>
          <MFIconButton
            aria-label={isRightCollapsed ? `Show ${rightLabel}` : `Hide ${rightLabel}`}
            aria-expanded={!isRightCollapsed}
            aria-controls={`${instanceId}-right`}
            onClick={() => setIsRightCollapsed((current) => !current)}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {isRightCollapsed ? "right_panel_open" : "right_panel_close"}
            </span>
          </MFIconButton>
        </div>
      </div>

      <div
        className="flex gap-xs overflow-x-auto border-b border-outline-variant/30 bg-surface-container p-xs md:hidden"
        aria-label="Workspace panels"
      >
        {panels.map((panel) => {
          const isActive = mobilePanel === panel.id

          return (
            <button
              key={panel.id}
              type="button"
              aria-pressed={isActive}
              aria-controls={`${instanceId}-${panel.id}`}
              className={cn(
                "inline-flex min-h-11 flex-1 items-center justify-center gap-sm rounded-full px-md py-sm text-label-sm",
                "focus-visible:outline-none focus-visible:shadow-focus",
                isActive
                  ? "bg-surface-lowest text-primary shadow-sm"
                  : "text-on-surface-muted hover:text-on-surface",
              )}
              onClick={() => setMobilePanel(panel.id)}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                {PANEL_ICONS[panel.id]}
              </span>
              <span className="whitespace-nowrap">{panel.label}</span>
            </button>
          )
        })}
      </div>

      <div className="flex min-h-0 flex-1">
        <aside
          id={`${instanceId}-left`}
          role="region"
          aria-label={leftLabel}
          className={cn(
            "min-h-0 w-full overflow-y-auto border-r border-outline-variant/30 bg-surface-low p-md md:w-64 md:shrink-0",
            mobilePanel === "left" ? "block" : "hidden",
            isLeftCollapsed ? "md:hidden" : "md:block",
          )}
        >
          {leftPanel ?? <EmptyWorkspacePanel label={leftLabel} />}
        </aside>

        <main
          id={`${instanceId}-canvas`}
          role="region"
          aria-label={canvasLabel}
          className={cn(
            "min-h-0 min-w-0 flex-1 overflow-auto bg-surface-container p-md md:block",
            mobilePanel === "canvas" ? "block" : "hidden",
          )}
        >
          {canvas ?? <EmptyWorkspacePanel label={canvasLabel} />}
        </main>

        <aside
          id={`${instanceId}-right`}
          role="region"
          aria-label={rightLabel}
          className={cn(
            "min-h-0 w-full overflow-y-auto border-l border-outline-variant/30 bg-surface-low p-md md:w-80 md:shrink-0",
            mobilePanel === "right" ? "block" : "hidden",
            isRightCollapsed ? "md:hidden" : "md:block",
          )}
        >
          {rightPanel ?? <EmptyWorkspacePanel label={rightLabel} />}
        </aside>
      </div>
    </section>
  )
}
