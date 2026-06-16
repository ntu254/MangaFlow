import * as React from "react"
import { cn } from "@/shared/lib/utils"
import { Card } from "./card"
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react"

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  description?: string
  trend?: {
    value: number // percentage
    isPositive: boolean
  }
  icon?: LucideIcon
  tone?: "slate" | "violet" | "emerald" | "amber" | "blue" | "purple" | "red"
}

const toneMap = {
  slate: "bg-slate-100 text-slate-600",
  violet: "bg-violet-100 text-violet-600",
  emerald: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
  blue: "bg-blue-100 text-blue-600",
  purple: "bg-purple-100 text-purple-600",
  red: "bg-red-100 text-red-600",
}

export function StatCard({
  label,
  value,
  description,
  trend,
  icon: Icon,
  tone = "violet",
  className,
  ...props
}: StatCardProps) {
  return (
    <Card className={cn("p-5 flex flex-col gap-3", className)} {...props}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        {Icon && (
          <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg", toneMap[tone])}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-900 tracking-tight">{value}</span>
          {trend && (
            <span className={cn(
              "text-xs font-semibold flex items-center gap-0.5",
              trend.isPositive ? "text-emerald-600" : "text-red-600"
            )}>
              {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend.value}%
            </span>
          )}
        </div>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
    </Card>
  )
}
