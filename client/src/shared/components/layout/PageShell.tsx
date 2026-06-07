import { type ReactNode } from "react"
import { cn } from "@/shared/lib/utils"

interface PageShellProps {
  children: ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return <div className={cn("space-y-xl", className)}>{children}</div>
}
