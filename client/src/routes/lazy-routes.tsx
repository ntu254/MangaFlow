import { lazy } from "react"
export const LazyAdminDashboardPage = lazy(() =>
  import("@/features/admin/pages/AdminDashboardPage").then((m) => ({
    default: m.AdminDashboardPage,
  })),
)
export const LazyAdminUsersPage = lazy(() =>
  import("@/features/admin/pages/AdminUsersPage").then((m) => ({
    default: m.AdminUsersPage,
  })),
)
export const LazyAdminBoardMembersPage = lazy(() =>
  import("@/features/admin/pages/AdminBoardMembersPage").then((m) => ({
    default: m.AdminBoardMembersPage,
  })),
)
export const LazyAdminSeriesMonitorPage = lazy(() =>
  import("@/features/admin/pages/AdminSeriesMonitorPage").then((m) => ({
    default: m.AdminSeriesMonitorPage,
  })),
)
export const LazyAdminTaskTypesPage = lazy(() =>
  import("@/features/admin/pages/AdminTaskTypesPage").then((m) => ({
    default: m.AdminTaskTypesPage,
  })),
)
export const LazyAdminTaskRatesPage = lazy(() =>
  import("@/features/admin/pages/AdminTaskRatesPage").then((m) => ({
    default: m.AdminTaskRatesPage,
  })),
)
export const LazyAdminPayrollPage = lazy(() =>
  import("@/features/admin/pages/AdminPayrollPage").then((m) => ({
    default: m.AdminPayrollPage,
  })),
)
export const LazyAdminSystemHealthPage = lazy(() =>
  import("@/features/admin/pages/AdminSystemHealthPage").then((m) => ({
    default: m.AdminSystemHealthPage,
  })),
)
export const LazyBoardPage = lazy(() =>
  import("@/features/board/pages/BoardPage").then((m) => ({
    default: m.BoardPage,
  })),
)
export const LazyChapterDetailPage = lazy(() =>
  import("@/features/chapter/pages/ChapterDetailPage").then((m) => ({
    default: m.ChapterDetailPage,
  })),
)
export const LazyRoleDashboardPage = lazy(() =>
  import("@/features/dashboard/pages/RoleDashboardPage").then((m) => ({
    default: m.RoleDashboardPage,
  })),
)
export const LazyReviewPage = lazy(() =>
  import("@/features/review/pages/ReviewPage").then((m) => ({
    default: m.ReviewPage,
  })),
)
export const LazySeriesDetailPage = lazy(() =>
  import("@/features/series/pages/SeriesDetailPage").then((m) => ({
    default: m.SeriesDetailPage,
  })),
)
export const LazySeriesPage = lazy(() =>
  import("@/features/series/pages/SeriesPage").then((m) => ({
    default: m.SeriesPage,
  })),
)
export const LazyTasksPage = lazy(() =>
  import("@/features/task/pages/TasksPage").then((m) => ({
    default: m.TasksPage,
  })),
)
export const LazyWorkspacePage = lazy(() =>
  import("@/features/workspace/pages/WorkspacePage").then((m) => ({
    default: m.WorkspacePage,
  })),
)

// Role-specific pages already built
export const LazyAssistantEarningsPage = lazy(() =>
  import("@/features/payroll/pages/AssistantEarningsPage").then((m) => ({
    default: m.AssistantEarningsPage,
  })),
)
export const LazyEditorPublicationPage = lazy(() =>
  import("@/features/publication/pages/EditorPublicationPage").then((m) => ({
    default: m.EditorPublicationPage,
  })),
)
export const LazyMangakaManuscriptsPage = lazy(() =>
  import("@/features/manuscript/pages/MangakaManuscriptsPage").then((m) => ({
    default: m.MangakaManuscriptsPage,
  })),
)
export const LazyAssistantSubmissionsPage = lazy(() =>
  import("@/features/submission/pages/AssistantSubmissionsPage").then((m) => ({
    default: m.AssistantSubmissionsPage,
  })),
)
export const LazyAssistantRevisionsPage = lazy(() =>
  import("@/features/submission/pages/AssistantRevisionsPage").then((m) => ({
    default: m.AssistantRevisionsPage,
  })),
)
export const LazyMangakaPayrollPage = lazy(() =>
  import("@/features/payroll/pages/MangakaPayrollPage").then((m) => ({
    default: m.MangakaPayrollPage,
  })),
)
export const LazyMangakaRankingPage = lazy(() =>
  import("@/features/ranking/pages/MangakaRankingPage").then((m) => ({
    default: m.MangakaRankingPage,
  })),
)
export const LazyNotificationsPage = lazy(() =>
  import("@/features/notifications/pages/NotificationsPage").then((m) => ({
    default: m.NotificationsPage,
  })),
)

export const LazyAdminStoragePage = lazy(() =>
  import("@/features/admin/pages/AdminStoragePage").then((m) => ({
    default: m.AdminStoragePage,
  })),
)
export const LazyAdminAiServicePage = lazy(() =>
  import("@/features/admin/pages/AdminAiServicePage").then((m) => ({
    default: m.AdminAiServicePage,
  })),
)
export const LazyAdminAuditLogsPage = lazy(() =>
  import("@/features/admin/pages/AdminAuditLogsPage").then((m) => ({
    default: m.AdminAuditLogsPage,
  })),
)

export const LazyEditorRankingSupportPage = lazy(() =>
  import("@/features/editor/pages/EditorRankingSupportPage").then((m) => ({
    default: m.EditorRankingSupportPage,
  })),
)
