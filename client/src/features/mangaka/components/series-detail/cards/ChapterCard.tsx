interface ChapterCardProps {
  ch: number
  title: string
  status: string
  pages: string
  pct: number
  target: string
  tasks?: string
  active?: boolean
  onClick: () => void
}

export function ChapterCard({ ch, title, status, pages, pct, target, tasks, active, onClick }: ChapterCardProps) {
  return (
    <button onClick={onClick} className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-all relative overflow-hidden text-left ${active ? "border-purple-200 bg-purple-50/30" : "border-gray-200 hover:border-purple-200"}`}>
      {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[14px] font-extrabold text-gray-900">Ch. {ch}</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-purple-100 text-purple-700 border-purple-200">{status}</span>
      </div>
      <div className="text-[12px] font-bold text-gray-800 mb-3 line-clamp-1">{title}</div>
      <div className="flex flex-col gap-1.5 mb-3">
        <div className="flex justify-between items-end">
          <span className="text-[12px] font-bold text-gray-600">{pages}</span>
          <span className="text-[11px] font-bold text-gray-500">{pct}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="bg-purple-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
        </div>
      </div>
      <div className="flex justify-between items-center text-[11px] font-bold text-gray-500">
        <span>{target}</span>
        {tasks && <span className="text-orange-500">{tasks}</span>}
      </div>
    </button>
  )
}
