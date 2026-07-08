import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down";
  icon: LucideIcon;
}

export function StatCard({ label, value, change, trend, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-body">{label}</span>
        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-foreground font-body">{value}</p>
      {change && (
        <p className={cn("text-xs font-body mt-1", trend === "up" ? "text-teal" : "text-destructive")}>
          {trend === "up" ? "↑" : "↓"} {change}
        </p>
      )}
    </div>
  );
}
