import { Suspense, type ReactNode } from "react"
import { type RouteObject, Navigate, createBrowserRouter } from "react-router-dom"
import { ProtectedRoute } from "@/shared/components/auth/ProtectedRoute"
import { MFRouteSkeleton } from "@/shared/components/feedback/MFRouteSkeleton"
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
  LazyAdminTaskRatesPage,
  LazyAdminPayrollPage,
  LazyAdminStoragePlaceholder,
  LazyAdminAiServicePlaceholder,
  LazyAdminAuditLogsPlaceholder,
  LazyAdminSystemHealthPage,
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

function withRouteSkeleton(children: ReactNode, title: string, description?: string) {
  return (
    <Suspense fallback={<MFRouteSkeleton title={title} description={description} />}>
      {children}
    </Suspense>
  )
}

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
              { path: APP_ROUTES.admin.taskRates.replace(/^\/app\//, ""), element: <LazyAdminTaskRatesPage /> },
              { path: APP_ROUTES.admin.payroll.replace(/^\/app\//, ""), element: <LazyAdminPayrollPage /> },
              { path: APP_ROUTES.admin.storage.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyAdminStoragePlaceholder />, "Storage", "Loading storage monitor placeholder.") },
              { path: APP_ROUTES.admin.aiService.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyAdminAiServicePlaceholder />, "AI Service", "Loading AI service monitor placeholder.") },
              { path: APP_ROUTES.admin.auditLogs.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyAdminAuditLogsPlaceholder />, "Audit Logs", "Loading audit logs placeholder.") },
              { path: APP_ROUTES.admin.systemHealth.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyAdminSystemHealthPage />, "System Health", "Loading backend-owned system health summary.") },
            ],
          },
          {
            element: <ProtectedRoute roles={["MANGAKA"]} />,
            children: [
              { path: APP_ROUTES.mangaka.dashboard.replace(/^\/app\//, ""), element: <LazyRoleDashboardPage /> },
              { path: APP_ROUTES.mangaka.series.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyMangakaSeriesPlaceholder />, "My Series") },
              { path: APP_ROUTES.mangaka.manuscripts.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyMangakaManuscriptsPlaceholder />, "Manuscripts") },
              { path: APP_ROUTES.mangaka.chapters.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyMangakaChaptersPlaceholder />, "Chapters") },
              { path: APP_ROUTES.mangaka.tasks.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyMangakaTasksPlaceholder />, "Tasks") },
              { path: APP_ROUTES.mangaka.submissions.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyMangakaSubmissionsPlaceholder />, "Submissions") },
              { path: APP_ROUTES.mangaka.comments.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyMangakaCommentsPlaceholder />, "Comments") },
              { path: APP_ROUTES.mangaka.ranking.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyMangakaRankingPlaceholder />, "Ranking") },
              { path: APP_ROUTES.mangaka.payroll.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyMangakaPayrollPlaceholder />, "Payroll") },
            ],
          },
          {
            element: <ProtectedRoute roles={["ASSISTANT"]} />,
            children: [
              { path: APP_ROUTES.assistant.dashboard.replace(/^\/app\//, ""), element: <LazyRoleDashboardPage /> },
              { path: APP_ROUTES.assistant.tasks.replace(/^\/app\//, ""), element: <LazyTasksPage /> },
              { path: APP_ROUTES.assistant.submissions.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyAssistantSubmissionsPlaceholder />, "Submissions") },
              { path: APP_ROUTES.assistant.revisions.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyAssistantRevisionsPlaceholder />, "Revisions") },
              { path: APP_ROUTES.assistant.earnings.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyAssistantEarningsPlaceholder />, "Earnings") },
            ],
          },
          {
            element: <ProtectedRoute roles={["EDITOR"]} />,
            children: [
              { path: APP_ROUTES.editor.dashboard.replace(/^\/app\//, ""), element: <LazyRoleDashboardPage /> },
              { path: APP_ROUTES.editor.series.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyEditorSeriesPlaceholder />, "Assigned Series") },
              { path: APP_ROUTES.editor.manuscripts.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyEditorManuscriptsPlaceholder />, "Manuscript Review") },
              { path: APP_ROUTES.editor.chapters.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyEditorChaptersPlaceholder />, "Chapter Review") },
              { path: APP_ROUTES.editor.pages.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyEditorPagesPlaceholder />, "Page Review") },
              { path: APP_ROUTES.editor.comments.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyEditorCommentsPlaceholder />, "Comments") },
              { path: APP_ROUTES.editor.tasks.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyEditorTasksPlaceholder />, "Tasks") },
              { path: APP_ROUTES.editor.publication.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyEditorPublicationPlaceholder />, "Publication") },
              { path: APP_ROUTES.editor.rankingSupport.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyEditorRankingSupportPlaceholder />, "Ranking Support") },
            ],
          },
          {
            element: <ProtectedRoute roles={["BOARD"]} />,
            children: [
              { path: APP_ROUTES.board.dashboard.replace(/^\/app\//, ""), element: <LazyRoleDashboardPage /> },
              { path: APP_ROUTES.board.approvals.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyBoardApprovalsPlaceholder />, "Series Approvals") },
              { path: APP_ROUTES.board.votes.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyBoardVotesPlaceholder />, "My Votes") },
              { path: APP_ROUTES.board.ranking.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyBoardRankingPlaceholder />, "Ranking") },
              { path: APP_ROUTES.board.rankingImport.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyBoardRankingImportPlaceholder />, "Import Ranking") },
              { path: APP_ROUTES.board.atRisk.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyBoardAtRiskPlaceholder />, "At-Risk Series") },
              { path: APP_ROUTES.board.decisions.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyBoardDecisionsPlaceholder />, "Decisions") },
            ],
          },

          { path: APP_ROUTES.shared.notifications.replace(/^\/app\//, ""), element: withRouteSkeleton(<LazyNotificationsPlaceholder />, "Notifications") },
          { path: "workspace/:taskId", element: withRouteSkeleton(<LazyWorkspacePage />, "Workspace") },
          { path: "series/:id", element: withRouteSkeleton(<LazySeriesDetailPage />, "Series Detail") },
          { path: "chapters/:id", element: withRouteSkeleton(<LazyChapterDetailPage />, "Chapter Detail") },
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
