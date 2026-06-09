export interface PlaceholderRouteConfig {
  path: string;
  title: string;
  description: string;
  icon: string;
}

export const adminPlaceholderRoutes: PlaceholderRouteConfig[] = [
  {
    path: "admin/users",
    title: "Users",
    description:
      "Create users, update roles, and active/suspend accounts. Backend permissions remain source of truth.",
    icon: "manage_accounts",
  },
  {
    path: "admin/board-members",
    title: "Board Members",
    description:
      "Manage Board membership and Chair assignment without overriding Board decisions.",
    icon: "groups",
  },
  {
    path: "admin/series",
    title: "Series Monitor",
    description:
      "View all series, statuses, owners, and editors. Admin observes; Board approval remains Board-owned.",
    icon: "auto_stories",
  },
  {
    path: "admin/task-types",
    title: "Task Types",
    description:
      "Configure production task types such as translation, cleanup, and lettering.",
    icon: "category",
  },
  {
    path: "admin/task-rates",
    title: "Task Rates",
    description:
      "Configure default task-rate references for payroll tracking; final payroll rules stay backend-owned.",
    icon: "price_change",
  },
  {
    path: "admin/payroll",
    title: "Payroll Tracking",
    description:
      "Monitor pending, confirmed, and paid assistant earnings without bypassing approval rules.",
    icon: "payments",
  },
  {
    path: "admin/storage",
    title: "Storage",
    description:
      "Monitor R2/MinIO usage, file assets, and signed URL access warnings.",
    icon: "cloud",
  },
  {
    path: "admin/ai-service",
    title: "AI Service",
    description:
      "Monitor AI health and bubble detect/process integration status through backend-owned checks.",
    icon: "smart_toy",
  },
  {
    path: "admin/audit-logs",
    title: "Audit Logs",
    description:
      "Review critical system, access, workflow, and storage events.",
    icon: "policy",
  },
  {
    path: "admin/system-health",
    title: "System Health",
    description:
      "Monitor MongoDB, API, storage, AI, env warnings, and runtime hardening status.",
    icon: "monitor_heart",
  },
];

export const notificationPlaceholderRoute: PlaceholderRouteConfig = {
  path: "notifications",
  title: "Notifications",
  description:
    "Central notification inbox for workflow alerts, admin warnings, and assignment updates.",
  icon: "notifications",
};
