import { Info } from 'lucide-react'

export function CurrentChapterProgress() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col p-5">
      <h2 className="text-sm font-bold text-gray-900 mb-5">Current Chapter Progress</h2>
      
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-700">Pages Uploaded</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-900">72%</span>
              <span className="text-[10px] text-gray-500 w-10 text-right font-medium">86 / 120</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '72%' }}></div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-700">Tasks Approved</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-900">68%</span>
              <span className="text-[10px] text-gray-500 w-10 text-right font-medium">19 / 28</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '68%' }}></div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-700">Comments Resolved</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-900">60%</span>
              <span className="text-[10px] text-gray-500 w-10 text-right font-medium">9 / 15</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2 mt-1 border-t border-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-700">Readiness</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-900">70%</span>
              <Info size={12} className="text-gray-400" />
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
