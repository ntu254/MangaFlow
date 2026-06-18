import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { Chapter } from "@/features/chapters/services/chapter.api"
import { useChapterPages } from "@/features/chapters/hooks/useChapterWorkspace"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { labelizeStatus } from "@/shared/utils/formatters"
import { ExternalLink, Lock, CheckCircle2, CircleDashed } from "lucide-react"

interface PagesTabProps {
  chapters: Chapter[]
}

function renderTaskStatus(page: any) {
  const activeTask = page.activeTask;

  if (activeTask?.status === 'IN_PROGRESS') {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-fit">
          <Lock size={10} /> Locked: {activeTask.assignedTo?.name || 'Assistant'}
        </span>
      </div>
    )
  }
  if (activeTask?.status === 'SUBMITTED') {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit">
          <Lock size={10} /> Submitted for review
        </span>
      </div>
    )
  }
  if (activeTask?.status === 'TODO') {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded w-fit">
          <Lock size={10} /> Not started
        </span>
      </div>
    )
  }
  if (activeTask?.status === 'REVISION_REQUESTED') {
    return (
        <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded w-fit">
          <Lock size={10} /> Revision requested
        </span>
      </div>
    )
  }
  if (activeTask?.status === 'MANGAKA_APPROVED') {
    return (
        <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded w-fit">
          <Lock size={10} /> Awaiting Editor
        </span>
      </div>
    )
  }

  if (page.status === 'APPROVED' || page.status === 'UPLOADED') {
    return (
      <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded w-fit">
        <CheckCircle2 size={10} /> Ready
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded w-fit border border-slate-200">
      <CircleDashed size={10} /> Available
    </span>
  )
}

export function PagesTab({ chapters }: PagesTabProps) {
  const navigate = useNavigate()
  const sortedChapters = useMemo(
    () => [...chapters].sort((a, b) => b.chapterNumber - a.chapterNumber),
    [chapters],
  )
  const [selectedChapterId, setSelectedChapterId] = useState<string | undefined>(sortedChapters[0]?.id)
  const selectedChapter = sortedChapters.find((chapter) => chapter.id === selectedChapterId) ?? sortedChapters[0]
  const { data: pages = [], isLoading: pagesLoading } = useChapterPages(selectedChapter?.id)

  if (!selectedChapter) {
    return <div className="flex h-64 items-center justify-center text-gray-500">No chapters available for this series.</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Pages</h3>
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-medium text-slate-500">Select Chapter:</span>
          <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
            <SelectTrigger className="w-[200px] h-9 bg-white shadow-sm border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortedChapters.map((chapter) => (
                <SelectItem key={chapter.id} value={chapter.id}>
                  Chapter {chapter.chapterNumber} - {chapter.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {pagesLoading ? (
        <div className="flex h-32 items-center justify-center text-slate-500 text-sm">Loading pages...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {pages.map((page) => (
            <div key={page.id} className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-violet-300 hover:shadow-md transition-all">
              <div className="aspect-[1/1.414] bg-slate-50 flex flex-col items-center justify-center relative border-b border-slate-100">
                <span className="text-[32px] font-extrabold text-slate-200">P.{page.pageNumber}</span>
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-10">
                  <button 
                    onClick={() => navigate(`/app/mangaka/pages/${page.id}/studio`)}
                    className="flex items-center gap-2 px-4 h-9 bg-white text-slate-900 font-bold text-[13px] rounded-lg shadow-sm hover:scale-105 hover:bg-violet-50 hover:text-violet-700 transition-all"
                  >
                    Studio <ExternalLink size={14} />
                  </button>
                </div>
              </div>
              <div className="p-3 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-bold text-slate-900">Page {page.pageNumber}</span>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    {labelizeStatus(page.status)}
                  </span>
                </div>
                {renderTaskStatus(page)}
              </div>
            </div>
          ))}
          {pages.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
              No pages uploaded yet for this chapter.
            </div>
          )}
        </div>
      )}
    </div>
  )
}