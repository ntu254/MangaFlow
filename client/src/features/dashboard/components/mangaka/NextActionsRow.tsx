import { FileCheck, MessageSquare, UploadCloud, BookOpen, Wallet, ArrowRight } from 'lucide-react'
import { nextActionsData } from '../../constants/mangaka'

const getIcon = (iconName: string) => {
  switch(iconName) {
    case 'FileCheck': return <FileCheck size={20} />
    case 'MessageSquare': return <MessageSquare size={20} />
    case 'UploadCloud': return <UploadCloud size={20} />
    case 'BookOpen': return <BookOpen size={20} />
    case 'Wallet': return <Wallet size={20} />
    default: return <FileCheck size={20} />
  }
}

const getColorClass = (color: string) => {
  switch(color) {
    case 'purple': return 'text-purple-600 bg-purple-50 border-purple-100'
    case 'blue': return 'text-blue-600 bg-blue-50 border-blue-100'
    case 'indigo': return 'text-indigo-600 bg-indigo-50 border-indigo-100'
    case 'teal': return 'text-teal-600 bg-teal-50 border-teal-100'
    default: return 'text-gray-600 bg-gray-50 border-gray-100'
  }
}

export function NextActionsRow() {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-gray-900">Next Actions</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {nextActionsData.map((action) => (
          <div key={action.id} className="min-w-[240px] flex-1 bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col hover:border-purple-200 transition-colors cursor-pointer group">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${getColorClass(action.color)}`}>
                {getIcon(action.icon)}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-semibold text-sm text-gray-900 leading-tight">{action.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed min-h-[32px]">{action.description}</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-50">
              <span className="text-xs font-medium text-purple-600 group-hover:text-purple-700 flex items-center gap-1">
                {action.actionText.replace(' →', '')} <ArrowRight size={12} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
