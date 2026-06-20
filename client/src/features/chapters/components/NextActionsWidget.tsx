import { CheckCircle2, AlertCircle, Clock, ChevronRight } from "lucide-react";
import { WidgetCard } from "@/shared/ui/site/WidgetCard";

export function NextActionsWidget() {
  return (
    <WidgetCard title="Next Actions" actionText="View all tasks" actionPosition="bottom" className="h-full">
      <button className="w-full text-left p-3 rounded-md border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors flex items-start gap-3">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-[13px] font-medium text-foreground">Upload remaining 2 pages</div>
          <div className="text-[11px] text-foreground/60 mt-0.5">Pages 19–20</div>
        </div>
        <ChevronRight className="h-3 w-3 text-foreground/40 mt-1" />
      </button>

      <button className="w-full text-left p-3 rounded-md border border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/10 transition-colors flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-[13px] font-medium text-foreground">Review Page 08</div>
          <div className="text-[11px] text-foreground/60 mt-0.5">2 tasks under review</div>
        </div>
        <ChevronRight className="h-3 w-3 text-foreground/40 mt-1" />
      </button>

      <button className="w-full text-left p-3 rounded-md border border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10 transition-colors flex items-start gap-3">
        <Clock className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-[13px] font-medium text-foreground">Assign task for Page 10</div>
          <div className="text-[11px] text-foreground/60 mt-0.5">1 task pending assignment</div>
        </div>
        <ChevronRight className="h-3 w-3 text-foreground/40 mt-1" />
      </button>
      
      <button className="w-full text-left p-3 rounded-md border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors flex items-start gap-3">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-[13px] font-medium text-foreground">Prepare Chapter 13 outline</div>
          <div className="text-[11px] text-foreground/60 mt-0.5">Plan next chapter</div>
        </div>
        <ChevronRight className="h-3 w-3 text-foreground/40 mt-1" />
      </button>
    </WidgetCard>
  );
}
