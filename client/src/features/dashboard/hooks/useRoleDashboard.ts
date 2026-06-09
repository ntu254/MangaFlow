import type { UserRole } from "@/shared/api/auth.types"

export interface DashboardAction {
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
      { title: "Series workspace", description: "Open your series list and continue the production workflow.", icon: "auto_stories", actionLabel: "View series", to: "/app/series" },
      { title: "Production tasks", description: "Review assigned work and follow task progress.", icon: "assignment", actionLabel: "View tasks", to: "/app/tasks" },
    ],
  },
  ASSISTANT: {
    title: "Assistant Dashboard",
    description: "Focus on task-scoped work and the submissions assigned to you.",
    badge: "Task workspace",
    icon: "draw",
    actions: [
      { title: "My tasks", description: "Open the tasks and context pages explicitly assigned to you.", icon: "assignment_ind", actionLabel: "View my tasks", to: "/app/tasks" },
    ],
  },
  EDITOR: {
    title: "Editor Dashboard",
    description: "Coordinate reviews and keep production decisions visible.",
    badge: "Editorial workspace",
    icon: "rate_review",
    actions: [
      { title: "Review queue", description: "Open the review surface for submissions and revisions.", icon: "fact_check", actionLabel: "Open reviews", to: "/app/review" },
      { title: "Series overview", description: "Review series status and production context.", icon: "auto_stories", actionLabel: "View series", to: "/app/series" },
    ],
  },
  BOARD: {
    title: "Board Dashboard",
    description: "Open the board workspace for approval and decision workflows.",
    badge: "Board workspace",
    icon: "groups",
    actions: [
      { title: "Board review", description: "Open the approval queue and documented decision surfaces.", icon: "how_to_vote", actionLabel: "Open board", to: "/app/board" },
    ],
  },
}

export function useRoleDashboard(role?: UserRole) {
  const config = role ? ROLE_DASHBOARD_CONFIG[role] : undefined

  return {
    title: config?.title ?? "Dashboard",
    description: config?.description ?? "Your MangaFlow production workspace.",
    badge: config?.badge ?? "Production workspace",
    icon: config?.icon ?? "dashboard",
    actions: config?.actions ?? [],
  }
}
