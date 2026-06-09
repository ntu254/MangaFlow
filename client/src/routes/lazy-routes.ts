import { lazy } from "react";

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
