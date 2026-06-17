import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

type Tone = "default" | "violet" | "emerald" | "amber" | "blue" | "rose"

const TONE_MAP: Record<
  Tone,
  { iconBg: string; iconText: string; ring?: string }
> = {
  default: { iconBg: "bg-slate-100", iconText: "text-slate-600" },
  violet:  { iconBg: "bg-violet-100", iconText: "text-violet-700" },
  emerald: { iconBg: "bg-emerald-100", iconText: "text-emerald-700" },
  amber:   { iconBg: "bg-amber-100", iconText: "text-amber-700" },
  blue:    { iconBg: "bg-blue-100", iconText: "text-blue-700" },
  rose:    { iconBg: "bg-rose-100", iconText: "text-rose-700" },
}

interface StatTileProps {
  label: string
  value: string | number
  unit?: string
  hint?: string
  delta?: { value: string; trend: "up" | "down" | "flat" }
  icon?: LucideIcon
  tone?: Tone
  className?: string
  testId?: string
  /** Highlight with violet background — used sparingly for the "hero" stat */
  emphasis?: boolean
}

export function StatTile({
  label,
  value,
  unit,
  hint,
  delta,
  icon: Icon,
  tone = "default",
  className,
  testId,
  emphasis,
}: StatTileProps) {
  const toneCfg = TONE_MAP[tone]
  return (
    <div
      data-testid={testId}
      className={cn(
        "group relative flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-soft transition-colors",
        emphasis
          ? "border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50/60"
          : "border-border hover:border-slate-300",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground tracking-tight">
          {label}
        </span>
        {Icon && (
          <span
            className={cn(
              "grid h-9 w-9 place-items-center rounded-lg",
              emphasis ? "bg-white/70 text-violet-700" : `${toneCfg.iconBg} ${toneCfg.iconText}`
            )}
          >
            <Icon size={16} strokeWidth={2.25} />
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 num">
        <span
          className={cn(
            "text-3xl font-semibold leading-none tracking-tight",
            emphasis ? "text-violet-900" : "text-foreground"
          )}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-muted-foreground">
            {unit}
          </span>
        )}
      </div>

      {(delta || hint) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {delta && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                delta.trend === "up" && "text-emerald-700",
                delta.trend === "down" && "text-rose-600",
                delta.trend === "flat" && "text-muted-foreground"
              )}
            >
              {delta.trend === "up" && <ArrowUpRight size={12} />}
              {delta.trend === "down" && <ArrowDownRight size={12} />}
              {delta.trend === "flat" && <Minus size={12} />}
              {delta.value}
            </span>
          )}
          {hint && (
            <span className="text-xs text-muted-foreground">{hint}</span>
          )}
        </div>
      )}
    </div>
  )
}
