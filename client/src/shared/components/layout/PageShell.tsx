import { type ReactNode } from "react"
import { cn } from "@/shared/lib/utils"
import { RoleSidebar } from "./RoleSidebar"
import { DashboardTopBar } from "./DashboardTopBar"

interface PageShellProps {
  children: ReactNode
  className?: string
  hideSidebar?: boolean
}

export function PageShell({ children, className, hideSidebar }: PageShellProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {!hideSidebar && <RoleSidebar />}
      <div className={cn("flex flex-1 flex-col overflow-hidden")}>
        <DashboardTopBar />
        <main className={cn("flex-1 overflow-y-auto p-lg", className)}>
          {children}
        </main>
      </div>
    </div>
  )
}
