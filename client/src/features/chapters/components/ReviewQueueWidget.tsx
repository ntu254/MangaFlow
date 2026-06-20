import { FileText } from "lucide-react";
import { WidgetCard } from "@/shared/ui/site/WidgetCard";

export interface ReviewItem {
  id: number;
  page: string;
  submitter: string;
  time: string;
}

interface ReviewQueueWidgetProps {
  reviews: ReviewItem[];
}

export function ReviewQueueWidget({ reviews }: ReviewQueueWidgetProps) {
  return (
    <WidgetCard title="Review Queue" actionText="View all">
      {reviews.map((r) => (
        <div key={r.id} className="flex items-start gap-2.5 group cursor-pointer">
          <div className="h-7 w-7 rounded bg-foreground/5 border border-foreground/10 flex items-center justify-center shrink-0">
            <FileText className="h-3 w-3 text-foreground/50" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <div className="text-[12px] font-bold text-foreground group-hover:text-sky-600 transition-colors">
                {r.page}
              </div>
              <div className="text-[10px] font-semibold text-foreground/40 shrink-0">{r.time}</div>
            </div>
            <div className="text-[10px] font-medium text-foreground/50 truncate">
              Submitted by {r.submitter}
            </div>
          </div>
        </div>
      ))}
    </WidgetCard>
  );
}
