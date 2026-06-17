import { DataTable, type DataTableColumn } from '@/shared/components/ui/data-table'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { seriesStatusUi } from '@/shared/lib/status-ui'
import { ExternalLink, UploadCloud, Plus } from 'lucide-react'
import type { Chapter } from '@/features/chapters/services/chapter.api'

interface ChaptersTabProps {
  chapters: Chapter[]
}

const getStatusConfig = (status: string) => {
  const s = status.toUpperCase().replace(' ', '_')
  if (seriesStatusUi[s]) return seriesStatusUi[s]
  return seriesStatusUi['DRAFT']
}

export function ChaptersTab({ chapters }: ChaptersTabProps) {
  const sortedChapters = [...chapters].sort((a, b) => b.chapterNumber - a.chapterNumber)

  const columns: DataTableColumn<Chapter>[] = [
    {
      header: 'CHAPTER',
      className: 'w-[20%]',
      cell: (chapter) => (
        <div className="flex flex-col">
          <span className="text-[14px] font-bold text-slate-900">
            Chapter {chapter.chapterNumber}
          </span>
          <span className="text-[12px] text-slate-500">
            {chapter.title}
          </span>
        </div>
      )
    },
    {
      header: 'STATUS',
      className: 'w-[15%]',
      cell: (chapter) => <StatusBadge config={getStatusConfig(chapter.status)} size="sm" />
    },
    {
      header: 'PRODUCTION',
      className: 'w-[25%]',
      cell: (chapter) => {
        // Mocking progress for now since we don't have exact pages count per chapter in this model directly
        // In real app, we'd calculate from pages array
        const isDraft = chapter.status === 'DRAFT'
        return (
          <div className="flex flex-col gap-1.5 w-[80%]">
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className="text-slate-600">{isDraft ? '0 Pages' : '24 Pages'}</span>
              <span className={isDraft ? 'text-slate-400' : 'text-violet-600'}>{isDraft ? '0%' : '100%'}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${isDraft ? 'bg-transparent' : 'bg-violet-500'}`} 
                style={{ width: isDraft ? '0%' : '100%' }}
              />
            </div>
          </div>
        )
      }
    },
    {
      header: 'READINESS',
      className: 'w-[20%]',
      cell: (chapter) => {
        const isReady = chapter.status === 'READY_FOR_PUBLICATION' || chapter.status === 'PUBLISHED'
        if (isReady) {
          return <span className="text-[12px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Ready to Publish</span>
        }
        return (
          <div className="flex flex-col">
             <span className="text-[12px] font-medium text-slate-600">Not ready</span>
             <span className="text-[10px] text-slate-400">Missing final review</span>
          </div>
        )
      }
    },
    {
      header: 'ACTIONS',
      className: 'text-right w-[20%]',
      cell: () => (
        <div className="flex items-center justify-end gap-2">
          <button className="flex items-center gap-1.5 px-3 h-8 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold text-[12px] rounded-lg transition-colors">
            <UploadCloud size={14} /> Upload
          </button>
          <button className="flex items-center gap-1.5 px-3 h-8 bg-white border border-violet-200 text-violet-600 hover:bg-violet-50 font-bold text-[12px] rounded-lg transition-colors">
            Pages <ExternalLink size={14} />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Chapters</h3>
        <button className="flex items-center gap-2 bg-slate-900 text-white h-9 px-4 rounded-lg text-sm font-semibold shadow-sm hover:bg-slate-800 transition-colors">
          <Plus size={16} /> New Chapter
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
        <DataTable
          data={sortedChapters}
          columns={columns}
          rowKey={(c) => c.id}
          className="border-0 rounded-none bg-transparent"
        />
      </div>
    </div>
  )
}
