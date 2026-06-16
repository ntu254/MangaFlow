import { Link } from "react-router-dom"
import { FileText, ArrowRight } from "lucide-react"
import { InteractiveCard } from "@/shared/components/ui/card"
import { StatusBadge } from "@/shared/components/ui/status-badge"
import { seriesStatusUi } from "@/shared/lib/status-ui"

export function ReviewCard({ item }: { item: any }) {
  const statusConfig = seriesStatusUi[item.series.status] || seriesStatusUi['DRAFT'];
  
  return (
    <InteractiveCard className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
      <div className="flex flex-col md:flex-row md:items-center gap-6 flex-1">
        <div className="flex flex-col flex-1">
          <Link to={`/app/editor/series/${item.series.id}/review`} className="font-bold text-slate-900 group-hover:text-violet-600 transition-colors text-[15px] mb-1">
            {item.series.title}
          </Link>
          <span className="text-[13px] text-slate-500 line-clamp-1 max-w-xl">
            {item.series.synopsis || "No synopsis"}
          </span>
        </div>
        
        <div className="flex items-center gap-6 ml-0 md:ml-auto md:mr-8 shrink-0">
          <div className="flex items-center gap-3 w-40">
            <div className="w-8 h-8 rounded bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100 shrink-0">
              <FileText size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-slate-900">v{item.manuscript?.version ?? "-"}</span>
              <span className="text-[11px] font-medium text-slate-500 line-clamp-1">{item.manuscript?.status ?? "NO_MANUSCRIPT"}</span>
            </div>
          </div>
          <div className="flex flex-col items-start gap-1 w-32 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Type</span>
            <span className="inline-flex items-center text-[12px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
              {item.series.requestedPublicationType ?? "-"}
            </span>
          </div>
          <div className="flex flex-col items-start gap-1 w-36 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
            <StatusBadge config={statusConfig} size="sm" />
          </div>
        </div>
      </div>
      <Link
        to={`/app/editor/series/${item.series.id}/review`}
        className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-violet-600 hover:text-white transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
        tabIndex={-1}
      >
        <ArrowRight size={18} />
      </Link>
    </InteractiveCard>
  )
}
