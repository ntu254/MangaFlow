import { CheckCircle, XCircle, AlertCircle, PlayCircle } from "lucide-react"
import { Card } from "@/shared/components/ui/card"

export function VoteSummary({ votes, pendingCount, isFinalized }: { votes: any[], pendingCount: number, isFinalized: boolean }) {
  const voteTypes = {
    APPROVE: { icon: CheckCircle, tone: 'text-emerald-600 bg-emerald-50', label: 'Approve' },
    CONTINUE: { icon: PlayCircle, tone: 'text-emerald-600 bg-emerald-50', label: 'Continue' },
    WARNING: { icon: AlertCircle, tone: 'text-amber-600 bg-amber-50', label: 'Warning' },
    CANCEL: { icon: XCircle, tone: 'text-rose-600 bg-rose-50', label: 'Cancel' },
    REJECT: { icon: XCircle, tone: 'text-rose-600 bg-rose-50', label: 'Reject' }
  }

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Vote Summary</h3>
        {isFinalized ? (
           <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-violet-100 text-violet-700 uppercase">Finalized</span>
        ) : (
           <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 uppercase">
             {pendingCount} Pending
           </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {votes.map((vote, i) => {
          const config = voteTypes[vote.decision as keyof typeof voteTypes] || voteTypes.APPROVE
          const Icon = config.icon
          return (
            <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.tone}`}>
                  <Icon size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-slate-900">{vote.editorName}</span>
                  <span className="text-[11px] text-slate-500">{config.label}</span>
                </div>
              </div>
              <span className="text-[12px] text-slate-700 max-w-[200px] line-clamp-1 italic">
                "{vote.comment}"
              </span>
            </div>
          )
        })}
        {votes.length === 0 && (
          <div className="text-center py-4 text-slate-500 text-[13px]">No votes cast yet.</div>
        )}
      </div>
    </Card>
  )
}
