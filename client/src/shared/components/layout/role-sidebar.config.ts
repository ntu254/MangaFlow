import type { AdminDashboardSummary } from "@/features/admin/api/admin.api"

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
    items: [{ label: "Dashboard", path: "dashboard", icon: "dashboard" }],
  },
]

const ADMIN_SECTIONS: SidebarSection[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", path: "dashboard", icon: "dashboard" }],
  },
  {
    label: "User & Access",
    items: [
      { label: "Users", path: "users", icon: "manage_accounts", badge: "0", badgeTone: "neutral" },
      { label: "Board Members", path: "board-members", icon: "groups", badge: "!", badgeTone: "warning" },
    ],
  },
  {
    label: "Content Management",
    items: [
      { label: "Series", path: "series", icon: "auto_stories", badge: "0", badgeTone: "neutral" },
    ],
  },
  {
    label: "Workflow Config",
    items: [
      { label: "Task Types", path: "task-types", icon: "category", badge: "0", badgeTone: "neutral" },
      { label: "Task Rates", path: "task-rates", icon: "price_change", badge: "0", badgeTone: "neutral" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Payroll", path: "payroll", icon: "payments", badge: "0", badgeTone: "neutral" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Storage", path: "storage", icon: "cloud", badge: "OK", badgeTone: "success" },
      { label: "AI Service", path: "ai-service", icon: "smart_toy", badge: "!", badgeTone: "warning" },
      { label: "Audit Logs", path: "audit-logs", icon: "policy", badge: "0", badgeTone: "neutral" },
      { label: "System Health", path: "system-health", icon: "monitor_heart", badge: "!", badgeTone: "warning" },
    ],
  },
  {
    label: "Notifications",
    items: [
      { label: "Notifications", path: "/app/notifications", icon: "notifications", badge: "0", badgeTone: "neutral", absolute: true },
    ],
  },
]

function getBaseSidebarSections(role: string): SidebarSection[] {
  if (role === "ADMIN") return ADMIN_SECTIONS
  return DEFAULT_SECTIONS
}

function adminBadgeLookup(summary: AdminDashboardSummary | null): Record<string, string | undefined> {
  if (!summary) return {}
  return {
    Users: String(summary.sidebarBadges.suspendedUsers || 0),
    Series: String(summary.sidebarBadges.seriesPendingReview || 0),
    "Board Members": summary.sidebarBadges.missingBoardChair ? "!" : undefined,
    "Task Types": String(summary.sidebarBadges.inactiveTaskTypes || 0),
    "Task Rates": String(summary.sidebarBadges.taskRateWarnings || 0),
    Payroll: String(summary.sidebarBadges.pendingPayrollConfirmations || 0),
    Storage: summary.sidebarBadges.storageWarning ? "!" : "OK",
    "AI Service": summary.sidebarBadges.aiUnhealthy ? "!" : "OK",
    "Audit Logs": String(summary.sidebarBadges.criticalAuditEvents || 0),
    "System Health": String(summary.sidebarBadges.systemWarnings || 0),
    Notifications: String(summary.sidebarBadges.unreadNotifications || 0),
  }
}

function defaultBadgeTone(label: string): SidebarBadgeTone {
  if (["Storage", "AI Service", "System Health", "Board Members"].includes(label)) return "warning"
  return "neutral"
}

export function buildSidebarSections(
  roleName: string,
  userRole: string | undefined,
  summary: AdminDashboardSummary | null,
): SidebarSection[] {
  const badgeLookup = adminBadgeLookup(summary)
  return getBaseSidebarSections(roleName)
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item) => !item.roles || (userRole && item.roles.includes(userRole)))
        .map((item) => ({
          ...item,
          badge: badgeLookup[item.label] ?? item.badge,
          badgeTone: item.badgeTone ?? defaultBadgeTone(item.label),
        })),
    }))
    .filter((section) => section.items.length > 0)
}

export function sidebarBadgeClass(tone: SidebarBadgeTone = "neutral") {
  if (tone === "danger") return "bg-error text-on-error"
  if (tone === "warning") return "bg-tertiary-container text-on-tertiary-container"
  if (tone === "success") return "bg-primary-container text-on-primary-container"
  return "bg-surface-container-highest text-on-surface-variant"
}
