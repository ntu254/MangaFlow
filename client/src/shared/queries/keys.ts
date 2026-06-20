/**
 * Centralised React Query key factory. Keep stable shape so invalidations
 * stay surgical:  qk.users.list()  →  ['users', 'list']
 */
export const qk = {
  auth: {
    me: () => ["auth", "me"] as const,
  },
  users: {
    list: () => ["users", "list"] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },
  dashboard: {
    root: ["dashboard"] as const,
    byRole: (role: string) => ["dashboard", role] as const,
  },
  tasks: {
    root: ["tasks"] as const,
    mine: () => ["tasks", "my"] as const,
  },
  submissions: {
    root: ["submissions"] as const,
    byTask: (taskId: string) => ["submissions", "task", taskId] as const,
    reviewQueue: (seriesId?: string) =>
      ["submissions", "review-queue", seriesId ?? "all"] as const,
  },
  pages: {
    studio: (pageId: string) => ["page", pageId, "studio"] as const,
  },
};
