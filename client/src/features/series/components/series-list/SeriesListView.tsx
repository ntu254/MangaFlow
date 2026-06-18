import { MoreVertical, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import coverMock from '@/assets/image-mangaka.webp'
import type { SeriesViewModel } from './series-view-model'

import { seriesStatusUi, type StatusUiConfig } from '@/shared/lib/status-ui'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { DataTable, type DataTableColumn } from '@/shared/components/ui/data-table'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'

const getStatusConfig = (status: string): StatusUiConfig => {
  const s = status.toUpperCase().replace(' ', '_');
  if (seriesStatusUi[s]) return seriesStatusUi[s];
  if (s === 'IN_PRODUCTION') return seriesStatusUi['ONGOING'];
  if (s === 'SUBMITTED') return seriesStatusUi['EDITOR_REVIEW'];
  if (s === 'AT_RISK') return { ...seriesStatusUi['CANCELLED'], label: 'At Risk' };
  if (s === 'APPROVED') return seriesStatusUi['ONGOING'];
  if (s === 'READY') return seriesStatusUi['ONGOING'];
  return seriesStatusUi['DRAFT'];
}

interface SeriesListViewProps {
  seriesData: SeriesViewModel[];
  isLoading?: boolean;
}

export function SeriesListView({ seriesData, isLoading }: SeriesListViewProps) {
  const navigate = useNavigate();
  const [selectedSeries, setSelectedSeries] = useState<SeriesViewModel | null>(null);

  const columns: DataTableColumn<SeriesViewModel>[] = [
    {
      header: 'SERIES',
      className: 'w-[30%]',
      cell: (series) => (
        <div className="flex items-center gap-4">
          <div 
            className="w-10 h-14 rounded overflow-hidden shrink-0 shadow-sm border border-slate-200 cursor-pointer" 
            onClick={() => navigate(`/app/mangaka/series/${series.id}`)}
          >
            <img src={coverMock} alt={series.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col min-w-0">
            <h2 
              className="text-[14px] font-bold text-slate-900 cursor-pointer hover:text-violet-600 transition-colors truncate" 
              onClick={() => navigate(`/app/mangaka/series/${series.id}`)}
            >
              {series.title}
            </h2>
            <div className="flex items-center flex-wrap gap-1 mt-1">
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold border border-slate-200">{series.type}</span>
              <span className="px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded text-[10px] font-bold">v1.0</span>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'STATUS',
      className: 'w-[15%]',
      cell: (series) => <StatusBadge config={getStatusConfig(series.status)} size="sm" showIcon={true} />
    },
    {
      header: 'PROGRESS',
      className: 'w-[20%]',
      cell: (series) => {
        const isDraft = series.status.toLowerCase().includes('draft');
        return (
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-slate-700">
              {isDraft ? '-' : `${series.chapters} Chapters`}
            </span>
            {!isDraft && (
              <span className="text-[11px] text-slate-500">{series.pages} Pages</span>
            )}
          </div>
        )
      }
    },
    {
      header: 'LAST UPDATED',
      className: 'w-[15%]',
      cell: (series) => (
        <span className="text-[13px] text-slate-600">
          {series.updatedAt}
        </span>
      )
    },
    {
      header: 'ACTIONS',
      className: 'text-right w-[20%]',
      cell: (series) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={() => navigate(`/app/mangaka/series/${series.id}`)}
            className="flex items-center gap-1.5 px-3 h-8 bg-white border border-violet-200 text-violet-600 hover:bg-violet-50 font-bold text-[12px] rounded-lg transition-colors"
          >
            Open Hub <ExternalLink size={14} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <MoreVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/app/mangaka/series/${series.id}`)}>
                View Details
              </DropdownMenuItem>
              {/* Other actions could go here */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ]

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
        <DataTable
          data={seriesData}
          columns={columns}
          loading={isLoading}
          rowKey={(s) => s.id}
          onRowClick={(s) => setSelectedSeries(s)}
          className="border-0 rounded-none bg-transparent"
        />
      </div>

      <Sheet open={!!selectedSeries} onOpenChange={(open) => !open && setSelectedSeries(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col bg-slate-50 border-l border-slate-200">
          {selectedSeries && (
            <>
              <div className="h-40 bg-gradient-to-r from-violet-900 to-purple-900 relative p-6 flex flex-col justify-end">
                <SheetHeader className="text-left text-white relative z-10">
                  <StatusBadge config={getStatusConfig(selectedSeries.status)} size="sm" showIcon className="mb-2 w-fit bg-white/20 backdrop-blur border border-white/30 text-white" />
                  <SheetTitle className="text-2xl font-extrabold text-white">{selectedSeries.title}</SheetTitle>
                  <SheetDescription className="text-violet-200 font-medium text-sm">
                    {selectedSeries.type} • {selectedSeries.chapters} Chapters • {selectedSeries.pages} Pages
                  </SheetDescription>
                </SheetHeader>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Synopsis</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    A short synopsis of the series goes here. This would typically be fetched from the API as part of the series details.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Updated</h4>
                    <span className="text-[13px] font-semibold text-slate-900">{selectedSeries.updatedAt}</span>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Phase</h4>
                    <span className="text-[13px] font-semibold text-slate-900">{selectedSeries.status}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border-t border-slate-100 flex flex-col gap-3">
                <button 
                  onClick={() => navigate(`/app/mangaka/series/${selectedSeries.id}`)}
                  className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  Open Production Hub <ExternalLink size={16} />
                </button>
                <button 
                  onClick={() => setSelectedSeries(null)}
                  className="w-full h-10 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl flex items-center justify-center transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
