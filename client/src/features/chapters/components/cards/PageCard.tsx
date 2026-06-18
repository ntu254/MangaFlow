import { FileText, MessageCircle, MoreHorizontal, UploadCloud } from "lucide-react"

interface PageCardProps {
  num: number
  status: string
  statColor: string
  onOpen: () => void
}

export function PageCard({ num, status, statColor, onOpen }: PageCardProps) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-amber-50 text-amber-600 border-amber-100",
    red: "bg-rose-50 text-rose-600 border-rose-100",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-100",
    gray: "bg-gray-50 text-gray-600 border-gray-100",
  }

  return (
    <div onClick={onOpen} className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col hover:border-purple-300 hover:shadow-md transition-all cursor-pointer relative group text-left">
      <div className="absolute top-4 left-4 w-4 h-4 rounded border border-gray-300 bg-white shadow-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"></div>
      <button type="button" className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded p-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <MoreHorizontal size={14} />
      </button>

      <div className="w-full aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden mb-3 border border-gray-100 relative flex items-center justify-center">
        <FileText size={28} className="text-gray-300" />
      </div>

      <span className="text-[13px] font-extrabold text-gray-900 mb-2">Page {num}</span>
      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border w-fit mb-3 ${colors[statColor] ?? colors.gray}`}>{status}</span>

      <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400 mt-auto">
        <span className="flex items-center gap-1"><UploadCloud size={12} /> Assets</span>
        <span className="flex items-center gap-1"><MessageCircle size={12} /> Studio</span>
      </div>
    </div>
  )
}
