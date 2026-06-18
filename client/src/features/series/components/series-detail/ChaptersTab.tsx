import { DataTable, type DataTableColumn } from '@/shared/components/ui/data-table'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { seriesStatusUi } from '@/shared/lib/status-ui'
import { ExternalLink, UploadCloud, Plus } from 'lucide-react'
import type { Chapter } from '@/features/chapters/services/chapter.api'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'

interface ChaptersTabProps {
  seriesId: string
  chapters: Chapter[]
}

const getStatusConfig = (status: string) => {
  const s = status.toUpperCase().replace(' ', '_')
  if (seriesStatusUi[s]) return seriesStatusUi[s]
  return seriesStatusUi['DRAFT']
}

export function ChaptersTab({ seriesId, chapters }: ChaptersTabProps) {
  const navigate = useNavigate()
  const sortedChapters = [...chapters].sort((a, b) => b.chapterNumber - a.chapterNumber)
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)

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
          onRowClick={(c) => setSelectedChapter(c)}
          className="border-0 rounded-none bg-transparent"
        />
      </div>

      <Sheet open={!!selectedChapter} onOpenChange={(open) => !open && setSelectedChapter(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col bg-slate-50 border-l border-slate-200">
          {selectedChapter && (
            <>
              <div className="h-32 bg-gradient-to-r from-violet-900 to-purple-900 relative p-6 flex flex-col justify-end">
                <SheetHeader className="text-left text-white relative z-10">
                  <StatusBadge config={getStatusConfig(selectedChapter.status)} size="sm" className="mb-2 w-fit bg-white/20 backdrop-blur border border-white/30 text-white" />
                  <SheetTitle className="text-2xl font-extrabold text-white">Chapter {selectedChapter.chapterNumber}</SheetTitle>
                  <SheetDescription className="text-violet-200 font-medium text-sm">
                    {selectedChapter.title}
                  </SheetDescription>
                </SheetHeader>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</h4>
                    <span className="text-[13px] font-semibold text-slate-900">{selectedChapter.status}</span>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Production</h4>
                    <span className="text-[13px] font-semibold text-slate-900">100% (24 Pages)</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
                <button 
                  onClick={() => navigate(`/app/mangaka/series/${seriesId}/pages`)}
                  className="flex-1 h-12 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  Manage Pages <ExternalLink size={16} />
                </button>
                <button 
                  onClick={() => setSelectedChapter(null)}
                  className="px-6 h-12 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl flex items-center justify-center transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
