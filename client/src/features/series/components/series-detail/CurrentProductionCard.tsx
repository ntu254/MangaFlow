import { ExternalLink, RefreshCw } from 'lucide-react'
import { seriesDetailStats } from '../../constants/series-detail'
import coverMock from '@/assets/image-mangaka.webp'

export function CurrentProductionCard() {
  const { currentManuscript } = seriesDetailStats;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col">
      
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
        <h3 className="text-[15px] font-bold text-gray-900">Current Production</h3>
        <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md text-[10px] font-bold border border-amber-200 uppercase tracking-wider">
          {currentManuscript.status}
        </span>
      </div>

      {/* Manuscript Section */}
      <div className="flex gap-4 mb-5">
        <div className="w-[60px] h-[80px] rounded-lg overflow-hidden shrink-0 shadow-sm border border-gray-200">
          <img src={coverMock} alt="Cover" className="w-full h-full object-cover" />
        </div>

        <div className="flex flex-col flex-1 justify-center">
          <h4 className="text-[14px] font-bold text-gray-900 leading-tight mb-0.5">{currentManuscript.title}</h4>
          <span className="text-[11px] text-gray-500 font-medium mb-2">Version v3</span>

          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-gray-500">Pages {currentManuscript.pages.current} / {currentManuscript.pages.total}</span>
            <span className="text-[10px] font-bold text-gray-700">{Math.round((currentManuscript.pages.current / currentManuscript.pages.total) * 100)}%</span>
          </div>
          
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(currentManuscript.pages.current / currentManuscript.pages.total) * 100}%` }}></div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2.5 mt-2">
        <button className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-[12px] shadow-sm">
          <ExternalLink size={14} className="text-gray-400" />
          Open Production
        </button>
        <button className="w-full bg-rose-50/30 border border-rose-300 hover:bg-rose-50 text-rose-600 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-[12px] shadow-sm">
          <RefreshCw size={14} className="text-rose-500" />
          Request Revision
        </button>
      </div>

    </div>
  )
}
