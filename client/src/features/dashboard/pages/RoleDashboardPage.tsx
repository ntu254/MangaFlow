import { useAuth } from "@/shared/components/auth/AuthProvider"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFBadge } from "@/shared/components/ui/MFBadge"
import { MFCard } from "@/shared/components/ui/MFCard"
import { MFIconCircle } from "@/shared/components/ui/MFIconCircle"
import { MFSection } from "@/shared/components/ui/MFSection"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { RoleDashboardActions } from "../components/RoleDashboardActions"
import { useRoleDashboard } from "../hooks/useRoleDashboard"

export function RoleDashboardPage() {
  const { user } = useAuth()
  const dashboard = useRoleDashboard(user?.role)

  usePageTitle(dashboard.title, dashboard.description)

  return (
    <div className="space-y-xl">
      <MFCard padding="lg" className="overflow-hidden rounded-3xl">
        <div className="flex flex-col gap-lg sm:flex-row sm:items-center">
          <MFIconCircle variant="primary" size="lg" className="shrink-0">
            <span className="material-symbols-outlined text-[28px]" aria-hidden="true">{dashboard.icon}</span>
          </MFIconCircle>
          <div className="min-w-0 flex-1">
            <MFBadge tone="primary">{dashboard.badge}</MFBadge>
            <h2 className="mt-md text-headline-md text-on-surface">Welcome back{user?.name ? `, ${user.name}` : ""}</h2>
            <p className="mt-sm max-w-2xl text-body-md text-on-surface-muted">{dashboard.description}</p>
          </div>
        </div>
      </MFCard>

      <MFSection title="Quick actions" description="Continue with the production surfaces available to your role.">
        <RoleDashboardActions actions={dashboard.actions} />
      </MFSection>

      <MFSection title="Recent activity" description="Production updates will collect here as dashboard reporting becomes available.">
        <MFEmptyState icon="history" title="No activity summary yet" description="Use the quick actions above to continue your current workflow. Activity and progress will appear here when live dashboard reporting is available." />
      </MFSection>
    </div>
  )
}
