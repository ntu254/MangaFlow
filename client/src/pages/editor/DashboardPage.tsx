import { FileText, Layers, MessageSquare, CheckSquare, Clock, ArrowRight, LayoutTemplate } from 'lucide-react'
import { Link } from 'react-router-dom'

const stats = [
  { label: 'Manuscripts to Review', value: '3', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  { label: 'Chapters in Production', value: '12', icon: Layers, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  { label: 'Open Discussions', value: '14', icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
  { label: 'Approved This Week', value: '8', icon: CheckSquare, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
]

const recentActivity = [
  { id: 1, action: 'Submitted revised manuscript', series: 'Neon Genesis', user: 'Kenji M.', time: '2 hrs ago', status: 'pending' },
  { id: 2, action: 'Approved chapter 14 draft', series: 'Samurai X', user: 'You', time: '5 hrs ago', status: 'approved' },
  { id: 3, action: 'Requested changes on proposal', series: 'Magic Kaito', user: 'You', time: '1 day ago', status: 'changes' },
]

export default function EditorDashboard() {
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
        {stats.map((s) => (
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
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border bg-indigo-50 border-indigo-100 text-indigo-600">
                      <FileText size={18} />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">NEW</span>
                        <h3 className="text-[14px] font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">Neon Genesis Proposal v{i}</h3>
                      </div>
                      <div className="flex items-center gap-3 text-[12px] text-gray-500 font-medium">
                        <span>Submitted by Kenji M.</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="text-gray-700 font-semibold">{i * 2} days ago</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 sm:gap-6 ml-14 sm:ml-0">
                    <Link to={`/app/editor/series/mock-${i}/review`} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-[12px] transition-colors shadow-sm">
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[14px] font-bold text-gray-900">Recent Activity</h2>
            </div>
            
            <div className="relative">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-100"></div>
              <div className="flex flex-col gap-6">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-4 relative z-10">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm mt-0.5 ${
                      activity.status === 'pending' ? 'bg-indigo-100 text-indigo-600' :
                      activity.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      <Clock size={10} strokeWidth={3} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-gray-900">{activity.action}</span>
                      <span className="text-[12px] font-medium text-gray-600 mt-0.5">{activity.series}</span>
                      <span className="text-[11px] text-gray-400 mt-1">{activity.user} · {activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button className="w-full mt-6 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-2.5 rounded-lg text-[12px] transition-colors">
              View Activity Log
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
