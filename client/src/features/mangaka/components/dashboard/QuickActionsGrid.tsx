import { Plus, UploadCloud, CheckSquare, BookOpen, Trophy, MessageSquare } from 'lucide-react'

const actions = [
  { id: 1, title: 'Create New Series', icon: <Plus size={18} className="text-purple-600" />, iconBg: 'bg-purple-50' },
  { id: 2, title: 'Open Series List', icon: <BookOpen size={18} className="text-purple-600" />, iconBg: 'bg-purple-50' },
  { id: 3, title: 'Open Review Queue', icon: <MessageSquare size={18} className="text-purple-600" />, iconBg: 'bg-purple-50' },
  { id: 4, title: 'Upload Manuscript', icon: <UploadCloud size={18} className="text-purple-600" />, iconBg: 'bg-purple-50' },
  { id: 5, title: 'Open Publication Readiness', icon: <CheckSquare size={18} className="text-purple-600" />, iconBg: 'bg-purple-50' },
  { id: 6, title: 'View Ranking', icon: <Trophy size={18} className="text-amber-600" />, iconBg: 'bg-amber-50' },
];

export function QuickActionsGrid() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h2 className="text-sm font-bold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button key={action.id} className="flex flex-col items-center justify-center p-3 border border-gray-100 rounded-lg hover:border-purple-200 hover:bg-purple-50/30 transition-colors gap-2 text-center h-[85px] shadow-sm">
            <div className={`p-1.5 rounded-md ${action.iconBg}`}>
              {action.icon}
            </div>
            <span className="text-[11px] font-semibold text-gray-700 leading-tight px-1">{action.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
