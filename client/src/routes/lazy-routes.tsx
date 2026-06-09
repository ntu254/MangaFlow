import { lazy } from "react";
import { ComingSoonPage } from "@/shared/components/feedback/ComingSoonPage";

function lazyComingSoon(_path: string, title: string, description?: string) {
  return lazy(() =>
    Promise.resolve({
      default: () => <ComingSoonPage title={title} description={description} />,
    }),
  );
}

export const LazyAdminDashboardPage = lazy(() =>
  import("@/features/admin/pages/AdminDashboardPage").then((m) => ({
    default: m.AdminDashboardPage,
  })),
);
export const LazyAdminUsersPage = lazy(() =>
  import("@/features/admin/pages/AdminUsersPage").then((m) => ({
    default: m.AdminUsersPage,
  })),
);
export const LazyAdminBoardMembersPage = lazy(() =>
  import("@/features/admin/pages/AdminBoardMembersPage").then((m) => ({
    default: m.AdminBoardMembersPage,
  })),
);
export const LazyBoardPage = lazy(() =>
  import("@/features/board/pages/BoardPage").then((m) => ({
    default: m.BoardPage,
  })),
);
export const LazyChapterDetailPage = lazy(() =>
  import("@/features/chapter/pages/ChapterDetailPage").then((m) => ({
    default: m.ChapterDetailPage,
  })),
);
export const LazyRoleDashboardPage = lazy(() =>
  import("@/features/dashboard/pages/RoleDashboardPage").then((m) => ({
    default: m.RoleDashboardPage,
  })),
);
export const LazyReviewPage = lazy(() =>
  import("@/features/review/pages/ReviewPage").then((m) => ({
    default: m.ReviewPage,
  })),
);
export const LazySeriesDetailPage = lazy(() =>
  import("@/features/series/pages/SeriesDetailPage").then((m) => ({
    default: m.SeriesDetailPage,
  })),
);
export const LazySeriesPage = lazy(() =>
  import("@/features/series/pages/SeriesPage").then((m) => ({
    default: m.SeriesPage,
  })),
);
export const LazyTasksPage = lazy(() =>
  import("@/features/task/pages/TasksPage").then((m) => ({
    default: m.TasksPage,
  })),
);
export const LazyWorkspacePage = lazy(() =>
  import("@/features/workspace/pages/WorkspacePage").then((m) => ({
    default: m.WorkspacePage,
  })),
);

// Placeholder shells for reserved routes not yet wired to real pages.
export const LazyAdminSeriesPlaceholder = lazyComingSoon(
  "/app/admin/series",
  "Series Monitor",
  "View all series, statuses, owners, and editors. Admin observes; Board approval remains Board-owned.",
);
export const LazyAdminTaskTypesPlaceholder = lazyComingSoon(
  "/app/admin/task-types",
  "Task Types",
  "Configure production task types such as translation, cleanup, and lettering.",
);
export const LazyAdminTaskRatesPlaceholder = lazyComingSoon(
  "/app/admin/task-rates",
  "Task Rates",
  "Configure default task-rate references for payroll tracking.",
);
export const LazyAdminPayrollPlaceholder = lazyComingSoon(
  "/app/admin/payroll",
  "Payroll Tracking",
  "Monitor pending, confirmed, and paid assistant earnings without bypassing approval rules.",
);
export const LazyAdminStoragePlaceholder = lazyComingSoon(
  "/app/admin/storage",
  "Storage",
  "Monitor R2/MinIO usage, file assets, and signed URL access warnings.",
);
export const LazyAdminAiServicePlaceholder = lazyComingSoon(
  "/app/admin/ai-service",
  "AI Service",
  "Monitor AI health and bubble detect/process integration status through backend-owned checks.",
);
export const LazyAdminAuditLogsPlaceholder = lazyComingSoon(
  "/app/admin/audit-logs",
  "Audit Logs",
  "Review critical system, access, workflow, and storage events.",
);
export const LazyAdminSystemHealthPlaceholder = lazyComingSoon(
  "/app/admin/system-health",
  "System Health",
  "Monitor MongoDB, API, storage, AI, env warnings, and runtime hardening status.",
);

export const LazyMangakaSeriesPlaceholder = lazyComingSoon(
  "/app/mangaka/series",
  "My Series",
  "Manage owned series and editorial status.",
);
export const LazyMangakaManuscriptsPlaceholder = lazyComingSoon(
  "/app/mangaka/manuscripts",
  "Manuscripts",
  "Upload and revise manuscript submissions.",
);
export const LazyMangakaChaptersPlaceholder = lazyComingSoon(
  "/app/mangaka/chapters",
  "Chapters",
  "Review chapter state and publish readiness.",
);
export const LazyMangakaTasksPlaceholder = lazyComingSoon(
  "/app/mangaka/tasks",
  "Tasks",
  "View tasks and assignment status.",
);
export const LazyMangakaSubmissionsPlaceholder = lazyComingSoon(
  "/app/mangaka/submissions",
  "Submissions",
  "Track submission and review feedback.",
);
export const LazyMangakaCommentsPlaceholder = lazyComingSoon(
  "/app/mangaka/comments",
  "Comments",
  "Review threaded comments on content.",
);
export const LazyMangakaRankingPlaceholder = lazyComingSoon(
  "/app/mangaka/ranking",
  "Ranking",
  "View ranking signals for owned series.",
);
export const LazyMangakaPayrollPlaceholder = lazyComingSoon(
  "/app/mangaka/payroll",
  "Payroll",
  "Review payroll and earning summaries.",
);

export const LazyAssistantSubmissionsPlaceholder = lazyComingSoon(
  "/app/assistant/submissions",
  "Submissions",
  "Review submitted work and statuses.",
);
export const LazyAssistantRevisionsPlaceholder = lazyComingSoon(
  "/app/assistant/revisions",
  "Revisions",
  "Manage revision requests and updated files.",
);
export const LazyAssistantEarningsPlaceholder = lazyComingSoon(
  "/app/assistant/earnings",
  "Earnings",
  "Monitor task earnings and payout status.",
);

export const LazyEditorSeriesPlaceholder = lazyComingSoon(
  "/app/editor/series",
  "Assigned Series",
  "Manage series assigned for editorial flow.",
);
export const LazyEditorManuscriptsPlaceholder = lazyComingSoon(
  "/app/editor/manuscripts",
  "Manuscript Review",
  "Review and annotate manuscript uploads.",
);
export const LazyEditorChaptersPlaceholder = lazyComingSoon(
  "/app/editor/chapters",
  "Chapter Review",
  "Review chapter packaging and readiness.",
);
export const LazyEditorPagesPlaceholder = lazyComingSoon(
  "/app/editor/pages",
  "Page Review",
  "Review page-level quality and notes.",
);
export const LazyEditorCommentsPlaceholder = lazyComingSoon(
  "/app/editor/comments",
  "Comments",
  "Resolve editorial comments and threads.",
);
export const LazyEditorTasksPlaceholder = lazyComingSoon(
  "/app/editor/tasks",
  "Tasks",
  "Track editorial task assignments.",
);
export const LazyEditorPublicationPlaceholder = lazyComingSoon(
  "/app/editor/publication",
  "Publication",
  "Coordinate release scheduling and publish actions.",
);
export const LazyEditorRankingSupportPlaceholder = lazyComingSoon(
  "/app/editor/ranking-support",
  "Ranking Support",
  "Provide ranking inputs and editorial context.",
);

export const LazyBoardApprovalsPlaceholder = lazyComingSoon(
  "/app/board/series-approvals",
  "Series Approvals",
  "Review pending series approval requests.",
);
export const LazyBoardVotesPlaceholder = lazyComingSoon(
  "/app/board/votes",
  "My Votes",
  "Review personal voting activity and pending ballots.",
);
export const LazyBoardRankingPlaceholder = lazyComingSoon(
  "/app/board/ranking",
  "Ranking",
  "Review ranking outputs and supporting metrics.",
);
export const LazyBoardRankingImportPlaceholder = lazyComingSoon(
  "/app/board/ranking/import",
  "Import Ranking",
  "Import ranking artifacts and validation snapshots.",
);
export const LazyBoardAtRiskPlaceholder = lazyComingSoon(
  "/app/board/at-risk",
  "At-Risk Series",
  "Monitor series flagged with risk signals.",
);
export const LazyBoardDecisionsPlaceholder = lazyComingSoon(
  "/app/board/decisions",
  "Decisions",
  "Review recent Board decisions and appeals.",
);

export const LazyNotificationsPlaceholder = lazyComingSoon(
  "/app/notifications",
  "Notifications",
  "Central inbox for alerts, assignments, and workflow updates.",
);
