import { MFTabs, type TabItem } from "@/shared/components/ui/MFTabs"

export type RoleTabId = "mangaka" | "assistant" | "editor" | "board" | "admin"

export const roleTabs: TabItem[] = [
  { id: "mangaka", label: "Mangaka" },
  { id: "assistant", label: "Assistant" },
  { id: "editor", label: "Editor" },
  { id: "board", label: "Board" },
  { id: "admin", label: "Admin" },
]

interface RoleTabSelectorProps {
  activeRole: RoleTabId
  onRoleChange: (roleId: string) => void
}

export function RoleTabSelector({ activeRole, onRoleChange }: RoleTabSelectorProps) {
  return (
    <MFTabs tabs={roleTabs} activeTab={activeRole} onTabChange={onRoleChange} />
  )
}
