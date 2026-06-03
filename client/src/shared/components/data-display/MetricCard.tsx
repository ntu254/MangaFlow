import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  color?: "purple" | "pink" | "coral" | "yellow" | "lime";
};

const colorMap = {
  purple: { bg: "#ece5ff", border: "#9065d5" },
  pink: { bg: "#ffe6f2", border: "#e560bc" },
  coral: { bg: "#ffe7de", border: "#ff9971" },
  yellow: { bg: "#fff0c2", border: "#ffc95e" },
  lime: { bg: "#f4ffd2", border: "#f9f871" },
};

export function MetricCard({ title, value, description, icon, trend, color = "purple" }: MetricCardProps) {
  const colors = colorMap[color];

  return (
    <div className="bg-mf-bg-card border border-mf-border rounded-2xl p-5 shadow-card hover:shadow-soft transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-mf-text-muted uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-mf-text mt-1">{value}</p>
          {description && (
            <p className="text-xs text-mf-text-secondary mt-1">{description}</p>
          )}
        </div>
        {icon && (
          <div
            className="p-2.5 rounded-xl shrink-0"
            style={{ backgroundColor: colors.bg }}
          >
            <span style={{ color: colors.border }}>{icon}</span>
          </div>
        )}
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-3 text-xs font-medium">
          {trend.direction === "up" && (
            <>
              <TrendingUp className="size-3.5 text-emerald-500" />
              <span className="text-emerald-600">+{trend.value}%</span>
            </>
          )}
          {trend.direction === "down" && (
            <>
              <TrendingDown className="size-3.5 text-rose-500" />
              <span className="text-rose-600">-{trend.value}%</span>
            </>
          )}
          {trend.direction === "neutral" && (
            <>
              <Minus className="size-3.5 text-mf-text-muted" />
              <span className="text-mf-text-muted">0%</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
