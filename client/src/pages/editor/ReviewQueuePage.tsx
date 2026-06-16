import { Link } from "react-router-dom"
import { FileText, ArrowRight } from "lucide-react"
import { useEditorReviewQueue } from "@/hooks/useEditorFlow"

export default function EditorReviewQueuePage() {
  const { data = [], isLoading, isError } = useEditorReviewQueue()

  if (isLoading) return <div className="p-6 text-gray-500">Loading review queue...</div>
  if (isError) return <div className="p-6 text-red-500">Failed to load review queue.</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manuscript Review Queue</h1>
        <p className="text-sm text-muted-foreground">Series proposals waiting for Tantou Editor review.</p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Series</th>
              <th className="px-5 py-3">Manuscript</th>
              <th className="px-5 py-3">Requested Type</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((item) => (
              <tr key={item.series.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-4 font-semibold text-slate-900">{item.series.title}</td>
                <td className="px-5 py-4 text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <FileText size={15} />
                    v{item.manuscript?.version ?? "-"} {item.manuscript?.status ?? "NO_MANUSCRIPT"}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-600">{item.series.requestedPublicationType ?? "-"}</td>
                <td className="px-5 py-4 text-slate-600">{item.series.status}</td>
                <td className="px-5 py-4 text-right">
                  <Link
                    to={`/app/editor/series/${item.series.id}/review`}
                    className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
                  >
                    Review <ArrowRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-500">No proposals are waiting for editor review.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
