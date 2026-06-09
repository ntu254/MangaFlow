import { lazy } from "react"
import { Navigate, Route } from "react-router-dom"
import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute"
import { MarketingLayout } from "@/shared/components/layout/MarketingLayout"
import { AuthLayout } from "@/shared/components/layout/AuthLayout"
import { DashboardLayout } from "@/shared/components/layout/DashboardLayout"
import { RoutePlaceholderPage } from "@/shared/components/feedback/RoutePlaceholderPage"
import { LandingPage } from "@/features/marketing/pages/LandingPage"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { AppHomeRedirect } from "./AppHomeRedirect"

const AdminDashboardPage = lazy(() => import("@/features/admin/pages/AdminDashboardPage").then((m) => ({ default: m.AdminDashboardPage })))
const BoardPage = lazy(() => import("@/features/board/pages/BoardPage").then((m) => ({ default: m.BoardPage })))
const ChapterDetailPage = lazy(() => import("@/features/chapter/pages/ChapterDetailPage").then((m) => ({ default: m.ChapterDetailPage })))
const RoleDashboardPage = lazy(() => import("@/features/dashboard/pages/RoleDashboardPage").then((m) => ({ default: m.RoleDashboardPage })))
const ReviewPage = lazy(() => import("@/features/review/pages/ReviewPage").then((m) => ({ default: m.ReviewPage })))
const SeriesDetailPage = lazy(() => import("@/features/series/pages/SeriesDetailPage").then((m) => ({ default: m.SeriesDetailPage })))
const SeriesPage = lazy(() => import("@/features/series/pages/SeriesPage").then((m) => ({ default: m.SeriesPage })))
const TasksPage = lazy(() => import("@/features/task/pages/TasksPage").then((m) => ({ default: m.TasksPage })))
const WorkspacePage = lazy(() => import("@/features/workspace/pages/WorkspacePage").then((m) => ({ default: m.WorkspacePage })))

const adminPlaceholders = [
  {
    path: "admin/users",
    title: "Users",
    description: "Create users, update roles, and active/suspend accounts. Backend permissions remain source of truth.",
    icon: "manage_accounts",
  },
  {
    path: "admin/board-members",
    title: "Board Members",
    description: "Manage Board membership and Chair assignment without overriding Board decisions.",
    icon: "groups",
  },
  {
    path: "admin/series",
    title: "Series Monitor",
    description: "View all series, statuses, owners, and editors. Admin observes; Board approval remains Board-owned.",
    icon: "auto_stories",
  },
  {
    path: "admin/task-types",
    title: "Task Types",
    description: "Configure production task types such as translation, cleanup, and lettering.",
    icon: "category",
  },
  {
    path: "admin/task-rates",
    title: "Task Rates",
    description: "Configure default task-rate references for payroll tracking; final payroll rules stay backend-owned.",
    icon: "price_change",
  },
  {
    path: "admin/payroll",
    title: "Payroll Tracking",
    description: "Monitor pending, confirmed, and paid assistant earnings without bypassing approval rules.",
    icon: "payments",
  },
  {
    path: "admin/storage",
    title: "Storage",
    description: "Monitor R2/MinIO usage, file assets, and signed URL access warnings.",
    icon: "cloud",
  },
  {
    path: "admin/ai-service",
    title: "AI Service",
    description: "Monitor AI health and bubble detect/process integration status through backend-owned checks.",
    icon: "smart_toy",
  },
  {
    path: "admin/audit-logs",
    title: "Audit Logs",
    description: "Review critical system, access, workflow, and storage events.",
    icon: "policy",
  },
  {
    path: "admin/system-health",
    title: "System Health",
    description: "Monitor MongoDB, API, storage, AI, env warnings, and runtime hardening status.",
    icon: "monitor_heart",
  },
]

export function AppRoutes() {
  return (
    <>
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<AppHomeRedirect />} />
          <Route path="dashboard" element={<AppHomeRedirect />} />

          <Route path=":role">
            <Route index element={<AppHomeRedirect />} />
            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<RoleDashboardPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
            <Route path="admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="admin" element={<Navigate to="/app/admin/dashboard" replace />} />
            {adminPlaceholders.map((item) => (
              <Route
                key={item.path}
                path={item.path}
                element={<RoutePlaceholderPage title={item.title} description={item.description} icon={item.icon} />}
              />
            ))}
          </Route>

          <Route path="series" element={<SeriesPage />} />
          <Route path="series/:id" element={<SeriesDetailPage />} />
          <Route path="chapters/:id" element={<ChapterDetailPage />} />
          <Route path="workspace/:taskId" element={<WorkspacePage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="board" element={<BoardPage />} />
          <Route
            path="notifications"
            element={
              <RoutePlaceholderPage
                title="Notifications"
                description="Central notification inbox for workflow alerts, admin warnings, and assignment updates."
                icon="notifications"
              />
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </>
  )
}
