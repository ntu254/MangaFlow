import { CheckSquare, DollarSign, AlertCircle, ArrowRight, LayoutTemplate, Briefcase, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useAssistantTasks } from '@/features/chapters/hooks/useAssistantFlow'
import type { Task } from '@/features/chapters/services/task.api'

export default function AssistantDashboard() {
  const { user } = useAuthStore()
  const { data: tasks, isLoading } = useAssistantTasks(user?._id)

  const activeTasksList = tasks?.filter((t: Task) => ['TODO', 'IN_PROGRESS', 'REVISION_REQUESTED'].includes(t.status)) || []
  const completedTasksList = tasks?.filter((t: Task) => ['SUBMITTED', 'MANGAKA_APPROVED', 'EDITOR_APPROVED'].includes(t.status)) || []

  const pointsEarned = completedTasksList.filter((t: Task) => t.status === 'EDITOR_APPROVED').length * 150

  return (
    <div className='max-w-[1400px] w-full mx-auto pb-10 space-y-8'>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Assistant Hub</h1>
          <p className="text-[14px] text-muted-foreground">Manage your assignments, track deadlines, and monitor earnings.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-[13px] font-bold border border-emerald-100 shadow-sm">
            <Activity size={16} /> Status: Available
          </div>
        </div>
      </div>

      {/* Top Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatCard label="Active Tasks" value={activeTasksList.length} icon={Briefcase} color="text-indigo-600" bg="bg-indigo-50" border="border-indigo-100" />
        <StatCard label="Due Soon" value={activeTasksList.filter((t: Task) => new Date(t.dueDate) < new Date(Date.now() + 86400000 * 2)).length} icon={AlertCircle} color="text-orange-600" bg="bg-orange-50" border="border-orange-100" />
        <StatCard label="Tasks Completed" value={completedTasksList.length} icon={CheckSquare} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" />
        <StatCard label="Monthly Earnings" value={`${pointsEarned} pts`} icon={DollarSign} color="text-purple-600" bg="bg-purple-50" border="border-purple-100" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left Column: Active Tasks (Kanban-ish or List) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
                <LayoutTemplate size={18} className="text-indigo-500" /> My Assignments
              </h2>
              <span className="text-[12px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">{activeTasksList.length} Active</span>
            </div>

            <div className="p-5 flex flex-col gap-3 bg-gray-50/50">
              {isLoading ? (
                <div className="flex justify-center p-4"><div className="w-6 h-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" /></div>
              ) : activeTasksList.length === 0 ? (
                <div className="text-center text-sm text-gray-500 p-4">No active tasks.</div>
              ) : activeTasksList.map((task: Task) => (
                <div key={task.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border bg-indigo-50 border-indigo-100 text-indigo-600`}>
                      <CheckSquare size={18} />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{task.id.slice(-6)}</span>
                        <h3 className="text-[14px] font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{task.title}</h3>
                      </div>
                      <div className="flex items-center gap-3 text-[12px] text-gray-500 font-medium mt-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${task.status === 'REVISION_REQUESTED' ? 'bg-amber-100 text-amber-700' :
                            task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                          }`}>
                          {task.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 ml-14 sm:ml-0">
                    <div className="flex flex-col sm:items-end">
                      <span className="text-[11px] font-bold text-gray-500 uppercase">Deadline</span>
                      <span className={`text-[13px] font-bold ${task.priority === 'HIGH' || task.priority === 'URGENT' ? 'text-orange-600' : 'text-gray-900'}`}>{format(new Date(task.dueDate), "MMM d, h:mm a")}</span>
                    </div>
                    <Link to={`/app/assistant/tasks/${task.id}/studio`} className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors shrink-0">
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Earnings & History */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/20 rounded-full -ml-10 -mb-10 blur-xl"></div>

            <div className="relative z-10 flex flex-col h-full">
              <span className="text-indigo-200 text-[12px] font-bold uppercase tracking-wider mb-2">Available Balance</span>
              <div className="text-4xl font-extrabold tracking-tight mb-1">{pointsEarned.toLocaleString()} <span className="text-xl text-indigo-300">pts</span></div>
              <p className="text-indigo-200 text-[13px] mb-6">≈ ${(pointsEarned / 10).toFixed(2)} USD</p>

              <button className="w-full bg-white text-indigo-900 font-bold py-2.5 rounded-lg text-[13px] hover:bg-indigo-50 transition-colors shadow-sm">
                Request Payout
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-bold text-gray-900">Recent Completions</h2>
              <button className="text-[12px] text-indigo-600 font-bold hover:underline">View All</button>
            </div>

            <div className="flex flex-col gap-4">
              {completedTasksList.slice(0, 5).map((item: Task) => (
                <div key={item.id} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-gray-900 line-clamp-1">{item.title}</span>
                    <span className="text-[11px] text-gray-500">{format(new Date(item.updatedAt), "MMM d, yyyy")}</span>
                  </div>
                  <div className="text-[13px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                    {item.status === 'EDITOR_APPROVED' ? '+ Pts' : 'Pending'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, bg, border }: any) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} ${color} ${border} border`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col">
        <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
        <span className="text-2xl font-extrabold text-gray-900 tracking-tight">{value}</span>
      </div>
    </div>
  )
}
