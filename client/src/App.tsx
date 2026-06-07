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
import { RoleDashboardPage } from "@/features/dashboard/pages/RoleDashboardPage"
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
              <Route
                path="admin"
                element={
                  <RoutePlaceholderPage
                    title="Admin Operations"
                    description="Manage users, roles, task types, storage, and audit surfaces."
                    icon="admin_panel_settings"
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
              element={
                <RoutePlaceholderPage
                  title="Series Detail"
                  description="Review series production details and approval readiness."
                  icon="menu_book"
                />
              }
            />
            <Route
              path="chapters/:id"
              element={
                <RoutePlaceholderPage
                  title="Chapter Detail"
                  description="Track pages, tasks, reviews, and publication readiness."
                  icon="collections_bookmark"
                />
              }
            />
            <Route
              path="workspace/:chapterId"
              element={<WorkspacePage />}
            />
            <Route
              path="tasks"
              element={<TasksPage />}
            />
            <Route
              path="review"
              element={
                <RoutePlaceholderPage
                  title="Review Queue"
                  description="Review submissions, comments, and revision requests."
                  icon="rate_review"
                />
              }
            />
            <Route
              path="board"
              element={
                <RoutePlaceholderPage
                  title="Board Review"
                  description="Review series approvals, votes, rankings, and decisions."
                  icon="how_to_vote"
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
