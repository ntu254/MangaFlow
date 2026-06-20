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
    byRole: (role: string) => ["dashboard", role] as const,
  },
};
