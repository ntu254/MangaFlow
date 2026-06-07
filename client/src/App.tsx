import { Routes, Route } from "react-router-dom"
import { MarketingLayout } from "@/shared/components/layout/MarketingLayout"
import { AuthLayout } from "@/shared/components/layout/AuthLayout"
import { DashboardLayout } from "@/shared/components/layout/DashboardLayout"
import { LandingPage } from "@/features/marketing/pages/LandingPage"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { RegisterPage } from "@/features/auth/pages/RegisterPage"
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
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<LandingPage />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/series" element={<SeriesListPage />} />
        <Route path="/series/:id" element={<SeriesDetailPage />} />
        <Route path="/chapters/:id" element={<ChapterDetailPage />} />
        <Route path="/tasks" element={<TaskListPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/board" element={<BoardPage />} />
        <Route path="/workspace/:chapterId" element={<WorkspacePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  )
}

export default App
