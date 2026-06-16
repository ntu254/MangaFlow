export function SeriesListSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden w-full animate-pulse">
      <div className="grid grid-cols-[280px_1fr_1fr_140px_100px] gap-6 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="h-4 bg-slate-200 rounded w-16"></div>
        <div className="h-4 bg-slate-200 rounded w-24"></div>
        <div className="h-4 bg-slate-200 rounded w-24"></div>
        <div className="h-4 bg-slate-200 rounded w-20"></div>
        <div className="h-4 bg-slate-200 rounded w-12 ml-auto"></div>
      </div>
      <div className="flex flex-col">
        {[1, 2, 3, 4, 5].map((i, idx) => (
          <div key={i} className={`grid grid-cols-[280px_1fr_1fr_140px_100px] gap-6 px-6 py-5 items-center ${idx < 4 ? 'border-b border-slate-100' : ''}`}>
            <div className="flex items-center gap-4">
              <div className="w-[52px] h-[72px] bg-slate-200 rounded shrink-0"></div>
              <div className="flex flex-col gap-2 w-full">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-5 bg-slate-200 rounded-full w-24"></div>
              <div className="h-2 bg-slate-200 rounded-full w-48 mt-2"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-4 bg-slate-200 rounded w-20"></div>
              <div className="h-3 bg-slate-200 rounded w-12"></div>
            </div>
            <div className="flex justify-end gap-2">
              <div className="w-16 h-8 bg-slate-200 rounded-lg"></div>
              <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
