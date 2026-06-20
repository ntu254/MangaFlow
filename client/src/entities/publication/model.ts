export type Publication = {
  id: string;
  chapterId: string;
  scheduledAt: string;
  state: "ready" | "scheduled" | "published" | "cancelled";
};

export const publications: Publication[] = [
  { id: "p1", chapterId: "ch_g1", scheduledAt: "Jun 22, 2026", state: "scheduled" },
  { id: "p2", chapterId: "ch_op", scheduledAt: "Jun 20, 2026", state: "scheduled" },
  { id: "p3", chapterId: "ch_gk1", scheduledAt: "Jun 15, 2026", state: "published" },
  { id: "p4", chapterId: "ch_ga1", scheduledAt: "Jun 28, 2026", state: "ready" },
];

