import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/shared/components/auth/AuthProvider"
import { useAuth } from "@/shared/components/auth/AuthProvider"
import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute"
import { MarketingLayout } from "@/shared/components/layout/MarketingLayout"
import { AuthLayout } from "@/shared/components/layout/AuthLayout"
import { DashboardLayout } from "@/shared/components/layout/DashboardLayout"
import { RoutePlaceholderPage } from "@/shared/components/feedback/RoutePlaceholderPage"
import { LandingPage } from "@/features/marketing/pages/LandingPage"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { AdminDashboardPage } from "@/features/admin/pages/AdminDashboardPage"
import { BoardPage } from "@/features/board/pages/BoardPage"
import { ChapterDetailPage } from "@/features/chapter/pages/ChapterDetailPage"
import { RoleDashboardPage } from "@/features/dashboard/pages/RoleDashboardPage"
import { ReviewPage } from "@/features/review/pages/ReviewPage"
import { SeriesDetailPage } from "@/features/series/pages/SeriesDetailPage"
import { SeriesPage } from "@/features/series/pages/SeriesPage"
import { TasksPage } from "@/features/task/pages/TasksPage"
import { WorkspacePage } from "@/features/workspace/pages/WorkspacePage"

function AppHomeRedirect() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={`/app/${user.role.toLowerCase()}/dashboard`} replace />
}

function App() {
  return (
    <AuthProvider>
      <Routes>
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
              <Route
                path="admin/users"
                element={
                  <RoutePlaceholderPage
                    title="Users"
                    description="Create users, update roles, and active/suspend accounts. Backend permissions remain source of truth."
                    icon="manage_accounts"
                  />
                }
              />
              <Route
                path="admin/board-members"
                element={
                  <RoutePlaceholderPage
                    title="Board Members"
                    description="Manage Board membership and Chair assignment without overriding Board decisions."
                    icon="groups"
                  />
                }
              />
              <Route
                path="admin/series"
                element={
                  <RoutePlaceholderPage
                    title="Series Monitor"
                    description="View all series, statuses, owners, and editors. Admin observes; Board approval remains Board-owned."
                    icon="auto_stories"
                  />
                }
              />
              <Route
                path="admin/task-types"
                element={
                  <RoutePlaceholderPage
                    title="Task Types"
                    description="Configure production task types such as translation, cleanup, and lettering."
                    icon="category"
                  />
                }
              />
              <Route
                path="admin/task-rates"
                element={
                  <RoutePlaceholderPage
                    title="Task Rates"
                    description="Configure default task-rate references for payroll tracking; final payroll rules stay backend-owned."
                    icon="price_change"
                  />
                }
              />
              <Route
                path="admin/payroll"
                element={
                  <RoutePlaceholderPage
                    title="Payroll Tracking"
                    description="Monitor pending, confirmed, and paid assistant earnings without bypassing approval rules."
                    icon="payments"
                  />
                }
              />
              <Route
                path="admin/storage"
                element={
                  <RoutePlaceholderPage
                    title="Storage"
                    description="Monitor R2/MinIO usage, file assets, and signed URL access warnings."
                    icon="cloud"
                  />
                }
              />
              <Route
                path="admin/ai-service"
                element={
                  <RoutePlaceholderPage
                    title="AI Service"
                    description="Monitor AI health and bubble detect/process integration status through backend-owned checks."
                    icon="smart_toy"
                  />
                }
              />
              <Route
                path="admin/audit-logs"
                element={
                  <RoutePlaceholderPage
                    title="Audit Logs"
                    description="Review critical system, access, workflow, and storage events."
                    icon="policy"
                  />
                }
              />
              <Route
                path="admin/system-health"
                element={
                  <RoutePlaceholderPage
                    title="System Health"
                    description="Monitor MongoDB, API, storage, AI, env warnings, and runtime hardening status."
                    icon="monitor_heart"
                  />
                }
              />
            </Route>

            <Route
              path="series"
              element={<SeriesPage />}
            />
            <Route
              path="series/:id"
              element={<SeriesDetailPage />}
            />
            <Route
              path="chapters/:id"
              element={<ChapterDetailPage />}
            />
            <Route path="workspace/:taskId" element={<WorkspacePage />} />
            <Route
              path="tasks"
              element={<TasksPage />}
            />
            <Route
              path="review"
              element={<ReviewPage />}
            />
            <Route
              path="board"
              element={<BoardPage />}
            />
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
      </Routes>
    </AuthProvider>
  )
}

export default App
