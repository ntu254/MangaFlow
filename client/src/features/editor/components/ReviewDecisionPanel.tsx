import * as React from "react"
import { cn } from "@/shared/lib/utils"

interface ReviewDecisionPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  icon?: React.ReactNode
  tone?: "amber" | "emerald" | "red" | "slate"
}

const toneMap = {
  amber: "border-amber-200 bg-amber-50/50",
  emerald: "border-emerald-200 bg-emerald-50/50",
  red: "border-red-200 bg-red-50/50",
  slate: "border-slate-200 bg-slate-50/50",
}

export function ReviewDecisionPanel({ title, icon, tone = "slate", className, children, ...props }: ReviewDecisionPanelProps) {
  return (
    <div className={cn("space-y-4 rounded-2xl border p-5 shadow-sm", toneMap[tone], className)} {...props}>
      <h2 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
        {icon} {title}
      </h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}
