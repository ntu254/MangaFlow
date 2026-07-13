import type { Role } from "@/shared/auth";

export type NavItem = {
  to: string;
  label: string;
  group?: string;
  /** If set, only users with this role can see this item (checked in sidebar). */
  minRole?: Role;
};

const SHARED: NavItem[] = [
  { to: "/app/dashboard", label: "Dashboard", group: "Workspace" },
  { to: "/app/notifications", label: "Notifications", group: "Workspace" },
];

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  admin: [
    { to: "/app/admin/dashboard", label: "Dashboard", group: "Admin" },
    { to: "/app/admin/users", label: "Users", group: "Admin" },
    { to: "/app/admin/materials", label: "Material Library", group: "Admin" },
    { to: "/app/admin/payroll", label: "Payroll", group: "Admin" },
    { to: "/app/admin/audit", label: "Audit Logs", group: "Admin" },
    { to: "/app/admin/settings", label: "Settings", group: "Admin" },
    { to: "/app/admin/notifications", label: "Notifications", group: "Admin" },
  ],
  mangaka: [
    ...SHARED,
    { to: "/app/series", label: "My Series", group: "Production" },
    { to: "/app/tasks", label: "Task Board", group: "Production" },
    { to: "/app/review", label: "Review Queue", group: "Production" },
    { to: "/app/publications", label: "Publications", group: "Production" },
    { to: "/app/rankings", label: "Rankings", group: "Insights" },
  ],
  assistant: [
    { to: "/app/assistant/dashboard", label: "Dashboard", group: "Workspace" },
    { to: "/app/assistant/tasks", label: "My Tasks", group: "Workspace" },
    { to: "/app/assistant/submissions", label: "Submissions", group: "Workspace" },
    { to: "/app/assistant/earnings", label: "Earnings", group: "Account" },
    { to: "/app/assistant/notifications", label: "Notifications", group: "Account" },
  ],
  editor: [
    { to: "/app/editor/dashboard", label: "Dashboard", group: "Editorial" },
    { to: "/app/editor/review", label: "Review Queue", group: "Editorial" },
    { to: "/app/editor/series", label: "Series Monitor", group: "Editorial" },
    { to: "/app/editor/publications", label: "Publications", group: "Editorial" },
    { to: "/app/editor/board-briefs", label: "At-risk Reports", group: "Editorial" },
    { to: "/app/editor/notifications", label: "Notifications", group: "Account" },
  ],
  board: [
    { to: "/app/board/dashboard", label: "Dashboard", group: "Governance" },
    { to: "/app/board/queue", label: "Board Queue", group: "Governance" },
    { to: "/app/board/sessions", label: "Voting Sessions", group: "Governance", minRole: "admin" },
    { to: "/app/board/rankings", label: "Rankings", group: "Governance" },
    { to: "/app/board/at-risk", label: "At-risk Reviews", group: "Governance" },
    { to: "/app/board/decisions", label: "Decisions", group: "Governance" },
    { to: "/app/board/notifications", label: "Notifications", group: "Governance" },
  ],
};
