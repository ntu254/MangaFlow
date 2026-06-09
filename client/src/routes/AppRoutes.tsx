import { Navigate, Route } from "react-router-dom"
import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute"
import { MarketingLayout } from "@/shared/components/layout/MarketingLayout"
import { AuthLayout } from "@/shared/components/layout/AuthLayout"
import { DashboardLayout } from "@/shared/components/layout/DashboardLayout"
import { LandingPage } from "@/features/marketing/pages/LandingPage"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { AppHomeRedirect } from "./AppHomeRedirect"
import {
  LazyAdminDashboardPage,
  LazyAdminUsersPage,
  LazyAdminBoardMembersPage,
  LazyChapterDetailPage,
  LazyRoleDashboardPage,
  LazySeriesDetailPage,
  LazyTasksPage,
  LazyWorkspacePage,
  LazyAdminSeriesPlaceholder,
  LazyAdminTaskTypesPlaceholder,
  LazyAdminTaskRatesPlaceholder,
  LazyAdminPayrollPlaceholder,
  LazyAdminStoragePlaceholder,
  LazyAdminAiServicePlaceholder,
  LazyAdminAuditLogsPlaceholder,
  LazyAdminSystemHealthPlaceholder,
  LazyMangakaSeriesPlaceholder,
  LazyMangakaManuscriptsPlaceholder,
  LazyMangakaChaptersPlaceholder,
  LazyMangakaTasksPlaceholder,
  LazyMangakaSubmissionsPlaceholder,
  LazyMangakaCommentsPlaceholder,
  LazyMangakaRankingPlaceholder,
  LazyMangakaPayrollPlaceholder,
  LazyAssistantSubmissionsPlaceholder,
  LazyAssistantRevisionsPlaceholder,
  LazyAssistantEarningsPlaceholder,
  LazyEditorSeriesPlaceholder,
  LazyEditorManuscriptsPlaceholder,
  LazyEditorChaptersPlaceholder,
  LazyEditorPagesPlaceholder,
  LazyEditorCommentsPlaceholder,
  LazyEditorTasksPlaceholder,
  LazyEditorPublicationPlaceholder,
  LazyEditorRankingSupportPlaceholder,
  LazyBoardApprovalsPlaceholder,
  LazyBoardVotesPlaceholder,
  LazyBoardRankingPlaceholder,
  LazyBoardRankingImportPlaceholder,
  LazyBoardAtRiskPlaceholder,
  LazyBoardDecisionsPlaceholder,
  LazyNotificationsPlaceholder,
} from "./lazy-routes"
import { APP_ROUTES } from "./app-routes.registry"

export function AppRoutes() {
  const redirectAdmin = <Route path="admin" element={<Navigate to={APP_ROUTES.admin.dashboard} replace />} />

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
            <Route path={APP_ROUTES.admin.dashboard.replace(/^\/app\//, "")} element={<LazyAdminDashboardPage />} />
            <Route path={APP_ROUTES.admin.users.replace(/^\/app\//, "")} element={<LazyAdminUsersPage />} />
            <Route path={APP_ROUTES.admin.boardMembers.replace(/^\/app\//, "")} element={<LazyAdminBoardMembersPage />} />
            {redirectAdmin}
            <Route path={APP_ROUTES.admin.series.replace(/^\/app\//, "")} element={<LazyAdminSeriesPlaceholder />} />
            <Route path={APP_ROUTES.admin.taskTypes.replace(/^\/app\//, "")} element={<LazyAdminTaskTypesPlaceholder />} />
            <Route path={APP_ROUTES.admin.taskRates.replace(/^\/app\//, "")} element={<LazyAdminTaskRatesPlaceholder />} />
            <Route path={APP_ROUTES.admin.payroll.replace(/^\/app\//, "")} element={<LazyAdminPayrollPlaceholder />} />
            <Route path={APP_ROUTES.admin.storage.replace(/^\/app\//, "")} element={<LazyAdminStoragePlaceholder />} />
            <Route path={APP_ROUTES.admin.aiService.replace(/^\/app\//, "")} element={<LazyAdminAiServicePlaceholder />} />
            <Route path={APP_ROUTES.admin.auditLogs.replace(/^\/app\//, "")} element={<LazyAdminAuditLogsPlaceholder />} />
            <Route path={APP_ROUTES.admin.systemHealth.replace(/^\/app\//, "")} element={<LazyAdminSystemHealthPlaceholder />} />
          </Route>

          <Route element={<ProtectedRoute roles={["MANGAKA"]} />}>
            <Route path={APP_ROUTES.mangaka.dashboard.replace(/^\/app\//, "")} element={<LazyRoleDashboardPage />} />
            <Route path={APP_ROUTES.mangaka.series.replace(/^\/app\//, "")} element={<LazyMangakaSeriesPlaceholder />} />
            <Route path={APP_ROUTES.mangaka.manuscripts.replace(/^\/app\//, "")} element={<LazyMangakaManuscriptsPlaceholder />} />
            <Route path={APP_ROUTES.mangaka.chapters.replace(/^\/app\//, "")} element={<LazyMangakaChaptersPlaceholder />} />
            <Route path={APP_ROUTES.mangaka.tasks.replace(/^\/app\//, "")} element={<LazyMangakaTasksPlaceholder />} />
            <Route path={APP_ROUTES.mangaka.submissions.replace(/^\/app\//, "")} element={<LazyMangakaSubmissionsPlaceholder />} />
            <Route path={APP_ROUTES.mangaka.comments.replace(/^\/app\//, "")} element={<LazyMangakaCommentsPlaceholder />} />
            <Route path={APP_ROUTES.mangaka.ranking.replace(/^\/app\//, "")} element={<LazyMangakaRankingPlaceholder />} />
            <Route path={APP_ROUTES.mangaka.payroll.replace(/^\/app\//, "")} element={<LazyMangakaPayrollPlaceholder />} />
          </Route>

          <Route element={<ProtectedRoute roles={["ASSISTANT"]} />}>
            <Route path={APP_ROUTES.assistant.dashboard.replace(/^\/app\//, "")} element={<LazyRoleDashboardPage />} />
            <Route path={APP_ROUTES.assistant.tasks.replace(/^\/app\//, "")} element={<LazyTasksPage />} />
            <Route path={APP_ROUTES.assistant.submissions.replace(/^\/app\//, "")} element={<LazyAssistantSubmissionsPlaceholder />} />
            <Route path={APP_ROUTES.assistant.revisions.replace(/^\/app\//, "")} element={<LazyAssistantRevisionsPlaceholder />} />
            <Route path={APP_ROUTES.assistant.earnings.replace(/^\/app\//, "")} element={<LazyAssistantEarningsPlaceholder />} />
          </Route>

          <Route element={<ProtectedRoute roles={["EDITOR"]} />}>
            <Route path={APP_ROUTES.editor.dashboard.replace(/^\/app\//, "")} element={<LazyRoleDashboardPage />} />
            <Route path={APP_ROUTES.editor.series.replace(/^\/app\//, "")} element={<LazyEditorSeriesPlaceholder />} />
            <Route path={APP_ROUTES.editor.manuscripts.replace(/^\/app\//, "")} element={<LazyEditorManuscriptsPlaceholder />} />
            <Route path={APP_ROUTES.editor.chapters.replace(/^\/app\//, "")} element={<LazyEditorChaptersPlaceholder />} />
            <Route path={APP_ROUTES.editor.pages.replace(/^\/app\//, "")} element={<LazyEditorPagesPlaceholder />} />
            <Route path={APP_ROUTES.editor.comments.replace(/^\/app\//, "")} element={<LazyEditorCommentsPlaceholder />} />
            <Route path={APP_ROUTES.editor.tasks.replace(/^\/app\//, "")} element={<LazyEditorTasksPlaceholder />} />
            <Route path={APP_ROUTES.editor.publication.replace(/^\/app\//, "")} element={<LazyEditorPublicationPlaceholder />} />
            <Route path={APP_ROUTES.editor.rankingSupport.replace(/^\/app\//, "")} element={<LazyEditorRankingSupportPlaceholder />} />
          </Route>

          <Route element={<ProtectedRoute roles={["BOARD"]} />}>
            <Route path={APP_ROUTES.board.dashboard.replace(/^\/app\//, "")} element={<LazyRoleDashboardPage />} />
            <Route path={APP_ROUTES.board.approvals.replace(/^\/app\//, "")} element={<LazyBoardApprovalsPlaceholder />} />
            <Route path={APP_ROUTES.board.votes.replace(/^\/app\//, "")} element={<LazyBoardVotesPlaceholder />} />
            <Route path={APP_ROUTES.board.ranking.replace(/^\/app\//, "")} element={<LazyBoardRankingPlaceholder />} />
            <Route path={APP_ROUTES.board.rankingImport.replace(/^\/app\//, "")} element={<LazyBoardRankingImportPlaceholder />} />
            <Route path={APP_ROUTES.board.atRisk.replace(/^\/app\//, "")} element={<LazyBoardAtRiskPlaceholder />} />
            <Route path={APP_ROUTES.board.decisions.replace(/^\/app\//, "")} element={<LazyBoardDecisionsPlaceholder />} />
          </Route>

          <Route path={APP_ROUTES.shared.notifications.replace(/^\/app\//, "")} element={<LazyNotificationsPlaceholder />} />
          <Route path="workspace/:taskId" element={<LazyWorkspacePage />} />
          <Route path="series/:id" element={<LazySeriesDetailPage />} />
          <Route path="chapters/:id" element={<LazyChapterDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </>
  )
}
