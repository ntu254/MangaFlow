import React from "react";
import { WidgetCard } from "@/shared/ui/site/WidgetCard";

export interface ActivityItem {
  text: string;
  by: string;
  time: string;
  icon: React.ElementType;
  tone: string;
}

interface RecentActivityWidgetProps {
  activities: ActivityItem[];
}

export function RecentActivityWidget({ activities }: RecentActivityWidgetProps) {
  return (
    <WidgetCard title="Recent Activity" actionText="View all">
      {activities.map((a, i) => {
        const Icon = a.icon;
        return (
          <div key={i} className="flex items-start gap-2.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${a.tone}`} />
                <div>
                  <div className="text-[13px] font-medium text-foreground leading-tight">
                    {a.text}
                  </div>
                  <div className="text-[11px] text-foreground/50 flex justify-between w-full mt-1 min-w-[120px]">
                    <span>by {a.by}</span>
                    <span className="ml-2">{a.time}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </WidgetCard>
  );
}
