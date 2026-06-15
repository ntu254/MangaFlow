export function SeriesGridSkeleton() {
  return (
    <div className="flex flex-col gap-8 w-full animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[400px]">
            <div className="w-full h-32 bg-slate-200 shrink-0"></div>
            <div className="p-4 flex flex-col flex-1">
              <div className="h-5 bg-slate-200 rounded-md w-3/4 mb-3"></div>
              <div className="flex gap-2 mb-4">
                <div className="h-4 bg-slate-200 rounded-full w-12"></div>
                <div className="h-4 bg-slate-200 rounded-full w-16"></div>
              </div>
              <div className="space-y-2 mb-6">
                <div className="h-3 bg-slate-200 rounded w-full"></div>
                <div className="h-3 bg-slate-200 rounded w-5/6"></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="h-8 bg-slate-200 rounded"></div>
                <div className="h-8 bg-slate-200 rounded"></div>
              </div>
              <div className="mt-auto">
                <div className="h-9 bg-slate-200 rounded-xl w-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
