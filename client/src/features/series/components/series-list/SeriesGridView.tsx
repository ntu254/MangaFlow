import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import coverMock from '@/assets/image-mangaka.webp'
import type { SeriesViewModel } from './series-view-model'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'In Production': return { text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', fill: 'bg-purple-600' };
    case 'Editor Review': return { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', fill: 'bg-orange-500' };
    case 'Board Review': return { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', fill: 'bg-rose-600' };
    case 'Approved': return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', fill: 'bg-emerald-600' };
    case 'Ready': return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', fill: 'bg-green-600' };
    case 'At Risk': return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', fill: 'bg-red-600' };
    case 'Hiatus': return { text: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-300', fill: 'bg-gray-500' };
    default: return { text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', fill: 'bg-purple-600' };
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
          const colors = getStatusColor(series.status);

          return (
            <div
              key={series.id}
              tabIndex={0}
              onClick={() => navigate(`/app/mangaka/series/${series.id}`)}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col group hover:shadow-md hover:-translate-y-[2px] hover:border-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 transition-all cursor-pointer relative"
            >

              {/* Cover */}
              <div className="relative w-full h-32 bg-slate-100 overflow-hidden shrink-0 border-b border-slate-100">
                <div className="absolute inset-0 bg-gradient-to-b from-black/25 to-transparent z-10 pointer-events-none"></div>
                <img src={coverMock} alt={series.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 z-20">
                  <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] font-bold border shadow-sm backdrop-blur-md bg-white/95 ${colors.text} ${colors.border}`}>
                    {series.status}
                  </span>
                </div>
              </div>

              <div className="p-4 flex flex-col flex-1">
                {/* Title & Genre */}
                <h3 className="text-[16px] font-bold text-slate-900 leading-tight mb-2 truncate group-hover:text-indigo-600 transition-colors">{series.title}</h3>

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
                    <span className={`text-[11px] font-bold ${colors.text}`}>{series.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-1.5 rounded-full ${colors.fill}`} style={{ width: `${series.progress}%` }}></div>
                  </div>
                </div>

                {/* Next Action Area */}
                <div className="mt-auto pt-4 border-t border-slate-100">
                  <div className="flex flex-col gap-1 mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${colors.fill}`}></div>
                      Next Action
                    </span>
                    <span
                      className="text-[13px] font-bold text-indigo-600 leading-snug hover:underline cursor-pointer inline-block w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Direct action navigation could go here
                      }}
                    >
                      {series.nextMilestone.name}
                    </span>
                  </div>

                  <button
                    className="w-full h-9 bg-white border-2 border-slate-200 group-hover:border-indigo-300 group-hover:bg-indigo-50 text-slate-700 group-hover:text-indigo-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
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
