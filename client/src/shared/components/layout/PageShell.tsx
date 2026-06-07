import { type ReactNode } from "react"
import { cn } from "@/shared/lib/utils"
import { AppNavbar } from "./AppNavbar"
import { RoleSidebar } from "./RoleSidebar"

interface PageShellProps {
  children: ReactNode
  className?: string
  hideSidebar?: boolean
}

export function PageShell({ children, className, hideSidebar }: PageShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="flex">
        {!hideSidebar && <RoleSidebar isOpen />}
        <main
          className={cn(
            "flex-1 p-lg",
            !hideSidebar && "md:ml-60",
            className,
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
