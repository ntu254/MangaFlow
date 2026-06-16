import { ReactNode } from 'react'
import { ArrowRight, ChevronRight, Save, Send, Info, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DraftSummary } from '@/features/series/components/create-series/DraftSummary'
import { SeriesSummaryWidget } from '@/features/series/components/create-series/SeriesSummaryWidget'
import { PreparationChecklist } from '@/features/series/components/create-series/PreparationChecklist'
import { SubmissionChecklist } from '@/features/series/components/create-series/SubmissionChecklist'
import type { CreateSeriesFormData, UploadedSeriesFile } from './types'

interface CreateSeriesLayoutProps {
  children: ReactNode
  currentStep: number
  onNext: () => void
  onPrev: () => void
  nextDisabled?: boolean
  nextLoading?: boolean
  onSaveDraft?: () => void
  saveDraftLoading?: boolean
  saveDraftDisabled?: boolean
  formData: CreateSeriesFormData
  uploadedFiles: UploadedSeriesFile[]
}

export function CreateSeriesLayout({
  children,
  currentStep,
  onNext,
  onPrev,
  nextDisabled,
  nextLoading,
  onSaveDraft,
  saveDraftLoading,
  saveDraftDisabled,
  formData,
  uploadedFiles,
}: CreateSeriesLayoutProps) {
  return (
    <div className="max-w-[1400px] w-full mx-auto pb-24 space-y-6 relative">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[13px] text-slate-500 mb-2">
        <Link to="/app/mangaka/series" className="hover:text-indigo-600 transition-colors">My Series</Link>
        <ChevronRight size={14} />
        <span className="text-slate-900 font-medium">Create New Series</span>
        {currentStep === 2 && (
          <>
            <ChevronRight size={14} />
            <span className="text-slate-900 font-medium">Upload Draft</span>
          </>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
          {currentStep === 1 ? 'Create New Series' : 'Upload Draft / Manuscript'}
        </h1>
        <p className="text-[14px] text-slate-500">
          {currentStep === 1
            ? 'Fill in the details of your new series proposal. The more clear and complete, the better!'
            : 'Upload your series proposal and sample materials for editor and board review.'}
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center w-full max-w-3xl mb-10">
        <StepItem number={1} title="Series Profile" active={currentStep === 1} completed={currentStep > 1} />
        <div className={`flex-1 h-px mx-4 ${currentStep > 1 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
        <StepItem number={2} title="Upload Draft" active={currentStep === 2} completed={currentStep > 2} />
        <div className={`flex-1 h-px mx-4 ${currentStep > 2 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
        <StepItem number={3} title="Submit to Editor" active={currentStep === 3} completed={currentStep > 3} />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_380px] gap-8">
        {/* Left Form Area */}
        <div className="flex flex-col gap-6">{children}</div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-6">
          {currentStep !== 3 ? (
            <DraftSummary formData={formData} editable={currentStep === 1} />
          ) : (
            <SeriesSummaryWidget formData={formData} uploadedFiles={uploadedFiles} />
          )}
          {currentStep === 1 && <PreparationChecklist />}
          {currentStep === 2 && <SubmissionChecklist uploadedFiles={uploadedFiles} formData={formData} />}
          {currentStep === 3 && <SubmissionChecklist uploadedFiles={uploadedFiles} formData={formData} />}
          {currentStep === 3 && (
            <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100 flex gap-3">
              <Info className="text-indigo-600 shrink-0 mt-0.5" size={18} />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-indigo-900">What happens next?</span>
                <span className="text-[13px] text-indigo-700 leading-relaxed">
                  Your submission will be sent to the editor. You can track the review progress in the <strong className="font-bold">My Series</strong> page.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1400px] mx-auto w-full px-6 h-20 flex items-center justify-between">
          <div>
            {currentStep > 1 ? (
              <button
                className="flex items-center gap-2 px-4 h-11 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                onClick={onPrev}
                disabled={nextLoading}
              >
                <ChevronRight className="rotate-180" size={16} />
                Back
              </button>
            ) : (
              <Link
                to="/app/mangaka/series"
                className="flex items-center gap-2 px-4 h-11 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Cancel
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={!onSaveDraft || saveDraftLoading || saveDraftDisabled || nextLoading}
              className="flex items-center gap-2 px-6 h-11 rounded-lg text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 transition-colors disabled:opacity-60"
            >
              {saveDraftLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save as Draft
            </button>
            <button
              className="flex items-center gap-2 px-6 h-11 rounded-lg text-sm font-bold text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 transition-colors bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
              onClick={onNext}
              disabled={nextDisabled}
            >
              {nextLoading ? <Loader2 size={16} className="animate-spin" /> : null}
              {currentStep === 3 ? 'Submit to Editor' : currentStep === 1 ? 'Next: Upload Draft' : 'Next: Submit to Editor'}
              {!nextLoading && (currentStep === 3 ? <Send size={16} /> : <ArrowRight size={16} />)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepItem({ number, title, active, completed }: { number: number; title: string; active: boolean; completed: boolean }) {
  if (completed) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">?</div>
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-indigo-900">{title}</span>
          <span className="text-[11px] font-semibold text-emerald-600">Completed</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${active ? 'bg-indigo-600 text-white shadow-md ring-4 ring-indigo-50' : 'bg-slate-100 text-slate-500'}`}>
        {number}
      </div>
      <div className="flex flex-col">
        <span className={`text-[13px] font-bold ${active ? 'text-indigo-900' : 'text-slate-500'}`}>{title}</span>
      </div>
    </div>
  )
}
