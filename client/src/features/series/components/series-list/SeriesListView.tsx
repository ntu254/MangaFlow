import { MoreVertical, Info, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import coverMock from '@/assets/image-mangaka.webp'
import type { SeriesViewModel } from './series-view-model'

const getStatusTheme = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes('editor')) return { dot: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', snapshot: 'bg-[#F8F9FE]' };
  if (s.includes('board')) return { dot: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', snapshot: 'bg-[#FFF9F5]' };
  if (s.includes('production') || s.includes('ongoing') || s.includes('approved')) return { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', snapshot: 'bg-[#F6FDF9]' };
  if (s.includes('risk')) return { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', snapshot: 'bg-[#FFFDF5]' };
  if (s.includes('draft')) return { dot: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', snapshot: 'bg-gray-50' };
  return { dot: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', snapshot: 'bg-gray-50' };
}

const getStageNodes = (status: string) => {
  const nodes = ['Draft', 'Submitted', 'Editor Review', 'Board Review', 'Decision'];
  let activeIndex = -1;
  const s = status.toLowerCase();
  
  if (s.includes('draft')) activeIndex = 0;
  else if (s.includes('submit')) activeIndex = 1;
  else if (s.includes('editor')) activeIndex = 2;
  else if (s.includes('board')) activeIndex = 3;
  else if (s.includes('production') || s.includes('risk') || s.includes('approved')) {
    nodes[4] = 'Ongoing';
    activeIndex = 4;
  }
  
  return { nodes, activeIndex };
}

const getSnapshotData = (status: string, series: SeriesViewModel) => {
  const s = status.toLowerCase();
  const hasContent = !s.includes('draft') && !s.includes('submit');
  
  return [
    { 
      label: 'Chapters', 
      value: hasContent ? (series.chapters || '0') : '-', 
      color: 'text-slate-800' 
    },
    { 
      label: 'Pages', 
      value: hasContent ? (series.pages || '0') : '-', 
      icon: <FileText size={14} className="text-slate-400 fill-slate-100" />, 
      color: 'text-slate-800' 
    },
    { 
      label: 'Tasks', 
      value: s.includes('risk') ? '2 Issues' : '5 Open', 
      icon: s.includes('risk') ? <AlertCircle size={14} className="text-red-400 fill-red-100" /> : <CheckCircle2 size={14} className="text-emerald-400 fill-emerald-100" />, 
      color: s.includes('risk') ? 'text-red-600' : 'text-emerald-600' 
    }
  ];
}

interface SeriesListViewProps {
  seriesData: SeriesViewModel[];
}

export function SeriesListView({ seriesData }: SeriesListViewProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full">
      {/* Table Header */}
      <div className="grid grid-cols-[280px_1fr_1fr_140px_100px] gap-6 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Series</div>
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status & Stage</div>
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          Series Metrics <Info size={12} className="text-slate-400" />
        </div>
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Last Updated</div>
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right pr-4">Actions</div>
      </div>

      {/* Table Body */}
      <div className="flex flex-col">
        {seriesData.map((series, index) => {
          const theme = getStatusTheme(series.status);
          const { nodes, activeIndex } = getStageNodes(series.status);
          const snapshotItems = getSnapshotData(series.status, series);
          const isLast = index === seriesData.length - 1;

          return (
            <div 
              key={series.id} 
              tabIndex={0}
              className={`grid grid-cols-[280px_1fr_1fr_140px_100px] gap-6 px-6 py-5 items-center bg-white hover:bg-slate-50/80 transition-all ${!isLast ? 'border-b border-slate-100' : ''} hover:-translate-y-px hover:shadow-sm hover:z-10 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-inset`}
            >
              
              {/* Column 1: Series Identity */}
              <div className="flex items-center gap-4">
                <div 
                  className="w-[52px] h-[72px] rounded overflow-hidden shrink-0 shadow-sm border border-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600" 
                  tabIndex={0}
                  onClick={() => navigate(`/app/mangaka/series/${series.id}`)}
                >
                  <img src={coverMock} alt={series.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex flex-col min-w-0">
                  <h2 
                    className="text-[15px] font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors truncate mb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded" 
                    tabIndex={0}
                    onClick={() => navigate(`/app/mangaka/series/${series.id}`)}
                  >
                    {series.title}
                  </h2>
                  <div className="flex items-center flex-wrap gap-1.5 mt-1">
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[9px] font-bold border border-slate-200">{series.type}</span>
                    {series.genres.map((g: string) => (
                      <span key={g} className="px-1.5 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[9px] font-semibold border border-slate-100">{g}</span>
                    ))}
                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-bold ml-1">v1.0</span>
                  </div>
                </div>
              </div>

              {/* Column 2: Status & Stage */}
              <div className="flex flex-col pr-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${theme.bg} ${theme.text} ${theme.border}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${theme.dot}`}></div>
                    {series.status === 'In Production' ? 'Ongoing' : series.status}
                  </div>
                </div>
                <div className="text-[11px] font-bold text-slate-700 mb-2">
                  Stage: {series.status === 'In Production' ? `Chapter ${series.chapters} Production` : series.status}
                </div>
                {/* Progress Nodes */}
                <div className="flex items-center w-full max-w-[240px] relative">
                  <div className="absolute top-1.5 left-1 right-1 h-0.5 bg-slate-200 z-0"></div>
                  <div className="flex justify-between w-full z-10">
                    {nodes.map((node, i) => (
                      <div key={node} className="flex flex-col items-center gap-1 relative group cursor-help">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 ${i <= activeIndex ? (i === activeIndex ? theme.dot + ' border-white shadow-sm ring-2 ring-offset-1 ring-' + theme.dot.split('-')[1] + '-400' : 'bg-emerald-500 border-white') : 'bg-white border-slate-300'}`}></div>
                        <div className="absolute bottom-6 opacity-0 group-hover:opacity-100 whitespace-nowrap bg-slate-800 text-white text-[10px] font-medium py-1 px-2 rounded shadow-md pointer-events-none transition-opacity z-20">
                          {node}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 3: Snapshot */}
              <div className="flex items-center w-full">
                <div 
                  className={`grid gap-3 px-5 py-3.5 rounded-xl w-full ${theme.snapshot}`}
                  style={{ gridTemplateColumns: `repeat(${snapshotItems.length}, minmax(0, 1fr))` }}
                >
                  {snapshotItems.map((item, i) => (
                    <div key={i} className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 mb-1 whitespace-nowrap">
                        {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                        {item.label}
                      </span>
                      <span className={`text-[13px] font-bold ${item.color} leading-none truncate`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 4: Last Updated */}
              <div className="flex flex-col justify-center">
                <span className="text-[13px] font-semibold text-slate-900">{series.updatedAt}</span>
              </div>

              {/* Column 5: Actions */}
              <div className="flex items-center justify-end gap-2 pr-2">
                <button 
                  onClick={() => navigate(`/app/mangaka/series/${series.id}`)}
                  className="px-4 h-8 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold text-[11px] rounded-lg transition-colors"
                >
                  {series.status.includes('Review') || series.status.includes('Risk') ? 'View' : 'Continue'}
                </button>
                <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}
