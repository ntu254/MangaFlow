import { Link } from "react-router-dom"
import { FileText, ArrowRight, Filter, Search } from "lucide-react"
import { useEditorReviewQueue } from "@/hooks/useEditorFlow"

export default function EditorReviewQueuePage() {
  const { data = [], isLoading, isError } = useEditorReviewQueue()

  return (
    <div className="max-w-[1400px] w-full mx-auto pb-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Review Queue</h1>
          <p className="text-[14px] text-muted-foreground">Series proposals waiting for Tantou Editor review.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search series..." 
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] outline-none focus:border-indigo-400 w-64 shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-gray-50 shadow-sm transition-colors">
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 font-medium">Loading review queue...</div>
        ) : isError ? (
          <div className="p-12 text-center text-red-500 font-medium">Failed to load review queue.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Series</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Manuscript</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Requested Type</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((item) => (
                  <tr key={item.series.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.series.title}</span>
                        <span className="text-[12px] text-gray-500 mt-0.5 line-clamp-1 max-w-md">{item.series.synopsis || "No synopsis"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                          <FileText size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-gray-900">v{item.manuscript?.version ?? "-"}</span>
                          <span className="text-[11px] font-medium text-gray-500">{item.manuscript?.status ?? "NO_MANUSCRIPT"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center text-[12px] font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">
                        {item.series.requestedPublicationType ?? "-"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                        item.series.status.includes('REVIEW') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {item.series.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link
                        to={`/app/editor/series/${item.series.id}/review`}
                        className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2 text-[13px] font-bold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                      >
                        Review <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <FileText size={48} strokeWidth={1} className="mb-4 text-gray-300" />
                        <p className="text-[15px] font-medium text-gray-900 mb-1">Queue is empty</p>
                        <p className="text-[13px]">No proposals are currently waiting for your review.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
