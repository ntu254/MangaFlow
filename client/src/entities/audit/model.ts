export type AuditEntity =
  | "user"
  | "series"
  | "proposal"
  | "manuscript"
  | "chapter"
  | "page"
  | "region"
  | "ai-result"
  | "series-member"
  | "task"
  | "submission";

export type AuditEvent = {
  id: string;
  type: string; // e.g. SERIES_SUBMITTED_TO_EDITOR
  actorId: string;
  entity: AuditEntity;
  entityId: string;
  at: string;
  payload?: Record<string, unknown>;
};

export const seedAudit: AuditEvent[] = [
  {
    id: "au_1",
    type: "SERIES_CREATED",
    actorId: "s_man_kei",
    entity: "series",
    entityId: "se_slam",
    at: "Jun 12, 2026 · 09:00",
  },
  {
    id: "au_2",
    type: "MANUSCRIPT_VERSION_UPLOADED",
    actorId: "s_man_kei",
    entity: "manuscript",
    entityId: "ms_slam",
    at: "Jun 12, 2026 · 09:14",
  },
  {
    id: "au_3",
    type: "SERIES_SUBMITTED_TO_EDITOR",
    actorId: "s_man_kei",
    entity: "series",
    entityId: "se_slam",
    at: "Jun 12, 2026 · 09:20",
  },
  {
    id: "au_4",
    type: "EDITOR_REVIEW_STARTED",
    actorId: "s_ed_inei",
    entity: "series",
    entityId: "se_slam",
    at: "Jun 15, 2026 · 09:25",
  },
  {
    id: "au_5",
    type: "EDITOR_REVISION_REQUESTED",
    actorId: "s_ed_inei",
    entity: "series",
    entityId: "se_slam",
    at: "Jun 15, 2026 · 09:30",
  },
  {
    id: "au_6",
    type: "SERIES_FORWARDED_TO_BOARD",
    actorId: "s_ed_otsu",
    entity: "series",
    entityId: "se_jojo",
    at: "Jun 13, 2026 · 16:02",
  },
  {
    id: "au_7",
    type: "BOARD_VOTE_CREATED",
    actorId: "s_bd_kojiro",
    entity: "series",
    entityId: "se_jojo",
    at: "Jun 14, 2026 · 09:11",
  },
  {
    id: "au_8",
    type: "BOARD_VOTE_CREATED",
    actorId: "s_bd_sekishu",
    entity: "series",
    entityId: "se_jojo",
    at: "Jun 14, 2026 · 10:04",
  },
  {
    id: "au_9",
    type: "BOARD_VOTE_CREATED",
    actorId: "s_bd_mata",
    entity: "series",
    entityId: "se_jojo",
    at: "Jun 14, 2026 · 11:32",
  },
  {
    id: "au_10",
    type: "SERIES_APPROVED",
    actorId: "s_bd_sekishu",
    entity: "series",
    entityId: "se_ghost",
    at: "Feb 11, 2026",
    payload: { publicationType: "weekly" },
  },
  {
    id: "au_11",
    type: "CHAPTER_CREATED",
    actorId: "s_man_kei",
    entity: "chapter",
    entityId: "ch_g2",
    at: "Jun 10, 2026 · 11:00",
  },
  {
    id: "au_12",
    type: "PAGE_UPLOADED",
    actorId: "s_man_kei",
    entity: "chapter",
    entityId: "ch_g2",
    at: "Jun 10, 2026 · 12:30",
    payload: { count: 8 },
  },
  {
    id: "au_13",
    type: "CHAPTER_ENTERED_PRODUCTION",
    actorId: "s_man_kei",
    entity: "chapter",
    entityId: "ch_g2",
    at: "Jun 10, 2026 · 12:31",
  },
  {
    id: "au_14",
    type: "SERIES_MEMBER_ADDED",
    actorId: "s_man_kei",
    entity: "series-member",
    entityId: "sm_g_jubei",
    at: "Feb 12, 2026",
  },
  {
    id: "au_15",
    type: "SERIES_MEMBER_PAUSED",
    actorId: "s_man_kei",
    entity: "series-member",
    entityId: "sm_g_jotaro",
    at: "Jun 01, 2026",
  },
  {
    id: "au_16",
    type: "AI_SEGMENTATION_REQUESTED",
    actorId: "s_man_kei",
    entity: "page",
    entityId: "pg_ch_g2_1",
    at: "Jun 17 · 10:11",
  },
  {
    id: "au_17",
    type: "AI_SEGMENTATION_COMPLETED",
    actorId: "s_man_kei",
    entity: "page",
    entityId: "pg_ch_g2_1",
    at: "Jun 17 · 10:12",
    payload: { suggestions: 5 },
  },
  {
    id: "au_18",
    type: "AI_REGION_ACCEPTED",
    actorId: "s_man_kei",
    entity: "region",
    entityId: "rg_2",
    at: "Jun 17 · 10:14",
  },
  {
    id: "au_19",
    type: "USER_SUSPENDED",
    actorId: "s_admin",
    entity: "user",
    entityId: "u6",
    at: "Jul 18, 2023",
  },
  {
    id: "au_20",
    type: "USER_LOGIN_SUCCESS",
    actorId: "s_man_kei",
    entity: "user",
    entityId: "s_man_kei",
    at: "Today · 08:02",
  },
];
