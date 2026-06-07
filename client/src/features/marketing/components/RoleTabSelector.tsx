export type RoleTabId = "mangaka" | "assistant" | "editor" | "board"

interface RoleTabSelectorProps {
  activeRole: RoleTabId
  onRoleChange: (roleId: string) => void
}

export function RoleTabSelector({ activeRole, onRoleChange }: RoleTabSelectorProps) {
  const tabs = [
    { id: "mangaka" as const, label: "Mangaka", icon: "brush" },
    { id: "assistant" as const, label: "Assistant", icon: "engineering" },
    { id: "editor" as const, label: "Editor", icon: "rate_review" },
    { id: "board" as const, label: "Board Member", icon: "gavel" },
  ]

  return (
    <div className="flex overflow-x-auto pb-sm border-b border-outline-variant/30 gap-lg justify-center">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onRoleChange(tab.id)}
          className={`font-label-md text-label-md whitespace-nowrap flex items-center gap-xs pb-sm px-sm transition-colors ${
            activeRole === tab.id
              ? "text-primary border-b-2 border-primary"
              : "text-on-surface-variant hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  )
}
