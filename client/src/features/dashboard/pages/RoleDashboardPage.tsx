import type { UserRole } from "@/shared/api/auth.types"
import { useAuth } from "@/shared/components/auth/AuthProvider"
import { MFEmptyState } from "@/shared/components/feedback/MFEmptyState"
import { MFBadge } from "@/shared/components/ui/MFBadge"
import { MFCard } from "@/shared/components/ui/MFCard"
import { MFIconCircle } from "@/shared/components/ui/MFIconCircle"
import { MFSection } from "@/shared/components/ui/MFSection"
import { usePageTitle } from "@/shared/contexts/PageTitleContext"
import { DashboardQuickActionCard } from "../components/DashboardQuickActionCard"

interface DashboardAction {
  title: string
  description: string
  icon: string
  actionLabel: string
  to: string
}

interface RoleDashboardConfig {
  title: string
  description: string
  badge: string
  icon: string
  actions: DashboardAction[]
}

const ROLE_DASHBOARD_CONFIG: Partial<Record<UserRole, RoleDashboardConfig>> = {
  MANGAKA: {
    title: "Mangaka Dashboard",
    description: "Keep series proposals, chapters, and production tasks moving.",
    badge: "Creative lead workspace",
    icon: "brush",
    actions: [
      {
        title: "Series workspace",
        description: "Open your series list and continue the production workflow.",
        icon: "auto_stories",
        actionLabel: "View series",
        to: "/app/series",
      },
      {
        title: "Production tasks",
        description: "Review assigned work and follow task progress.",
        icon: "assignment",
        actionLabel: "View tasks",
        to: "/app/tasks",
      },
    ],
  },
  ASSISTANT: {
    title: "Assistant Dashboard",
    description: "Focus on task-scoped work and the submissions assigned to you.",
    badge: "Task workspace",
    icon: "draw",
    actions: [
      {
        title: "My tasks",
        description: "Open the tasks and context pages explicitly assigned to you.",
        icon: "assignment_ind",
        actionLabel: "View my tasks",
        to: "/app/tasks",
      },
    ],
  },
  EDITOR: {
    title: "Editor Dashboard",
    description: "Coordinate reviews and keep production decisions visible.",
    badge: "Editorial workspace",
    icon: "rate_review",
    actions: [
      {
        title: "Review queue",
        description: "Open the review surface for submissions and revisions.",
        icon: "fact_check",
        actionLabel: "Open reviews",
        to: "/app/review",
      },
      {
        title: "Series overview",
        description: "Review series status and production context.",
        icon: "auto_stories",
        actionLabel: "View series",
        to: "/app/series",
      },
    ],
  },
  BOARD: {
    title: "Board Dashboard",
    description: "Open the board workspace for approval and decision workflows.",
    badge: "Board workspace",
    icon: "groups",
    actions: [
      {
        title: "Board review",
        description: "Open the approval queue and documented decision surfaces.",
        icon: "how_to_vote",
        actionLabel: "Open board",
        to: "/app/board",
      },
    ],
  },
}

export function RoleDashboardPage() {
  const { user } = useAuth()
  const config = user ? ROLE_DASHBOARD_CONFIG[user.role] : undefined
  const title = config?.title ?? "Dashboard"
  const description = config?.description ?? "Your MangaFlow production workspace."
  usePageTitle(title, description)

  return (
    <div className="space-y-xl">
      <MFCard padding="lg" className="overflow-hidden rounded-3xl">
        <div className="flex flex-col gap-lg sm:flex-row sm:items-center">
          <MFIconCircle variant="primary" size="lg" className="shrink-0">
            <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
              {config?.icon ?? "dashboard"}
            </span>
          </MFIconCircle>
          <div className="min-w-0 flex-1">
            <MFBadge tone="primary">{config?.badge ?? "Production workspace"}</MFBadge>
            <h2 className="mt-md text-headline-md text-on-surface">
              Welcome back{user?.name ? `, ${user.name}` : ""}
            </h2>
            <p className="mt-sm max-w-2xl text-body-md text-on-surface-muted">{description}</p>
          </div>
        </div>
      </MFCard>

      <MFSection
        title="Quick actions"
        description="Continue with the production surfaces available to your role."
      >
        <div className="grid gap-lg md:grid-cols-2">
          {(config?.actions ?? []).map((action) => (
            <DashboardQuickActionCard key={action.to} {...action} />
          ))}
        </div>
      </MFSection>

      <MFSection
        title="Recent activity"
        description="Production updates will collect here as dashboard reporting becomes available."
      >
        <MFEmptyState
          icon="history"
          title="No activity summary yet"
          description="Use the quick actions above to continue your current workflow. Activity and progress will appear here when live dashboard reporting is available."
        />
      </MFSection>
    </div>
  )
}
