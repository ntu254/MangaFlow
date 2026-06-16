import { ChevronRight, FileText, MessageSquare, Edit3, Wallet } from 'lucide-react'
import { actionInboxData } from '../../constants/mangaka'

const getIcon = (iconName: string) => {
  switch(iconName) {
    case 'FileText': return <FileText size={16} />
    case 'MessageSquare': return <MessageSquare size={16} />
    case 'Edit3': return <Edit3 size={16} />
    case 'Wallet': return <Wallet size={16} />
    default: return <FileText size={16} />
  }
}

export function ActionInbox() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col pt-4 pb-2">
      <h2 className="text-sm font-bold text-gray-900 px-4 mb-2">Action Inbox</h2>
      <div className="flex flex-col">
        {actionInboxData.map((item) => (
          <div key={item.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 group">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-md ${item.color}`}>
                {getIcon(item.icon)}
              </div>
              <span className="text-[12px] font-semibold text-gray-700 group-hover:text-gray-900">{item.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center border border-purple-200 shadow-sm">
                {item.count}
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
