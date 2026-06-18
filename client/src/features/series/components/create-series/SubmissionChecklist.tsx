import { CheckCircle2, Circle, Lightbulb } from 'lucide-react'
import type { CreateSeriesFormData, UploadedSeriesFile } from './types'

interface SubmissionChecklistProps {
  formData: CreateSeriesFormData
  uploadedFiles: UploadedSeriesFile[]
}

export function SubmissionChecklist({ formData, uploadedFiles }: SubmissionChecklistProps) {
  const profileComplete = Boolean(
    formData.title.trim() &&
      formData.synopsis.trim() &&
      formData.genre &&
      formData.audience &&
      formData.logline.trim() &&
      formData.premise.trim() &&
      formData.characters.trim() &&
      formData.conflict.trim(),
  )

  const has = (slot: string) => uploadedFiles.some((f) => f.slot === slot)
  const proposalComplete = has('PROPOSAL_PDF') || has('SAMPLE_PAGE')
  const characterComplete = has('CHARACTER_CONCEPT')
  const coverComplete = has('COVER_DRAFT')
  const referenceComplete = has('REFERENCE_IMAGE')
  const worldComplete = has('WORLD_SETTING')

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col w-full">
      <h3 className="text-sm font-bold text-slate-900 mb-4">Submission Checklist</h3>

      <div className="flex flex-col gap-4 mb-6">
        <ChecklistItem completed={profileComplete} title="Series Profile" sub={profileComplete ? 'Completed' : 'Fill required fields in Step 1'} required />
        <ChecklistItem completed={proposalComplete} title="Proposal Materials" sub={proposalComplete ? 'PDF or sample pages uploaded' : 'Upload at least one PDF or sample page'} required />
        <ChecklistItem completed={characterComplete} title="Character Concepts" sub={characterComplete ? 'Uploaded' : 'Optional'} />
        <ChecklistItem completed={coverComplete} title="Cover Draft" sub={coverComplete ? 'Uploaded' : 'Optional'} />
        <ChecklistItem completed={referenceComplete} title="Reference Images" sub={referenceComplete ? 'Uploaded' : 'Optional'} />
        <ChecklistItem completed={worldComplete} title="World / Setting" sub={worldComplete ? 'Uploaded' : 'Optional'} />
      </div>

      <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 flex gap-3">
        <Lightbulb size={18} className="text-violet-600 shrink-0 mt-0.5" />
        <p className="text-[12px] text-violet-900 leading-relaxed font-medium">
          More materials help editors and the board better understand your story and world.
        </p>
      </div>
    </div>
  )
}

function ChecklistItem({ completed, title, sub, required = false }: { completed: boolean; title: string; sub: string; required?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">
        {completed ? (
          <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-50" />
        ) : (
          <Circle size={18} className="text-slate-300" />
        )}
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <span className={`text-[13px] font-bold ${completed ? 'text-slate-900' : 'text-slate-500'}`}>{title}</span>
        <span className="text-[11px] text-slate-400">{sub}</span>
      </div>
      {completed ? (
        <span className="text-[10px] font-bold text-emerald-600">Completed</span>
      ) : (
        <span className={`text-[10px] font-medium ${required ? 'text-rose-500' : 'text-slate-400'}`}>{required ? 'Required' : 'Optional'}</span>
      )}
    </div>
  )
}
