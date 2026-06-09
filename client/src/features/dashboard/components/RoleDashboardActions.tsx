import { DashboardQuickActionCard } from "./DashboardQuickActionCard"
import type { DashboardAction } from "../hooks/useRoleDashboard"

interface RoleDashboardActionsProps {
  actions: DashboardAction[]
}

export function RoleDashboardActions({ actions }: RoleDashboardActionsProps) {
  return (
    <div className="grid gap-lg md:grid-cols-2">
      {actions.map((action) => (
        <DashboardQuickActionCard key={action.to} {...action} />
      ))}
    </div>
  )
}
