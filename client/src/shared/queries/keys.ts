import type { QueryClient } from "@tanstack/react-query";

/**
 * Centralized React Query key factory. Keep stable shapes so invalidations
 * stay surgical: qk.users.list() -> ["users", "list"].
 */
export const qk = {
  auth: {
    me: () => ["auth", "me"] as const,
  },
  users: {
    list: () => ["users", "list"] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },
  boardMembers: {
    list: () => ["board-members", "list"] as const,
  },
  dashboard: {
    root: ["dashboard"] as const,
    byRole: (role: string) => ["dashboard", role] as const,
  },
  series: {
    root: ["series"] as const,
    list: () => ["series"] as const,
    detail: (id: string) => ["series", id] as const,
    summary: (id: string) => ["series", id, "summary"] as const,
    members: (id: string) => ["series", id, "members"] as const,
    memberships: () => ["series", "memberships", "my"] as const,
    manuscriptVerify: (id: string) => ["series", id, "manuscripts", "verify"] as const,
  },
  chapters: {
    root: ["chapters"] as const,
    detail: (id: string) => ["chapter", id] as const,
    pages: (chapterId: string | undefined) => ["chapter-pages", chapterId] as const,
  },
  chapterReviews: {
    byChapter: (chapterId: string | undefined) => ["chapter-review-versions", chapterId] as const,
    detail: (versionId: string | undefined) => ["chapter-review-version", versionId] as const,
  },
  tasks: {
    root: ["tasks"] as const,
    mine: () => ["tasks", "my"] as const,
    bySeries: (seriesId: string) => ["tasks", "series", seriesId] as const,
    detail: (taskId: string) => ["tasks", "detail", taskId] as const,
    types: {
      active: () => ["task-types", "active"] as const,
    },
  },
  submissions: {
    root: ["submissions"] as const,
    byTask: (taskId: string) => ["submissions", "task", taskId] as const,
    reviewQueue: (seriesId?: string) => ["submissions", "review-queue", seriesId ?? "all"] as const,
  },
  editor: {
    seriesReviewQueue: () => ["editor", "series-review-queue"] as const,
    seriesReview: (seriesId: string) => ["editor", "series-review", seriesId] as const,
    finalReviewQueue: (seriesId?: string) =>
      ["editor", "final-review-queue", seriesId ?? "all"] as const,
    chapterReviewQueue: () => ["editor", "chapter-review-queue"] as const,
    task: (taskId: string) => ["editor", "task", taskId] as const,
    managedSeries: () => ["editor", "managed-series"] as const,
    productionProgress: () => ["editor", "production-progress"] as const,
    rankingRisk: () => ["editor", "ranking-risk"] as const,
    decisionHistory: () => ["editor", "decision-history"] as const,
    activity: () => ["editor", "activity"] as const,
  },
  board: {
    seriesReviewQueue: () => ["board", "series-review-queue"] as const,
  },
  admin: {
    taskRates: () => ["admin", "task-rates"] as const,
    auditLogs: (filters?: unknown) => ["admin", "audit-logs", filters] as const,
  },
  files: {
    downloadUrl: (fileAssetId: string | undefined) => ["file-download-url", fileAssetId] as const,
    objectUrl: (fileAssetId: string | undefined) => ["file-object-url", fileAssetId] as const,
  },
  pages: {
    studio: (pageId: string) => ["page", pageId, "studio"] as const,
  },
  comments: {
    root: ["comments"] as const,
    byTask: (taskId: string) => ["comments", "task", taskId] as const,
  },
};

export function invalidateSeries(queryClient: QueryClient, seriesId?: string) {
  queryClient.invalidateQueries({ queryKey: qk.series.root });
  if (!seriesId) return;
  queryClient.invalidateQueries({ queryKey: qk.series.detail(seriesId) });
  queryClient.invalidateQueries({ queryKey: qk.series.summary(seriesId) });
}

export function invalidateSeriesMembers(queryClient: QueryClient, seriesId: string) {
  queryClient.invalidateQueries({ queryKey: qk.series.members(seriesId) });
  queryClient.invalidateQueries({ queryKey: qk.series.summary(seriesId) });
}

export function invalidateChapterPages(queryClient: QueryClient, chapterId: string) {
  queryClient.invalidateQueries({ queryKey: qk.chapters.pages(chapterId) });
  queryClient.invalidateQueries({ queryKey: qk.chapters.detail(chapterId) });
}

export function invalidatePageStudio(queryClient: QueryClient, pageId: string) {
  queryClient.invalidateQueries({ queryKey: qk.pages.studio(pageId) });
}

export function invalidateTasks(
  queryClient: QueryClient,
  options?: { taskId?: string; seriesId?: string },
) {
  queryClient.invalidateQueries({ queryKey: qk.tasks.root });
  queryClient.invalidateQueries({ queryKey: qk.tasks.mine() });
  if (options?.taskId) {
    queryClient.invalidateQueries({ queryKey: qk.tasks.detail(options.taskId) });
  }
  if (options?.seriesId) {
    queryClient.invalidateQueries({ queryKey: qk.tasks.bySeries(options.seriesId) });
  }
}

export function invalidateSubmissions(queryClient: QueryClient, taskId?: string) {
  queryClient.invalidateQueries({ queryKey: qk.submissions.root });
  if (taskId) {
    queryClient.invalidateQueries({ queryKey: qk.submissions.byTask(taskId) });
  }
}
