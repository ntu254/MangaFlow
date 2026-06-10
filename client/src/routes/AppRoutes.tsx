import { Suspense } from "react"
import { type RouteObject, Navigate, createBrowserRouter } from "react-router-dom"
import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute"
import { MarketingLayout } from "@/shared/components/layout/MarketingLayout"
import { AuthLayout } from "@/shared/components/layout/AuthLayout"
import { DashboardLayout } from "@/shared/components/layout/DashboardLayout"
import { LandingPage } from "@/features/marketing/pages/LandingPage"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { AppHomeRedirect } from "./AppHomeRedirect"
import { APP_ROUTES } from "./app-routes.registry"
import {
  LazyAdminDashboardPage,
  LazyAdminUsersPage,
  LazyAdminBoardMembersPage,
  LazyAdminSeriesMonitorPage,
  LazyAdminTaskTypesPage,
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
  LazyRoleDashboardPage,
  LazyTasksPage,
  LazyWorkspacePage,
  LazySeriesDetailPage,
  LazyChapterDetailPage,
} from "@/routes/lazy-routes"

export const routes: RouteObject[] = [
  {
    element: <MarketingLayout />,
    children: [
      { index: true, element: <LandingPage /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <Navigate to="/login" replace /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <AppHomeRedirect /> },
          { path: "dashboard", element: <AppHomeRedirect /> },

          {
            path: ":role",
            children: [
              { index: true, element: <AppHomeRedirect /> },
              {
                element: <ProtectedRoute />,
                children: [
                  { path: "dashboard", element: <LazyRoleDashboardPage /> },
                ],
              },
            ],
          },
          {
            element: <ProtectedRoute roles={["ADMIN"]} />,
            children: [
              { path: APP_ROUTES.admin.dashboard.replace(/^\/app\//, ""), element: <LazyAdminDashboardPage /> },
              { path: APP_ROUTES.admin.users.replace(/^\/app\//, ""), element: <LazyAdminUsersPage /> },
              { path: APP_ROUTES.admin.boardMembers.replace(/^\/app\//, ""), element: <LazyAdminBoardMembersPage /> },
              { path: "admin", element: <Navigate to={APP_ROUTES.admin.dashboard} replace /> },
              { path: APP_ROUTES.admin.series.replace(/^\/app\//, ""), element: <LazyAdminSeriesMonitorPage /> },
              { path: APP_ROUTES.admin.taskTypes.replace(/^\/app\//, ""), element: <LazyAdminTaskTypesPage /> },
              { path: APP_ROUTES.admin.taskRates.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyAdminTaskRatesPlaceholder /></Suspense> },
              { path: APP_ROUTES.admin.payroll.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyAdminPayrollPlaceholder /></Suspense> },
              { path: APP_ROUTES.admin.storage.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyAdminStoragePlaceholder /></Suspense> },
              { path: APP_ROUTES.admin.aiService.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyAdminAiServicePlaceholder /></Suspense> },
              { path: APP_ROUTES.admin.auditLogs.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyAdminAuditLogsPlaceholder /></Suspense> },
              { path: APP_ROUTES.admin.systemHealth.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyAdminSystemHealthPlaceholder /></Suspense> },
            ],
          },
          {
            element: <ProtectedRoute roles={["MANGAKA"]} />,
            children: [
              { path: APP_ROUTES.mangaka.dashboard.replace(/^\/app\//, ""), element: <LazyRoleDashboardPage /> },
              { path: APP_ROUTES.mangaka.series.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyMangakaSeriesPlaceholder /></Suspense> },
              { path: APP_ROUTES.mangaka.manuscripts.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyMangakaManuscriptsPlaceholder /></Suspense> },
              { path: APP_ROUTES.mangaka.chapters.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyMangakaChaptersPlaceholder /></Suspense> },
              { path: APP_ROUTES.mangaka.tasks.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyMangakaTasksPlaceholder /></Suspense> },
              { path: APP_ROUTES.mangaka.submissions.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyMangakaSubmissionsPlaceholder /></Suspense> },
              { path: APP_ROUTES.mangaka.comments.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyMangakaCommentsPlaceholder /></Suspense> },
              { path: APP_ROUTES.mangaka.ranking.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyMangakaRankingPlaceholder /></Suspense> },
              { path: APP_ROUTES.mangaka.payroll.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyMangakaPayrollPlaceholder /></Suspense> },
            ],
          },
          {
            element: <ProtectedRoute roles={["ASSISTANT"]} />,
            children: [
              { path: APP_ROUTES.assistant.dashboard.replace(/^\/app\//, ""), element: <LazyRoleDashboardPage /> },
              { path: APP_ROUTES.assistant.tasks.replace(/^\/app\//, ""), element: <LazyTasksPage /> },
              { path: APP_ROUTES.assistant.submissions.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyAssistantSubmissionsPlaceholder /></Suspense> },
              { path: APP_ROUTES.assistant.revisions.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyAssistantRevisionsPlaceholder /></Suspense> },
              { path: APP_ROUTES.assistant.earnings.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyAssistantEarningsPlaceholder /></Suspense> },
            ],
          },
          {
            element: <ProtectedRoute roles={["EDITOR"]} />,
            children: [
              { path: APP_ROUTES.editor.dashboard.replace(/^\/app\//, ""), element: <LazyRoleDashboardPage /> },
              { path: APP_ROUTES.editor.series.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyEditorSeriesPlaceholder /></Suspense> },
              { path: APP_ROUTES.editor.manuscripts.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyEditorManuscriptsPlaceholder /></Suspense> },
              { path: APP_ROUTES.editor.chapters.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyEditorChaptersPlaceholder /></Suspense> },
              { path: APP_ROUTES.editor.pages.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyEditorPagesPlaceholder /></Suspense> },
              { path: APP_ROUTES.editor.comments.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyEditorCommentsPlaceholder /></Suspense> },
              { path: APP_ROUTES.editor.tasks.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyEditorTasksPlaceholder /></Suspense> },
              { path: APP_ROUTES.editor.publication.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyEditorPublicationPlaceholder /></Suspense> },
              { path: APP_ROUTES.editor.rankingSupport.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyEditorRankingSupportPlaceholder /></Suspense> },
            ],
          },
          {
            element: <ProtectedRoute roles={["BOARD"]} />,
            children: [
              { path: APP_ROUTES.board.dashboard.replace(/^\/app\//, ""), element: <LazyRoleDashboardPage /> },
              { path: APP_ROUTES.board.approvals.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyBoardApprovalsPlaceholder /></Suspense> },
              { path: APP_ROUTES.board.votes.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyBoardVotesPlaceholder /></Suspense> },
              { path: APP_ROUTES.board.ranking.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyBoardRankingPlaceholder /></Suspense> },
              { path: APP_ROUTES.board.rankingImport.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyBoardRankingImportPlaceholder /></Suspense> },
              { path: APP_ROUTES.board.atRisk.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyBoardAtRiskPlaceholder /></Suspense> },
              { path: APP_ROUTES.board.decisions.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyBoardDecisionsPlaceholder /></Suspense> },
            ],
          },

          { path: APP_ROUTES.shared.notifications.replace(/^\/app\//, ""), element: <Suspense fallback={null}><LazyNotificationsPlaceholder /></Suspense> },
          { path: "workspace/:taskId", element: <Suspense fallback={null}><LazyWorkspacePage /></Suspense> },
          { path: "series/:id", element: <Suspense fallback={null}><LazySeriesDetailPage /></Suspense> },
          { path: "chapters/:id", element: <Suspense fallback={null}><LazyChapterDetailPage /></Suspense> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]

export const router = createBrowserRouter(routes)

export function AppRoutes() {
  return router
}
