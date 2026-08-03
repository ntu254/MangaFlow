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
    { to: "/app/admin/rates", label: "Rate Table", group: "Admin" },
    { to: "/app/admin/notifications", label: "Notifications", group: "Admin" },
  ],
  mangaka: [
    ...SHARED,
    { to: "/app/submissions", label: "Proposals", group: "Production" },
    { to: "/app/series", label: "My Series", group: "Production" },
    { to: "/app/tasks", label: "Task Board", group: "Production" },
    { to: "/app/mangaka/submissions/review", label: "Review Queue", group: "Production" },
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
    { to: "/app/rankings", label: "Rankings", group: "Insights" },
    { to: "/app/editor/publications", label: "Publications", group: "Editorial" },
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
