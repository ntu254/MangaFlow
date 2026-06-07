import type { ReactNode } from "react"

interface AdminStatCardProps {
  icon: string
  iconBg: string
  iconColor: string
  value: ReactNode
  label: string
  trend?: { value: string; direction: "up" | "flat" | "down" }
  progress?: { value: number; color: string }
}

export function AdminStatCard({ icon, iconBg, iconColor, value, label, trend, progress }: AdminStatCardProps) {
  return (
    <div className="bg-surface-container-lowest rounded-lg p-md border border-outline-variant/20 shadow-[0px_10px_30px_rgba(111,68,178,0.05)] hover:shadow-[0px_15px_40px_rgba(111,68,178,0.08)] transition-all flex flex-col justify-between min-h-[110px] group cursor-default">
      <div className="flex justify-between items-center">
        <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <span className={`material-symbols-outlined ${iconColor} text-[20px]`}>{icon}</span>
        </div>
        {trend && (
          <span className={`text-label-sm font-label-sm ${trend.direction === "up" ? "text-primary bg-primary-fixed/50" : trend.direction === "down" ? "text-error bg-error-container" : "text-outline bg-surface-container-high"} px-2 py-0.5 rounded-full flex items-center gap-1`}>
            <span className="material-symbols-outlined text-[12px]">{trend.direction === "up" ? "trending_up" : trend.direction === "down" ? "trending_down" : "trending_flat"}</span>
            {trend.value}
          </span>
        )}
      </div>
      <div className="mt-2">
        <h3 className="text-headline-md font-display text-on-surface">{value}</h3>
        <p className="text-label-sm font-label-sm text-on-surface-variant">{label}</p>
        {progress && (
          <div className="w-full bg-surface-container-high h-1 rounded-full mt-1 overflow-hidden">
            <div className={`${progress.color} h-full rounded-full`} style={{ width: `${progress.value}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}
