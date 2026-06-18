import { FileText, Image as ImageIcon, FileArchive, File as FileIcon } from 'lucide-react'
import type { CreateSeriesFormData, UploadedSeriesFile, UploadSlot } from './types'
import { formatFileSize, UPLOAD_SLOT_LABELS } from './types'

interface Step3SubmitProps {
  formData: CreateSeriesFormData
  uploadedFiles: UploadedSeriesFile[]
  editorMessage: string
  setEditorMessage: (value: string) => void
}

const REQUIRED_SLOTS: UploadSlot[] = ['PROPOSAL_PDF', 'SAMPLE_PAGE']

function iconForFile(file: UploadedSeriesFile) {
  if (file.contentType === 'application/pdf') return { icon: <FileText className="text-rose-600" size={20} />, bg: 'bg-rose-50' }
  if (file.contentType === 'application/zip') return { icon: <FileArchive className="text-emerald-600" size={20} />, bg: 'bg-emerald-50' }
  if (file.contentType.startsWith('image/')) return { icon: <ImageIcon className="text-blue-600" size={20} />, bg: 'bg-blue-50' }
  return { icon: <FileIcon className="text-slate-500" size={20} />, bg: 'bg-slate-50' }
}

export function Step3Submit({ formData, uploadedFiles, editorMessage, setEditorMessage }: Step3SubmitProps) {
  const requiredCount = uploadedFiles.filter((f) => REQUIRED_SLOTS.includes(f.slot)).length
  const optionalCount = uploadedFiles.length - requiredCount

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Submission Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col w-full shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-bold text-violet-900">1. Submission Summary</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
          <div className="flex flex-col gap-6">
            <SummaryRow label="Series Title" value={formData.title || '-'} />
            <SummaryRow label="Genre" value={formData.genre || '-'} />
            <SummaryRow label="Target Audience" value={formData.audience || '-'} />
            <SummaryRow label="Proposed Publication Type" value={formData.publicationType || '-'} />
            <SummaryRow label="Logline" value={formData.logline || '-'} />
          </div>

          <div className="flex flex-col gap-6">
            <SummaryBlock label="Synopsis" value={formData.synopsis || '-'} />
            <SummaryBlock label="Story Premise" value={formData.premise || '-'} />
            <SummaryBlock label="Main Characters" value={formData.characters || '-'} />
            <SummaryBlock label="Conflict / Hook" value={formData.conflict || '-'} />
            {formData.tags.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-bold text-slate-900">Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {formData.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded border border-slate-200 text-[11px] font-semibold text-slate-600 bg-white">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Submitted Materials */}
      <div className="bg-white border border-slate-200 rounded-2xl flex flex-col w-full shadow-sm overflow-hidden">
        <div className="p-8 pb-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-violet-900 mb-6">2. Submitted Materials</h2>
          <div className="flex items-center gap-2">
            <span className="px-4 py-1.5 bg-violet-600 text-white text-[12px] font-bold rounded-full">All ({uploadedFiles.length})</span>
            <span className="px-4 py-1.5 bg-slate-100 text-slate-600 text-[12px] font-bold rounded-full">Required ({requiredCount})</span>
            <span className="px-4 py-1.5 bg-slate-100 text-slate-600 text-[12px] font-bold rounded-full">Optional ({optionalCount})</span>
          </div>
        </div>

        <div className="flex flex-col p-4">
          {uploadedFiles.length === 0 ? (
            <p className="text-[13px] text-slate-500 p-4">No files uploaded.</p>
          ) : (
            uploadedFiles.map((file) => {
              const { icon, bg } = iconForFile(file)
              const isRequired = REQUIRED_SLOTS.includes(file.slot)
              return (
                <div key={file.fileAssetId} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>{icon}</div>
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-[13px] font-bold text-slate-900 truncate mb-1">{file.originalName}</span>
                      <span className="text-[11px] text-slate-500">{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold border ${isRequired ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-slate-600 bg-slate-100 border-slate-200'}`}>
                    {UPLOAD_SLOT_LABELS[file.slot]}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 3. Message to Editor */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col w-full shadow-sm mb-8">
        <h2 className="text-lg font-bold text-violet-900 mb-2">3. Message to Editor <span className="text-slate-400 font-medium text-[15px]">(Optional)</span></h2>
        <p className="text-[13px] text-slate-500 mb-6">Add any notes or context that may help the editor understand your series better.</p>

        <div className="relative">
          <textarea
            className="w-full min-h-[120px] p-4 border border-slate-200 rounded-xl text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-violet-600 resize-none transition-all"
            placeholder="Write your message here..."
            maxLength={1000}
            value={editorMessage}
            onChange={(e) => setEditorMessage(e.target.value)}
          />
          <span className="absolute bottom-4 right-4 text-[11px] font-medium text-slate-400">{editorMessage.length}/1000</span>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4">
      <span className="text-[13px] font-bold text-slate-900">{label}</span>
      <span className="text-[13px] text-slate-600 leading-relaxed break-words">{value}</span>
    </div>
  )
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-bold text-slate-900">{label}</span>
      <span className="text-[13px] text-slate-600 leading-relaxed break-words whitespace-pre-wrap">{value}</span>
    </div>
  )
}
