import { FileText, Layers, MessageSquare, CheckSquare, ArrowRight, LayoutTemplate } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEditorReviewQueue } from '@/features/reviews/hooks/useEditorFlow'
import { ActivityFeed } from '@/features/dashboard/components/ActivityFeed'
import { formatDistanceToNow } from 'date-fns'

export default function EditorDashboard() {
  const { data: queue = [], isLoading } = useEditorReviewQueue()

  // Mocks for now until other APIs are ready
  const recentActivity = [
    { id: 1, action: 'Submitted revised manuscript', series: 'Neon Genesis', user: 'Kenji M.', time: '2 hrs ago', status: 'pending' as const },
  ]

  const statBoxes = [
    { label: 'Manuscripts to Review', value: isLoading ? '...' : String(queue.length), icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { label: 'Chapters in Production', value: '12', icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Open Discussions', value: '14', icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { label: 'Approved This Week', value: '8', icon: CheckSquare, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  ]

  return (
    <div className='max-w-[1400px] w-full mx-auto pb-10 space-y-8'>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Editor Dashboard</h1>
          <p className="text-[14px] text-muted-foreground">Manage submissions, track production progress, and communicate with Mangakas.</p>
        </div>
      </div>

      {/* Top Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {statBoxes.map((s) => (
          <div key={s.label} className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg} ${s.color} ${s.border} border`}>
              <s.icon size={24} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">{s.label}</span>
              <span className="text-2xl font-extrabold text-gray-900 tracking-tight">{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Review Pipeline */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
                <LayoutTemplate size={18} className="text-indigo-500" /> Action Required
              </h2>
              <Link to="/app/editor/manuscripts" className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            
            <div className="p-5 flex flex-col gap-3 bg-gray-50/50">
              {isLoading ? (
                <div className="text-sm text-gray-500 text-center py-4">Loading queue...</div>
              ) : queue.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">No pending manuscripts to review.</div>
              ) : (
                queue.slice(0, 5).map((item) => (
                  <div key={item.series.id || (item.series as any)._id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border bg-indigo-50 border-indigo-100 text-indigo-600">
                        <FileText size={18} />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">NEW</span>
                          <h3 className="text-[14px] font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.series.title}</h3>
                        </div>
                        <div className="flex items-center gap-3 text-[12px] text-gray-500 font-medium">
                          <span>By {(item.series as any).owner?.name ?? "Unknown"}</span>
                          {item.manuscript && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                              <span className="text-gray-700 font-semibold">{formatDistanceToNow(new Date(item.manuscript.updatedAt), { addSuffix: true })}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 sm:gap-6 ml-14 sm:ml-0">
                      <Link to={`/app/editor/series/${item.series.id || (item.series as any)._id}/review`} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-[12px] transition-colors shadow-sm">
                        Review
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="space-y-6">
          <ActivityFeed activities={recentActivity} />
        </div>

      </div>
    </div>
  )
}
