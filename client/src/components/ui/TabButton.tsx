import React from "react"

interface TabButtonProps {
  icon?: React.ReactNode
  label: string
  badge?: string
  active: boolean
  onClick: () => void
}

export function TabButton({ icon, label, badge, active, onClick }: TabButtonProps) {
  return (
    <button onClick={onClick} className={`font-bold text-[14px] border-b-[3px] pb-3 flex items-center gap-2 transition-colors ${active ? "text-purple-600 border-purple-600" : "text-gray-500 hover:text-gray-900 border-transparent"}`}>
      {icon} {label}
      {badge && <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${active ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>{badge}</div>}
    </button>
  )
}
