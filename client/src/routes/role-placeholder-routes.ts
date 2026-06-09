import type { PlaceholderRouteConfig } from "@/routes/placeholder-routes"
import { APP_ROUTES } from "@/routes/app-routes.registry"

const adminRoutes = APP_ROUTES.admin
const mangakaRoutes = APP_ROUTES.mangaka
const assistantRoutes = APP_ROUTES.assistant
const editorRoutes = APP_ROUTES.editor
const boardRoutes = APP_ROUTES.board

export interface SidebarPlaceholderConfig {
  path: string
  title: string
  description: string
  icon: string
  roles?: string[]
}

const sharedPlaceholders: SidebarPlaceholderConfig[] = [
  {
    path: APP_ROUTES.shared.notifications,
    title: "Notifications",
    description: "Central inbox for alerts, assignments, and workflow updates.",
    icon: "notifications",
  },
]

export const rolePlaceholders: SidebarPlaceholderConfig[] = [
  ...sharedPlaceholders,
  ...([
    ["admin", adminRoutes],
    ["mangaka", mangakaRoutes],
    ["assistant", assistantRoutes],
    ["editor", editorRoutes],
    ["board", boardRoutes],
  ] as const).flatMap(([roleKey, routes]) => {
    if (roleKey === "admin") {
      return [
        {
          path: routes.series,
          title: "Series Monitor",
          description: "Observe series status without overriding Board approval.",
          icon: "auto_stories",
        },
        {
          path: routes.users,
          title: "Users",
          description: "Manage user accounts, roles, and access grants.",
          icon: "manage_accounts",
        },
        {
          path: routes.boardMembers,
          title: "Board Members",
          description: "Manage Board membership and Chair assignment.",
          icon: "groups",
        },
        {
          path: routes.taskTypes,
          title: "Task Types",
          description: "Configure production task types such as translation, cleanup, and lettering.",
          icon: "category",
        },
        {
          path: routes.taskRates,
          title: "Task Rates",
          description: "Configure default task-rate references for payroll tracking.",
          icon: "price_change",
        },
        {
          path: routes.payroll,
          title: "Payroll Tracking",
          description: "Monitor pending, confirmed, and paid assistant earnings.",
          icon: "payments",
        },
        {
          path: routes.storage,
          title: "Storage",
          description: "Monitor file storage usage and signed URL access.",
          icon: "cloud",
        },
        {
          path: routes.aiService,
          title: "AI Service",
          description: "Monitor AI health and integration status.",
          icon: "smart_toy",
        },
        {
          path: routes.auditLogs,
          title: "Audit Logs",
          description: "Review critical system and access events.",
          icon: "policy",
        },
        {
          path: routes.systemHealth,
          title: "System Health",
          description: "Monitor backend services and environment warnings.",
          icon: "monitor_heart",
        },
      ] as SidebarPlaceholderConfig[]
    }

    if (roleKey === "mangaka") {
      return [
        {
          path: routes.series,
          title: "My Series",
          description: "Manage owned series and editorial status.",
          icon: "auto_stories",
        },
        {
          path: routes.manuscripts,
          title: "Manuscripts",
          description: "Upload and revise manuscript submissions.",
          icon: "description",
        },
        {
          path: routes.chapters,
          title: "Chapters",
          description: "Review chapter state and publish readiness.",
          icon: "menu_book",
        },
        {
          path: routes.tasks,
          title: "Tasks",
          description: "View tasks and assignment status.",
          icon: "assignment",
        },
        {
          path: routes.submissions,
          title: "Submissions",
          description: "Track submission and review feedback.",
          icon: "upload_file",
        },
        {
          path: routes.comments,
          title: "Comments",
          description: "Review threaded comments on content.",
          icon: "chat_bubble_outline",
        },
        {
          path: routes.ranking,
          title: "Ranking",
          description: "View ranking signals for owned series.",
          icon: "leaderboard",
        },
        {
          path: routes.payroll,
          title: "Payroll",
          description: "Review payroll and earning summaries.",
          icon: "payments",
        },
      ] as SidebarPlaceholderConfig[]
    }

    if (roleKey === "assistant") {
      return [
        {
          path: routes.tasks,
          title: "My Tasks",
          description: "Open assigned tasks and active workspace.",
          icon: "assignment",
        },
        {
          path: routes.submissions,
          title: "Submissions",
          description: "Review submitted work and statuses.",
          icon: "upload_file",
        },
        {
          path: routes.revisions,
          title: "Revisions",
          description: "Manage revision requests and updated files.",
          icon: "refresh",
        },
        {
          path: routes.earnings,
          title: "Earnings",
          description: "Monitor task earnings and payout status.",
          icon: "payments",
        },
      ] as SidebarPlaceholderConfig[]
    }

    if (roleKey === "editor") {
      return [
        {
          path: routes.series,
          title: "Assigned Series",
          description: "Manage series assigned for editorial flow.",
          icon: "auto_stories",
        },
        {
          path: routes.manuscripts,
          title: "Manuscript Review",
          description: "Review and annotate manuscript uploads.",
          icon: "description",
        },
        {
          path: routes.chapters,
          title: "Chapter Review",
          description: "Review chapter packaging and readiness.",
          icon: "menu_book",
        },
        {
          path: routes.pages,
          title: "Page Review",
          description: "Review page-level quality and notes.",
          icon: "grid_view",
        },
        {
          path: routes.comments,
          title: "Comments",
          description: "Resolve editorial comments and threads.",
          icon: "chat_bubble_outline",
        },
        {
          path: routes.tasks,
          title: "Tasks",
          description: "Track editorial task assignments.",
          icon: "assignment",
        },
        {
          path: routes.publication,
          title: "Publication",
          description: "Coordinate release scheduling and publish actions.",
          icon: "campaign",
        },
        {
          path: routes.rankingSupport,
          title: "Ranking Support",
          description: "Provide ranking inputs and editorial context.",
          icon: "leaderboard",
        },
      ] as SidebarPlaceholderConfig[]
    }

    if (roleKey === "board") {
      return [
        {
          path: routes.approvals,
          title: "Series Approvals",
          description: "Review pending series approval requests.",
          icon: "how_to_reg",
        },
        {
          path: routes.votes,
          title: "My Votes",
          description: "Review personal voting activity and pending ballots.",
          icon: "how_to_vote",
        },
        {
          path: routes.ranking,
          title: "Ranking",
          description: "Review ranking outputs and supporting metrics.",
          icon: "leaderboard",
        },
        {
          path: routes.rankingImport,
          title: "Import Ranking",
          description: "Import ranking artifacts and validation snapshots.",
          icon: "file_upload",
        },
        {
          path: routes.atRisk,
          title: "At-Risk Series",
          description: "Monitor series flagged with risk signals.",
          icon: "warning_amber",
        },
        {
          path: routes.decisions,
          title: "Decisions",
          description: "Review recent Board decisions and appeals.",
          icon: "gavel",
        },
      ] as SidebarPlaceholderConfig[]
    }

    return []
  }),
]

export const rolePlaceholderLookup: Record<string, PlaceholderRouteConfig> =
  Object.fromEntries(
    rolePlaceholders.map((item) => [
      item.path,
      { path: item.path, title: item.title, description: item.description, icon: item.icon },
    ]),
  ) as Record<string, PlaceholderRouteConfig>
