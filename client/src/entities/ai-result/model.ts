export type AIResultStatus = "pending" | "completed" | "failed" | "partially-accepted";

export type AIResult = {
  id: string;
  pageId: string;
  status: AIResultStatus;
  requestedBy: string;
  at: string;
  suggestionsCount: number;
  acceptedCount: number;
  note?: string;
};

export const aiResults: AIResult[] = [
  { id: "ai_1", pageId: "pg_ch_g2_1", status: "partially-accepted", requestedBy: "s_man_kei", at: "Jun 17 · 10:12", suggestionsCount: 5, acceptedCount: 2 },
  { id: "ai_2", pageId: "pg_ch_g2_2", status: "completed", requestedBy: "s_man_kei", at: "Jun 17 · 10:30", suggestionsCount: 4, acceptedCount: 0 },
  { id: "ai_3", pageId: "pg_ch_ga2_1", status: "partially-accepted", requestedBy: "s_man_kei", at: "Jun 16 · 14:00", suggestionsCount: 6, acceptedCount: 1 },
  { id: "ai_4", pageId: "pg_ch_gk2_1", status: "failed", requestedBy: "s_man_sano", at: "Jun 18 · 09:02", suggestionsCount: 0, acceptedCount: 0, note: "AI service timeout." },
];

export const aiResultsByPage = (pageId: string) => aiResults.filter((a) => a.pageId === pageId);
