export type SeriesMemberStatus = "invited" | "active" | "removed" | "paused";

export type SeriesMember = {
  id: string;
  seriesId: string;
  userId: string; // staff id
  roleInSeries: "assistant" | "co-mangaka";
  status: SeriesMemberStatus;
  invitedAt: string;
  activatedAt?: string;
};

export const seriesMembers: SeriesMember[] = [
  { id: "sm_g_jubei", seriesId: "se_ghost", userId: "s_as_jubei", roleInSeries: "assistant", status: "active", invitedAt: "Feb 12, 2026", activatedAt: "Feb 13, 2026" },
  { id: "sm_g_akemi", seriesId: "se_ghost", userId: "s_as_akemi", roleInSeries: "assistant", status: "active", invitedAt: "Feb 15, 2026", activatedAt: "Feb 16, 2026" },
  { id: "sm_g_jotaro", seriesId: "se_ghost", userId: "s_as_jotaro", roleInSeries: "assistant", status: "paused", invitedAt: "Mar 02, 2026", activatedAt: "Mar 03, 2026" },
  { id: "sm_ga_jubei", seriesId: "se_gachi", userId: "s_as_jubei", roleInSeries: "assistant", status: "active", invitedAt: "Jan 22, 2026", activatedAt: "Jan 23, 2026" },
  { id: "sm_ga_akemi", seriesId: "se_gachi", userId: "s_as_akemi", roleInSeries: "assistant", status: "active", invitedAt: "Jan 22, 2026", activatedAt: "Jan 23, 2026" },
  { id: "sm_gk_jotaro", seriesId: "se_goku", userId: "s_as_jotaro", roleInSeries: "assistant", status: "active", invitedAt: "Mar 12, 2026", activatedAt: "Mar 13, 2026" },
  { id: "sm_gk_akemi", seriesId: "se_goku", userId: "s_as_akemi", roleInSeries: "assistant", status: "invited", invitedAt: "Jun 16, 2026" },
  { id: "sm_v_jubei", seriesId: "se_vag", userId: "s_as_jubei", roleInSeries: "assistant", status: "active", invitedAt: "Apr 01, 2026", activatedAt: "Apr 02, 2026" },
  { id: "sm_v_akemi", seriesId: "se_vag", userId: "s_as_akemi", roleInSeries: "assistant", status: "removed", invitedAt: "Apr 01, 2026", activatedAt: "Apr 02, 2026" },
  { id: "sm_op_jotaro", seriesId: "se_op", userId: "s_as_jotaro", roleInSeries: "assistant", status: "active", invitedAt: "Feb 10, 2026", activatedAt: "Feb 11, 2026" },
];

export const membersBySeries = (seriesId: string) =>
  seriesMembers.filter((m) => m.seriesId === seriesId);

export const isAssistantEligible = (userId: string, seriesId: string) =>
  seriesMembers.some(
    (m) => m.userId === userId && m.seriesId === seriesId && m.status === "active",
  );
