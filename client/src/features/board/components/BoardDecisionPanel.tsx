import * as React from "react"
import { cn } from "@/shared/lib/utils"

interface BoardDecisionPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  icon?: React.ReactNode
  tone?: "emerald" | "amber" | "red" | "violet"
}

const toneMap = {
  emerald: "border-emerald-200 bg-emerald-50/50",
  amber: "border-amber-200 bg-amber-50/50",
  red: "border-red-200 bg-red-50/50",
  violet: "border-violet-200 bg-violet-50/50",
}

export function BoardDecisionPanel({ title, icon, tone = "violet", className, children, ...props }: BoardDecisionPanelProps) {
  return (
    <div className={cn("space-y-4 rounded-2xl border p-6 shadow-sm", toneMap[tone], className)} {...props}>
      <h2 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
        {icon} {title}
      </h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}
