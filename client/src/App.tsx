import { Routes, Route } from "react-router-dom"
import { AuthProvider } from "@/shared/components/auth/AuthProvider"
import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute"
import { MarketingLayout } from "@/shared/components/layout/MarketingLayout"
import { AuthLayout } from "@/shared/components/layout/AuthLayout"
import { DashboardLayout } from "@/shared/components/layout/DashboardLayout"
import { LandingPage } from "@/features/marketing/pages/LandingPage"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import { SeriesListPage } from "@/features/series/pages/SeriesListPage"
import { SeriesDetailPage } from "@/features/series/pages/SeriesDetailPage"
import { ChapterDetailPage } from "@/features/chapters/pages/ChapterDetailPage"
import { TaskListPage } from "@/features/tasks/pages/TaskListPage"
import { ReviewPage } from "@/features/review/pages/ReviewPage"
import { BoardPage } from "@/features/board/pages/BoardPage"
import { AdminPage } from "@/features/admin/pages/AdminPage"
import { WorkspacePage } from "@/features/workspace/pages/WorkspacePage"

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/app/dashboard" element={<DashboardPage />} />
          <Route path="/app/admin/dashboard" element={<DashboardPage />} />
          <Route path="/app/mangaka/dashboard" element={<DashboardPage />} />
          <Route path="/app/assistant/dashboard" element={<DashboardPage />} />
          <Route path="/app/editor/dashboard" element={<DashboardPage />} />
          <Route path="/app/board/dashboard" element={<DashboardPage />} />
          <Route path="/app/series" element={<SeriesListPage />} />
          <Route path="/app/series/:id" element={<SeriesDetailPage />} />
          <Route path="/app/chapters/:id" element={<ChapterDetailPage />} />
          <Route path="/app/tasks" element={<TaskListPage />} />
          <Route path="/app/review" element={<ReviewPage />} />
          <Route path="/app/board" element={<BoardPage />} />
          <Route path="/app/workspace/:chapterId" element={<WorkspacePage />} />
          <Route path="/app/admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
