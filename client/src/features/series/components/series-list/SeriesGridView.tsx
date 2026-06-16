import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import coverMock from '@/assets/image-mangaka.webp'
import type { SeriesViewModel } from './series-view-model'

import { seriesStatusUi, type StatusUiConfig } from '@/shared/lib/status-ui'
import { StatusBadge } from '@/shared/components/ui/status-badge'

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

// Map status to progress bar color
const getFillColor = (tone: string) => {
  switch (tone) {
    case 'emerald': return 'bg-emerald-500';
    case 'purple': return 'bg-purple-500';
    case 'amber': return 'bg-amber-500';
    case 'red': return 'bg-red-500';
    case 'blue': return 'bg-blue-500';
    default: return 'bg-slate-500';
  }
}

const getTextColor = (tone: string) => {
  switch (tone) {
    case 'emerald': return 'text-emerald-600';
    case 'purple': return 'text-purple-600';
    case 'amber': return 'text-amber-600';
    case 'red': return 'text-red-600';
    case 'blue': return 'text-blue-600';
    default: return 'text-slate-600';
  }
}

interface SeriesGridViewProps {
  seriesData: SeriesViewModel[];
}

export function SeriesGridView({ seriesData }: SeriesGridViewProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
        {seriesData.map((series) => {
          const config = getStatusConfig(series.status);
          const fillColor = getFillColor(config.tone);
          const textColor = getTextColor(config.tone);

          return (
            <div
              key={series.id}
              tabIndex={0}
              onClick={() => navigate(`/app/mangaka/series/${series.id}`)}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col group hover:shadow-md hover:-translate-y-[2px] hover:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 transition-all cursor-pointer relative"
            >

              {/* Cover */}
              <div className="relative w-full h-32 bg-slate-100 overflow-hidden shrink-0 border-b border-slate-100">
                <div className="absolute inset-0 bg-gradient-to-b from-black/25 to-transparent z-10 pointer-events-none"></div>
                <img src={coverMock} alt={series.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 z-20">
                  <StatusBadge config={config} size="sm" showIcon={true} className="shadow-sm backdrop-blur-md bg-white/95" />
                </div>
              </div>

              <div className="p-4 flex flex-col flex-1">
                {/* Title & Genre */}
                <h3 className="text-[16px] font-bold text-slate-900 leading-tight mb-2 truncate group-hover:text-violet-600 transition-colors">{series.title}</h3>

                <div className="flex items-center flex-wrap gap-1.5 mb-3">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold border border-slate-200">{series.type}</span>
                  {series.genres.map((g: string) => (
                    <span key={g} className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-full text-[10px] font-semibold border border-slate-100">{g}</span>
                  ))}
                </div>

                <p className="text-[12px] text-slate-500 line-clamp-2 mb-4 leading-relaxed min-h-[36px]">
                  {series.description}
                </p>

                {/* Grid Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chapters</span>
                    <span className="text-[13px] font-bold text-slate-900">{series.chapters}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pages</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[13px] font-bold text-slate-900">{series.pages}</span>
                      <span className="text-[11px] font-medium text-slate-400">/ {series.totalPages}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progress</span>
                    <span className={`text-[11px] font-bold ${textColor}`}>{series.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-1.5 rounded-full ${fillColor}`} style={{ width: `${series.progress}%` }}></div>
                  </div>
                </div>

                {/* Next Action Area */}
                <div className="mt-auto pt-4 border-t border-slate-100">
                  <div className="flex flex-col gap-1 mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${fillColor}`}></div>
                      Next Action
                    </span>
                    <span
                      className="text-[13px] font-bold text-violet-600 leading-snug hover:underline cursor-pointer inline-block w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Direct action navigation could go here
                      }}
                    >
                      {series.nextMilestone.name}
                    </span>
                  </div>

                  <button
                    className="w-full h-9 bg-white border-2 border-slate-200 group-hover:border-violet-300 group-hover:bg-violet-50 text-slate-700 group-hover:text-violet-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
                    tabIndex={-1} // Handled by parent card focus
                  >
                    Open Series
                    <ArrowRight size={14} />
                  </button>
                </div>

              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
