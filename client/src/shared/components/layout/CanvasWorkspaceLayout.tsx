import * as React from "react"
import { cn } from "@/shared/lib/utils"

/**
 * Full-screen studio layout: toolbar (top) · canvas (center, fills) ·
 * optional inspector (right). Pair with `usePageChrome({ sidebar: "hidden",
 * bleed: true })` so the canvas owns the viewport.
 */
interface CanvasWorkspaceLayoutProps {
  toolbar?: React.ReactNode
  inspector?: React.ReactNode
  inspectorWidth?: string
  children: React.ReactNode
  className?: string
}

export function CanvasWorkspaceLayout({
  toolbar,
  inspector,
  inspectorWidth = "20rem",
  children,
  className,
}: CanvasWorkspaceLayoutProps) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-slate-100", className)}>
      {toolbar && (
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card px-4">
          {toolbar}
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1 overflow-auto">{children}</div>
        {inspector && (
          <aside
            className="min-h-0 shrink-0 overflow-y-auto border-l border-border bg-card w-[var(--canvas-inspector-w)]"
            style={{ ["--canvas-inspector-w" as string]: inspectorWidth }}
          >
            {inspector}
          </aside>
        )}
      </div>
    </div>
  )
}
