export type EditorDecision = "revision" | "reject" | "forward";

export type EditorReview = {
  id: string;
  seriesId: string;
  manuscriptVersionId: string;
  decision: EditorDecision;
  comment: string;
  reviewerId: string;
  at: string;
};

export const editorReviews: EditorReview[] = [
  {
    id: "er_jojo_1",
    seriesId: "se_jojo",
    manuscriptVersionId: "mv_jojo_1",
    decision: "revision",
    comment: "Strong premise but the opening race feels rushed. Expand first 6 pages.",
    reviewerId: "s_ed_otsu",
    at: "Jun 07, 2026 · 10:14",
  },
  {
    id: "er_jojo_2",
    seriesId: "se_jojo",
    manuscriptVersionId: "mv_jojo_2",
    decision: "forward",
    comment: "Rework lands. Forwarding to Board with weekly/monthly question open.",
    reviewerId: "s_ed_otsu",
    at: "Jun 13, 2026 · 16:02",
  },
  {
    id: "er_slam_1",
    seriesId: "se_slam",
    manuscriptVersionId: "mv_slam_1",
    decision: "revision",
    comment: "Tighten team dynamics in chapter 2.",
    reviewerId: "s_ed_inei",
    at: "Jun 15, 2026 · 09:30",
  },
  {
    id: "er_ghost_1",
    seriesId: "se_ghost",
    manuscriptVersionId: "mv_ghost_1",
    decision: "forward",
    comment: "Ready. Recommend weekly slot.",
    reviewerId: "s_ed_otsu",
    at: "Feb 05, 2026 · 11:20",
  },
];

export const reviewsBySeries = (seriesId: string) =>
  editorReviews.filter((r) => r.seriesId === seriesId);
