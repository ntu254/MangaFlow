import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { Chapter } from "@/features/chapters/services/chapter.api"
import { useChapterPages } from "@/features/chapters/hooks/useChapterWorkspace"
import { DataTable, type DataTableColumn } from '@/shared/components/ui/data-table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { labelizeStatus } from "@/shared/utils/formatters"
import { ExternalLink, Lock, CheckCircle2, CircleDashed } from "lucide-react"

interface PagesTabProps {
  seriesId: string
  chapters: Chapter[]
}

export function PagesTab({ seriesId, chapters }: PagesTabProps) {
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

  const columns: DataTableColumn<any>[] = [
    {
      header: 'PAGE',
      className: 'w-[15%]',
      cell: (page) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-14 bg-slate-100 rounded border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
            {/* Mock Thumbnail */}
            <span className="text-[10px] font-bold text-slate-300">P.{page.pageNumber}</span>
          </div>
          <span className="text-[14px] font-bold text-slate-900">Page {page.pageNumber}</span>
        </div>
      )
    },
    {
      header: 'STATUS',
      className: 'w-[15%]',
      cell: (page) => (
        <span className="text-[12px] font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
          {labelizeStatus(page.status)}
        </span>
      )
    },
    {
      header: 'TASK LOCK STATUS',
      className: 'w-[35%]',
      cell: (page) => {
        const activeTask = page.activeTask;

        if (activeTask?.status === 'IN_PROGRESS') {
          return (
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-[12px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded w-fit">
                <Lock size={12} /> Locked: {activeTask.assignedTo?.name || 'Assistant'} is working
              </span>
              <span className="text-[11px] text-slate-500 font-medium px-2">Task: {activeTask.taskType?.name || 'Unknown'}</span>
            </div>
          )
        }
        if (activeTask?.status === 'SUBMITTED') {
          return (
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-[12px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                <Lock size={12} /> Submitted: waiting Mangaka review
              </span>
              <span className="text-[11px] text-slate-500 font-medium px-2">Task: {activeTask.taskType?.name || 'Unknown'}</span>
            </div>
          )
        }
        if (activeTask?.status === 'TODO') {
          return (
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-[12px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded w-fit">
                <Lock size={12} /> Assigned / Not started
              </span>
              <span className="text-[11px] text-slate-500 font-medium px-2">Task: {activeTask.taskType?.name || 'Unknown'}</span>
            </div>
          )
        }
        if (activeTask?.status === 'REVISION_REQUESTED') {
          return (
             <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-[12px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded w-fit">
                <Lock size={12} /> Revision requested
              </span>
              <span className="text-[11px] text-slate-500 font-medium px-2">Task: {activeTask.taskType?.name || 'Unknown'}</span>
            </div>
          )
        }
        if (activeTask?.status === 'MANGAKA_APPROVED') {
          return (
             <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit">
                <Lock size={12} /> Waiting Editor final review
              </span>
              <span className="text-[11px] text-slate-500 font-medium px-2">Task: {activeTask.taskType?.name || 'Unknown'}</span>
            </div>
          )
        }

        if (page.status === 'APPROVED' || page.status === 'UPLOADED') {
          return (
            <span className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit">
              <CheckCircle2 size={12} /> Ready / Completed
            </span>
          )
        }
        return (
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded w-fit border border-slate-200">
            <CircleDashed size={12} /> Available
          </span>
        )
      }
    },
    {
      header: 'ASSIGNEE',
      className: 'w-[15%]',
      cell: (page) => {
        if (page.activeTask?.assignedTo) {
          const name = page.activeTask.assignedTo.name;
          const initial = name.charAt(0).toUpperCase();
          return (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold">{initial}</div>
              <span className="text-[12px] font-medium text-slate-700">{name}</span>
            </div>
          )
        }
        return <span className="text-[12px] text-slate-400">Unassigned</span>
      }
    },
    {
      header: 'ACTIONS',
      className: 'text-right w-[20%]',
      cell: (page) => (
        <div className="flex justify-end">
          <button 
            onClick={() => navigate(`/app/mangaka/series/${seriesId}/pages/${page.id}`)}
            className="flex items-center gap-2 px-4 h-8 bg-violet-600 text-white hover:bg-violet-700 font-bold text-[12px] rounded-lg transition-colors shadow-sm"
          >
            Page Studio <ExternalLink size={14} />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Pages</h3>
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-medium text-slate-500">Select Chapter:</span>
          <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
            <SelectTrigger className="w-[200px] h-9 bg-white">
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
        <DataTable
          data={pages}
          columns={columns}
          loading={pagesLoading}
          rowKey={(p) => p.id}
          className="border-0 rounded-none bg-transparent"
        />
      </div>
    </div>
  )
}