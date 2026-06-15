import { CheckCircle2, Send, FileText } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useNavigate } from 'react-router-dom'

interface SubmitSuccessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  seriesId?: string | null
  title?: string
  authorName?: string
}

export function SubmitSuccessModal({ open, onOpenChange, seriesId, title, authorName }: SubmitSuccessModalProps) {
  const navigate = useNavigate()
  const submittedAt = new Date()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] p-10 flex flex-col items-center border-0 shadow-2xl rounded-3xl" hideClose>
        <div className="relative w-32 h-32 flex items-center justify-center mb-6">
          <div className="absolute inset-0 bg-indigo-50 rounded-full animate-pulse"></div>
          <div className="absolute w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center">
            <Send size={40} className="text-indigo-600 -ml-1 mt-1" strokeWidth={1.5} />
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 size={36} className="text-emerald-500 fill-emerald-50" />
          <h2 className="text-[28px] font-extrabold text-slate-900 tracking-tight">Submission Sent!</h2>
        </div>

        <p className="text-slate-500 text-[15px] text-center max-w-[440px] mb-8 leading-relaxed">
          {title ? <><strong className="text-slate-700">{title}</strong> has been submitted to the editor.</> : 'Your series proposal has been successfully submitted to the editor.'}
          {' '}You will be notified when the editor starts the review.
        </p>

        <div className="w-full bg-slate-50/50 border border-indigo-100/50 rounded-2xl p-6 flex items-center justify-between mb-8 shadow-sm">
          <div className="flex flex-col gap-1.5 min-w-0">
            <span className="text-[12px] font-bold text-slate-400 uppercase">Series ID</span>
            <span className="text-[13px] font-extrabold text-slate-800 tracking-wide truncate">{seriesId ?? '-'}</span>
          </div>

          <div className="h-10 w-px bg-slate-200"></div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold text-slate-400 uppercase">Submitted on</span>
            <span className="text-[14px] font-semibold text-slate-700">{submittedAt.toLocaleString()}</span>
          </div>

          {authorName && (
            <>
              <div className="h-10 w-px bg-slate-200"></div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-slate-400 uppercase">Submitted by</span>
                <span className="text-[14px] font-semibold text-slate-700">{authorName} (Mangaka)</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/mangaka/series')}
            className="flex items-center justify-center gap-2 h-12 px-8 rounded-xl border border-indigo-200 text-indigo-700 font-bold hover:bg-indigo-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 shadow-sm"
          >
            <FileText size={18} />
            Back to My Series
          </button>
          {seriesId && (
            <button
              onClick={() => navigate(`/app/mangaka/series/${seriesId}`)}
              className="flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 shadow-sm"
            >
              View Submission
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
