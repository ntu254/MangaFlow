import { useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UploadCloud, File, Download, Eye, MoreVertical, FileText, FileImage, FileArchive } from 'lucide-react'
import type { SeriesSummary, SeriesSummaryManuscript } from '@/features/series/services/series.api'
import { useUploadSeriesFile } from '@/features/series/hooks/useCreateSeries'

export function ManuscriptTab({ summary }: { summary: SeriesSummary }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const upload = useUploadSeriesFile()
  const [selectedId, setSelectedId] = useState(summary.currentManuscript?.id ?? summary.manuscripts[0]?.id ?? '')

  const selected = useMemo(
    () => summary.manuscripts.find((item) => item.id === selectedId) ?? summary.currentManuscript ?? summary.manuscripts[0] ?? null,
    [selectedId, summary.currentManuscript, summary.manuscripts],
  )
  const selectedFile = selected?.file

  const handleUpload = async (file: File | undefined) => {
    if (!file) return
    if (!summary.allowedActions.canUploadManuscript) {
      toast.error('You cannot upload manuscript for this series yet')
      return
    }

    try {
      await upload.mutateAsync({ seriesId: summary.series.id, file })
      toast.success('File uploaded successfully')
      await queryClient.invalidateQueries({ queryKey: ['series', summary.series.id, 'summary'] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload file')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col w-full h-full">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.zip,.jpg,.jpeg,.png,.webp"
        onChange={(event) => void handleUpload(event.target.files?.[0])}
      />

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-4">
          <div className="flex flex-col gap-2 mb-2">
            <h3 className="text-[14px] font-extrabold text-gray-900 uppercase tracking-wider">Manuscript Versions</h3>
            <p className="text-[12px] text-gray-500 leading-relaxed pr-4">Each time you revise and resubmit, a new version will be created.</p>
            <button
              className="mt-2 w-full bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-[13px] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={upload.isPending || !summary.allowedActions.canUploadManuscript}
              onClick={() => inputRef.current?.click()}
            >
              <UploadCloud size={16} /> {upload.isPending ? 'Uploading...' : 'Upload New Version'}
            </button>
          </div>

          {summary.manuscripts.map((manuscript, index) => (
            <VersionCard
              key={manuscript.id}
              manuscript={manuscript}
              isCurrent={manuscript.id === summary.currentManuscript?.id}
              isSelected={manuscript.id === selected?.id}
              pages={summary.chapterSummary.totalPages}
              feedbackCount={summary.commentSummary.open}
              onSelect={() => setSelectedId(manuscript.id)}
              isLast={index === summary.manuscripts.length - 1}
            />
          ))}

          {summary.manuscripts.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-[13px] font-medium text-gray-500">
              No manuscript has been uploaded yet.
            </div>
          )}

          <span className="text-[12px] font-medium text-gray-500 text-center mt-2">Showing {summary.manuscripts.length === 0 ? 0 : 1} to {summary.manuscripts.length} of {summary.manuscripts.length} versions</span>
        </div>

        <div className="flex-1 w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
          <div className="flex justify-between items-start pb-6 border-b border-gray-100 mb-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h2 className="text-[20px] font-extrabold text-gray-900 uppercase tracking-tight">PROPOSAL V{selected?.version ?? '-'}</h2>
                {selected?.id === summary.currentManuscript?.id && <span className="bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-md text-[11px] font-bold border border-emerald-100">Current</span>}
                <span className="bg-purple-50 text-purple-600 px-2.5 py-0.5 rounded-md text-[11px] font-bold border border-purple-100">{labelize(selected?.status ?? summary.series.status)}</span>
              </div>
              <span className="text-[13px] font-medium text-gray-500">Submitted {formatDateTime(selected?.createdAt ?? summary.series.createdAt)} by {selected?.uploadedBy?.name ?? summary.owner?.name ?? 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold px-4 py-2 rounded-lg text-[13px] flex items-center gap-2 transition-colors border border-purple-100">
                <Eye size={16} /> Preview All Files
              </button>
              <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-8">
            <SummaryStat value={selectedFile ? 1 : 0} label="Files" />
            <SummaryStat value={summary.chapterSummary.totalPages} label="Pages (Approx.)" />
            <SummaryStat value={formatBytes(selectedFile?.size ?? 0)} label="Total Size" />
            <SummaryStat value={Math.max((selected?.version ?? 1) - 1, 0)} label="Revision Round" />
          </div>

          <h3 className="text-[14px] font-bold text-gray-900 mb-4">Files in this version</h3>

          <div className="overflow-x-auto mb-8 border border-gray-200 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">File Name</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Pages</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Size</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Uploaded At</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedFile ? (
                  <FileRow
                    icon={fileIcon(selectedFile.mimeType)}
                    name={selectedFile.originalName}
                    type={selectedFile.mimeType}
                    typeColor={fileBadgeColor(selectedFile.mimeType)}
                    pages={summary.chapterSummary.totalPages || '-'}
                    size={formatBytes(selectedFile.size)}
                    date={formatDate(selectedFile.createdAt)}
                    time={formatTime(selectedFile.createdAt)}
                    isLast
                  />
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 px-4 text-center text-[13px] font-medium text-gray-500">
                      No file available for this version.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-6 flex items-center justify-between mt-auto">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 shadow-sm shrink-0">
                <UploadCloud size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-gray-900">Upload Supporting File</span>
                <span className="text-[12px] font-medium text-gray-500">You can upload additional supporting files for this version.</span>
              </div>
            </div>
            <button
              className="bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 font-bold px-5 py-2 rounded-lg text-[13px] transition-colors shadow-sm whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={upload.isPending || !summary.allowedActions.canUploadManuscript}
              onClick={() => inputRef.current?.click()}
            >
              {upload.isPending ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function VersionCard({
  manuscript,
  isCurrent,
  isSelected,
  pages,
  feedbackCount,
  onSelect,
  isLast,
}: {
  manuscript: SeriesSummaryManuscript
  isCurrent: boolean
  isSelected: boolean
  pages: number
  feedbackCount: number
  onSelect: () => void
  isLast: boolean
}) {
  const revisionRound = Math.max(manuscript.version - 1, 0)

  return (
    <div
      className={`${isSelected ? 'bg-white rounded-xl shadow-sm border-2 border-purple-200 p-4 flex flex-col cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden' : 'bg-white rounded-xl border border-gray-200 p-4 flex flex-col cursor-pointer hover:border-purple-200 hover:shadow-sm transition-all'} ${!isCurrent && isLast ? 'opacity-80' : ''}`}
      onClick={onSelect}
    >
      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>}
      <div className="flex items-center gap-2 mb-3">
        <span className={`${isCurrent ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'} px-2 py-0.5 rounded text-[10px] font-bold border`}>
          {isCurrent ? 'Current' : labelize(manuscript.status)}
        </span>
      </div>
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-extrabold text-gray-900">Proposal v{manuscript.version}</span>
          <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-100">{labelize(manuscript.status)}</span>
        </div>
        <button className="text-gray-400 hover:text-gray-900"><MoreVertical size={16} /></button>
      </div>
      <span className="text-[12px] font-medium text-gray-500 mb-4">Submitted {formatDate(manuscript.createdAt)} - Revision Round {revisionRound}</span>

      <div className="flex items-center gap-4 text-[12px] font-bold text-gray-600 mb-4">
        <div className="flex items-center gap-1.5"><File size={14} /> {manuscript.file ? 1 : 0} Files</div>
        <div className="flex items-center gap-1.5"><FileText size={14} /> {pages || '-'} Pages (Approx.)</div>
        <div className="flex items-center gap-1.5"><FileArchive size={14} /> {formatBytes(manuscript.file?.size ?? 0)}</div>
      </div>

      {!isCurrent && (
        <div className="flex gap-2">
          <button className="flex-1 bg-white border border-purple-200 text-purple-600 hover:bg-purple-50 font-bold py-2 rounded-lg text-[11px] transition-colors">
            View Feedback ({feedbackCount})
          </button>
          <button className="flex-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-2 rounded-lg text-[11px] transition-colors">
            Compare with Current
          </button>
        </div>
      )}
    </div>
  )
}

function SummaryStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
      <span className="text-[18px] font-extrabold text-gray-900 mb-1">{value}</span>
      <span className="text-[11px] font-bold text-gray-500">{label}</span>
    </div>
  )
}

function FileRow({ icon, name, type, typeColor, pages, size, date, time, isLast }: any) {
  const badgeColors: Record<string, string> = {
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    fuchsia: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
  }

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${!isLast ? 'border-b border-gray-100' : ''}`}>
      <td className="py-4 px-4 flex items-center gap-3">
        <div className="bg-white border border-gray-100 p-1.5 rounded w-8 h-8 flex items-center justify-center shadow-sm">
          {icon}
        </div>
        <span className="text-[13px] font-bold text-gray-900 hover:text-purple-600 cursor-pointer transition-colors truncate max-w-[200px]" title={name}>{name}</span>
      </td>
      <td className="py-4 px-4">
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${badgeColors[typeColor] || badgeColors.purple}`}>
          {type}
        </span>
      </td>
      <td className="py-4 px-4 text-center">
        <span className="text-[13px] font-medium text-gray-600">{pages}</span>
      </td>
      <td className="py-4 px-4 text-right">
        <span className="text-[13px] font-medium text-gray-600">{size}</span>
      </td>
      <td className="py-4 px-4">
        <div className="flex flex-col">
          <span className="text-[13px] font-medium text-gray-900">{date}</span>
          <span className="text-[11px] font-medium text-gray-500">{time}</span>
        </div>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center justify-end gap-2">
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
            <Eye size={16} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
            <Download size={16} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}

function fileIcon(mimeType: string) {
  if (mimeType.includes('zip')) return <FileArchive size={16} className="text-blue-500" />
  if (mimeType.includes('image')) return <FileImage size={16} className="text-emerald-500" />
  return <FileText size={16} className="text-red-500" />
}

function fileBadgeColor(mimeType: string) {
  if (mimeType.includes('zip')) return 'blue'
  if (mimeType.includes('image')) return 'emerald'
  return 'purple'
}

function labelize(value: string) {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 MB'
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
