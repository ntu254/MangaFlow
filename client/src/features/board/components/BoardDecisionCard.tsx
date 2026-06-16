import { Link } from "react-router-dom"
import { Users, AlertTriangle, ArrowRight } from "lucide-react"
import { InteractiveCard } from "@/shared/components/ui/card"
import { format } from "date-fns"

export function BoardDecisionCard({ series, linkTo }: { series: any, linkTo: string }) {
  const isResolved = series.decisionStatus !== "PENDING"
  
  return (
    <InteractiveCard className={`p-5 flex flex-col gap-4 group ${isResolved ? 'opacity-80 hover:opacity-100' : ''}`}>
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
          isResolved ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-600 border border-amber-100'
        }`}>
          {isResolved ? series.decisionStatus.replace(/_/g, " ") : "Voting Open"}
        </span>
        <span className="text-[12px] text-slate-500 font-medium">
          {format(new Date(series.updatedAt), "MMM d, yyyy")}
        </span>
      </div>
      
      <div className="flex flex-col">
        <Link to={linkTo} className="text-[16px] font-bold text-slate-900 group-hover:text-violet-600 transition-colors line-clamp-1">
          {series.seriesTitle}
        </Link>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-[13px] text-slate-600 font-medium">
            <Users size={14} className="text-slate-400" />
            {series.voteCount} vote(s)
          </div>
          {!isResolved && series.riskLevel === 'HIGH' && (
            <div className="flex items-center gap-1.5 text-[13px] text-red-600 font-medium">
              <AlertTriangle size={14} /> High Risk
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-2 flex justify-end">
        <Link
          to={linkTo}
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-600 group-hover:text-violet-600 transition-colors"
        >
          {isResolved ? 'View Summary' : 'Review & Vote'} <ArrowRight size={14} />
        </Link>
      </div>
    </InteractiveCard>
  )
}
