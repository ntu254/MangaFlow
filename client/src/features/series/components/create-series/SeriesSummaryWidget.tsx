import { FileText, BookOpen, HardDrive } from 'lucide-react'
import type { CreateSeriesFormData, UploadedSeriesFile } from './types'
import { formatFileSize } from './types'

interface SeriesSummaryWidgetProps {
  formData: CreateSeriesFormData
  uploadedFiles: UploadedSeriesFile[]
}

export function SeriesSummaryWidget({ formData, uploadedFiles }: SeriesSummaryWidgetProps) {
  const totalSize = uploadedFiles.reduce((sum, f) => sum + f.size, 0)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col w-full">
      <h3 className="text-sm font-bold text-indigo-900 mb-6">Series Summary</h3>

      <div className="flex gap-4 mb-6">
        <div className="w-20 h-28 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200" />
        <div className="flex flex-col flex-1 py-1">
          <span className="text-[15px] font-bold text-slate-900 mb-2 leading-tight break-words">{formData.title || 'Untitled'}</span>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <span className="text-[11px] font-bold text-emerald-600">Draft</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-5 border-t border-slate-100">
        <div className="flex flex-col items-center text-center">
          <FileText className="text-slate-400 mb-2" size={20} strokeWidth={1.5} />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Files</span>
          <span className="text-lg font-bold text-slate-900">{uploadedFiles.length}</span>
          <span className="text-[10px] text-slate-400">Total files</span>
        </div>
        <div className="flex flex-col items-center text-center">
          <BookOpen className="text-slate-400 mb-2" size={20} strokeWidth={1.5} />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Pages</span>
          <span className="text-lg font-bold text-slate-900">-</span>
          <span className="text-[10px] text-slate-400">Approx.</span>
        </div>
        <div className="flex flex-col items-center text-center">
          <HardDrive className="text-slate-400 mb-2" size={20} strokeWidth={1.5} />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Size</span>
          <span className="text-lg font-bold text-slate-900">{totalSize > 0 ? formatFileSize(totalSize) : '0 B'}</span>
          <span className="text-[10px] text-slate-400">Total size</span>
        </div>
      </div>
    </div>
  )
}
