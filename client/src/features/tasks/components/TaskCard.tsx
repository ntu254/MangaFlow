import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowRight, CheckSquare } from 'lucide-react'
import type { Task } from '@/features/chapters/services/task.api'
import { InteractiveCard } from '@/shared/components/ui/card'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { taskStatusUi, type StatusUiConfig } from '@/shared/lib/status-ui'

export function TaskCard({ task }: { task: Task }) {
  const getStatusConfig = (status: string): StatusUiConfig => {
    // Map MANGAKA_APPROVED, EDITOR_APPROVED to APPROVED
    if (status === 'MANGAKA_APPROVED' || status === 'EDITOR_APPROVED') return taskStatusUi['APPROVED'];
    return taskStatusUi[status] || taskStatusUi['TODO'];
  };

  const statusConfig = getStatusConfig(task.status);
  const isUrgent = task.priority === 'HIGH' || task.priority === 'URGENT';
  const isDueSoon = new Date(task.dueDate) < new Date(Date.now() + 86400000 * 2);

  return (
    <InteractiveCard className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border bg-violet-50 border-violet-100 text-violet-600">
          <CheckSquare size={18} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
              {task.id.slice(-6)}
            </span>
            {isUrgent && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 uppercase tracking-wider">
                {task.priority}
              </span>
            )}
            <h3 className="text-[14px] font-bold text-slate-900 group-hover:text-violet-600 transition-colors line-clamp-1">
              {task.title}
            </h3>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge config={statusConfig} size="sm" />
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 sm:gap-6 ml-14 sm:ml-0">
        <div className="flex flex-col sm:items-end">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Deadline</span>
          <span className={`text-[13px] font-bold ${isDueSoon ? 'text-amber-600' : 'text-slate-900'}`}>
            {format(new Date(task.dueDate), "MMM d, h:mm a")}
          </span>
        </div>
        <Link 
          to={`/app/assistant/tasks/${task.id}/studio`} 
          className="w-8 h-8 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center hover:bg-violet-600 hover:text-white transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
          tabIndex={-1}
        >
          <ArrowRight size={16} />
        </Link>
      </div>
    </InteractiveCard>
  )
}
