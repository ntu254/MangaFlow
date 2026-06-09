import { Navigate, Route } from "react-router-dom"
import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute"
import { MarketingLayout } from "@/shared/components/layout/MarketingLayout"
import { AuthLayout } from "@/shared/components/layout/AuthLayout"
import { DashboardLayout } from "@/shared/components/layout/DashboardLayout"
import { RoutePlaceholderPage } from "@/shared/components/feedback/RoutePlaceholderPage"
import { LandingPage } from "@/features/marketing/pages/LandingPage"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { AppHomeRedirect } from "./AppHomeRedirect"
import {
  LazyAdminDashboardPage,
  LazyBoardPage,
  LazyChapterDetailPage,
  LazyReviewPage,
  LazyRoleDashboardPage,
  LazySeriesDetailPage,
  LazySeriesPage,
  LazyTasksPage,
  LazyWorkspacePage,
} from "./lazy-routes"
import { adminPlaceholderRoutes, notificationPlaceholderRoute } from "./placeholder-routes"

function renderPlaceholder(item: { title: string; description: string; icon: string }) {
  return <RoutePlaceholderPage title={item.title} description={item.description} icon={item.icon} />
}

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
              <Route path="dashboard" element={<LazyRoleDashboardPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
            <Route path="admin/dashboard" element={<LazyAdminDashboardPage />} />
            <Route path="admin" element={<Navigate to="/app/admin/dashboard" replace />} />
            {adminPlaceholderRoutes.map((item) => (
              <Route key={item.path} path={item.path} element={renderPlaceholder(item)} />
            ))}
          </Route>

          <Route path="series" element={<LazySeriesPage />} />
          <Route path="series/:id" element={<LazySeriesDetailPage />} />
          <Route path="chapters/:id" element={<LazyChapterDetailPage />} />
          <Route path="workspace/:taskId" element={<LazyWorkspacePage />} />
          <Route path="tasks" element={<LazyTasksPage />} />
          <Route path="review" element={<LazyReviewPage />} />
          <Route path="board" element={<LazyBoardPage />} />
          <Route path={notificationPlaceholderRoute.path} element={renderPlaceholder(notificationPlaceholderRoute)} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </>
  )
}
