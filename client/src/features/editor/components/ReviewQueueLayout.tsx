import * as React from "react"
import { Search, Filter, FileText } from "lucide-react"

interface ReviewQueueLayoutProps {
  children: React.ReactNode
  isEmpty?: boolean
  searchPlaceholder?: string
}

export function ReviewQueueLayout({ children, isEmpty, searchPlaceholder = "Search..." }: ReviewQueueLayoutProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          <button className="px-4 py-2 bg-slate-900 text-white text-[13px] font-bold rounded-lg whitespace-nowrap">
            All Reviews
          </button>
          <button className="px-4 py-2 bg-white text-slate-600 hover:text-slate-900 border border-slate-200 text-[13px] font-bold rounded-lg transition-colors whitespace-nowrap">
            Needs Review
          </button>
          <button className="px-4 py-2 bg-white text-slate-600 hover:text-slate-900 border border-slate-200 text-[13px] font-bold rounded-lg transition-colors whitespace-nowrap">
            Revision
          </button>
          <button className="px-4 py-2 bg-white text-slate-600 hover:text-slate-900 border border-slate-200 text-[13px] font-bold rounded-lg transition-colors whitespace-nowrap">
            Approved
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={searchPlaceholder} 
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-violet-500 w-full sm:w-64 shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-slate-50 shadow-sm transition-colors">
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center bg-white border border-slate-200 border-dashed rounded-2xl p-16 text-slate-400">
            <FileText size={48} strokeWidth={1} className="mb-4 text-slate-300" />
            <p className="text-[15px] font-medium text-slate-900 mb-1">Queue is empty</p>
            <p className="text-[13px]">No items are currently waiting for your review.</p>
          </div>
        ) : children}
      </div>
    </div>
  )
}
