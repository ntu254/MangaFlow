import type { AdminDashboardSummary } from "@/features/admin/api/admin.api"
import { APP_ROUTES } from "@/routes/app-routes.registry"

export type SidebarBadgeTone = "neutral" | "warning" | "danger" | "success"

export interface SidebarItem {
  label: string
  path: string
  icon: string
  roles?: string[]
  badge?: string
  badgeTone?: SidebarBadgeTone
  absolute?: boolean
}

export interface SidebarSection {
  label: string
  items: SidebarItem[]
}

const DEFAULT_SECTIONS: SidebarSection[] = [
  {
    label: "Main",
    items: [{ label: "Dashboard", path: APP_ROUTES.admin.dashboard, icon: "dashboard" }],
  },
]

const ADMIN_SECTIONS: SidebarSection[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", path: APP_ROUTES.admin.dashboard, icon: "dashboard" },
    ],
  },
  {
    label: "User & Access",
    items: [
      { label: "Users", path: APP_ROUTES.admin.users, icon: "manage_accounts", badge: "0", badgeTone: "neutral" },
      { label: "Board Members", path: APP_ROUTES.admin.boardMembers, icon: "groups", badge: "!", badgeTone: "warning" },
    ],
  },
  {
    label: "Content Management",
    items: [
      { label: "Series", path: APP_ROUTES.admin.series, icon: "auto_stories", badge: "0", badgeTone: "neutral" },
    ],
  },
  {
    label: "Workflow Config",
    items: [
      { label: "Task Types", path: APP_ROUTES.admin.taskTypes, icon: "category", badge: "0", badgeTone: "neutral" },
      { label: "Task Rates", path: APP_ROUTES.admin.taskRates, icon: "price_change", badge: "0", badgeTone: "neutral" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Payroll", path: APP_ROUTES.admin.payroll, icon: "payments", badge: "0", badgeTone: "neutral" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Storage", path: APP_ROUTES.admin.storage, icon: "cloud", badge: "OK", badgeTone: "success" },
      { label: "AI Service", path: APP_ROUTES.admin.aiService, icon: "smart_toy", badge: "!", badgeTone: "warning" },
      { label: "Audit Logs", path: APP_ROUTES.admin.auditLogs, icon: "policy", badge: "0", badgeTone: "neutral" },
      { label: "System Health", path: APP_ROUTES.admin.systemHealth, icon: "monitor_heart", badge: "!", badgeTone: "warning" },
    ],
  },
]

const MANGAKA_SECTIONS: SidebarSection[] = [
  {
    label: "My Work",
    items: [
      { label: "Dashboard", path: APP_ROUTES.mangaka.dashboard, icon: "dashboard" },
      { label: "My Series", path: APP_ROUTES.mangaka.series, icon: "auto_stories", badge: "0", badgeTone: "neutral" },
      { label: "Manuscripts", path: APP_ROUTES.mangaka.manuscripts, icon: "description", badge: "0", badgeTone: "neutral" },
      { label: "Chapters", path: APP_ROUTES.mangaka.chapters, icon: "menu_book", badge: "0", badgeTone: "neutral" },
      { label: "Tasks", path: APP_ROUTES.mangaka.tasks, icon: "assignment", badge: "0", badgeTone: "neutral" },
      { label: "Submissions", path: APP_ROUTES.mangaka.submissions, icon: "upload_file", badge: "0", badgeTone: "neutral" },
      { label: "Comments", path: APP_ROUTES.mangaka.comments, icon: "chat_bubble_outline", badge: "0", badgeTone: "neutral" },
      { label: "Ranking", path: APP_ROUTES.mangaka.ranking, icon: "leaderboard", badge: "0", badgeTone: "neutral" },
      { label: "Payroll", path: APP_ROUTES.mangaka.payroll, icon: "payments", badge: "0", badgeTone: "neutral" },
      { label: "Notifications", path: APP_ROUTES.shared.notifications, icon: "notifications", badge: "0", badgeTone: "neutral" },
    ],
  },
]

const ASSISTANT_SECTIONS: SidebarSection[] = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", path: APP_ROUTES.assistant.dashboard, icon: "dashboard" },
      { label: "My Tasks", path: APP_ROUTES.assistant.tasks, icon: "assignment", badge: "0", badgeTone: "neutral" },
      { label: "Submissions", path: APP_ROUTES.assistant.submissions, icon: "upload_file", badge: "0", badgeTone: "neutral" },
      { label: "Revisions", path: APP_ROUTES.assistant.revisions, icon: "refresh", badge: "0", badgeTone: "neutral" },
      { label: "Earnings", path: APP_ROUTES.assistant.earnings, icon: "payments", badge: "0", badgeTone: "neutral" },
      { label: "Notifications", path: APP_ROUTES.shared.notifications, icon: "notifications", badge: "0", badgeTone: "neutral" },
    ],
  },
]

const EDITOR_SECTIONS: SidebarSection[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", path: APP_ROUTES.editor.dashboard, icon: "dashboard" },
      { label: "Assigned Series", path: APP_ROUTES.editor.series, icon: "auto_stories", badge: "0", badgeTone: "neutral" },
      { label: "Manuscript Review", path: APP_ROUTES.editor.manuscripts, icon: "description", badge: "0", badgeTone: "neutral" },
      { label: "Chapter Review", path: APP_ROUTES.editor.chapters, icon: "menu_book", badge: "0", badgeTone: "neutral" },
      { label: "Page Review", path: APP_ROUTES.editor.pages, icon: "grid_view", badge: "0", badgeTone: "neutral" },
      { label: "Comments", path: APP_ROUTES.editor.comments, icon: "chat_bubble_outline", badge: "0", badgeTone: "neutral" },
      { label: "Tasks", path: APP_ROUTES.editor.tasks, icon: "assignment", badge: "0", badgeTone: "neutral" },
      { label: "Publication", path: APP_ROUTES.editor.publication, icon: "campaign", badge: "0", badgeTone: "neutral" },
      { label: "Ranking Support", path: APP_ROUTES.editor.rankingSupport, icon: "leaderboard", badge: "0", badgeTone: "neutral" },
      { label: "Notifications", path: APP_ROUTES.shared.notifications, icon: "notifications", badge: "0", badgeTone: "neutral" },
    ],
  },
]

const BOARD_SECTIONS: SidebarSection[] = [
  {
    label: "Board",
    items: [
      { label: "Dashboard", path: APP_ROUTES.board.dashboard, icon: "dashboard" },
      { label: "Series Approvals", path: APP_ROUTES.board.approvals, icon: "how_to_reg", badge: "0", badgeTone: "neutral" },
      { label: "My Votes", path: APP_ROUTES.board.votes, icon: "how_to_vote", badge: "0", badgeTone: "neutral" },
      { label: "Ranking", path: APP_ROUTES.board.ranking, icon: "leaderboard", badge: "0", badgeTone: "neutral" },
      { label: "Import Ranking", path: APP_ROUTES.board.rankingImport, icon: "file_upload", badge: "0", badgeTone: "neutral" },
      { label: "At-Risk Series", path: APP_ROUTES.board.atRisk, icon: "warning_amber", badge: "0", badgeTone: "neutral" },
      { label: "Decisions", path: APP_ROUTES.board.decisions, icon: "gavel", badge: "0", badgeTone: "neutral" },
      { label: "Notifications", path: APP_ROUTES.shared.notifications, icon: "notifications", badge: "0", badgeTone: "neutral" },
    ],
  },
]

function getBaseSidebarSections(role: string): SidebarSection[] {
  if (role === "ADMIN") return ADMIN_SECTIONS
  if (role === "MANGAKA") return MANGAKA_SECTIONS
  if (role === "EDITOR") return EDITOR_SECTIONS
  if (role === "BOARD") return BOARD_SECTIONS
  if (role === "ASSISTANT") return ASSISTANT_SECTIONS
  return DEFAULT_SECTIONS
}

function adminBadgeLookup(summary: AdminDashboardSummary | null): Record<string, string | undefined> {
  if (!summary) return {}
  return {
    Dashboard: undefined,
    Users: String(summary.sidebarBadges.suspendedUsers || 0),
    "Board Members": summary.sidebarBadges.missingBoardChair ? "!" : undefined,
    Series: String(summary.sidebarBadges.seriesPendingReview || 0),
    "Task Types": String(summary.sidebarBadges.inactiveTaskTypes || 0),
    "Task Rates": String(summary.sidebarBadges.taskRateWarnings || 0),
    Payroll: String(summary.sidebarBadges.pendingPayrollConfirmations || 0),
    Storage: summary.sidebarBadges.storageWarning ? "!" : "OK",
    "AI Service": summary.sidebarBadges.aiUnhealthy ? "!" : "OK",
    "Audit Logs": String(summary.sidebarBadges.criticalAuditEvents || 0),
    "System Health": String(summary.sidebarBadges.systemWarnings || 0),
  }
}

function defaultBadgeTone(label: string): SidebarBadgeTone {
  if (["Storage", "AI Service", "System Health"].includes(label)) return "warning"
  return "neutral"
}

export function buildSidebarSections(
  roleName: string,
  userRole: string | undefined,
  summary: AdminDashboardSummary | null,
): SidebarSection[] {
  const isAdminRole = roleName.toUpperCase() === "ADMIN"
  const badgeLookup = isAdminRole ? adminBadgeLookup(summary) : {}

  const normalizedPath = (path: string) => {
    const withoutAppSegment = path.replace(/^\/app\//, "")
    const normalized = withoutAppSegment === "notifications" ? "/app/notifications" : `/app/${withoutAppSegment}`
    return normalized
  }

  return getBaseSidebarSections(roleName)
    .map((section) => {
      const items = section.items
        .filter((item) => {
          if (!item.roles) return true
          return userRole ? item.roles.includes(userRole) : false
        })
        .map((item) => {
          const normalized = normalizedPath(item.path)
          const isCanonicalAdminPath = normalized.startsWith("/app/admin")
          const hasBadgeOverride = isAdminRole && isCanonicalAdminPath && badgeLookup[item.label] !== undefined

          return {
            ...item,
            path: normalized,
            badge: hasBadgeOverride ? badgeLookup[item.label] : item.badge,
            badgeTone: item.badgeTone ?? defaultBadgeTone(item.label),
          }
        })

      return { ...section, items }
    })
    .filter((section) => section.items.length > 0)
}

export function sidebarBadgeClass(tone: SidebarBadgeTone = "neutral") {
  if (tone === "danger") return "bg-error text-on-error"
  if (tone === "warning") return "bg-tertiary-container text-on-tertiary-container"
  if (tone === "success") return "bg-primary-container text-on-primary-container"
  return "bg-surface-container-highest text-on-surface-variant"
}
