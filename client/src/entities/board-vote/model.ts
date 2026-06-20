export type BoardVoteValue = "approve" | "reject" | "revision";

export type BoardVote = {
  id: string;
  seriesId: string;
  voterId: string;
  vote: BoardVoteValue;
  suggestedPublicationType?: "weekly" | "monthly";
  comment: string;
  at: string;
};

export type BoardDecision = {
  id: string;
  seriesId: string;
  finalDecision: "approved" | "rejected" | "revision-requested";
  publicationType?: "weekly" | "monthly";
  chairId: string;
  at: string;
  note?: string;
};

export const boardVotes: BoardVote[] = [
  {
    id: "bv_jojo_1",
    seriesId: "se_jojo",
    voterId: "s_bd_kojiro",
    vote: "approve",
    suggestedPublicationType: "monthly",
    comment: "Strong finale arc. Monthly to protect quality.",
    at: "Jun 14, 2026 · 09:11",
  },
  {
    id: "bv_jojo_2",
    seriesId: "se_jojo",
    voterId: "s_bd_sekishu",
    vote: "approve",
    suggestedPublicationType: "monthly",
    comment: "Agreed, monthly.",
    at: "Jun 14, 2026 · 10:04",
  },
  {
    id: "bv_jojo_3",
    seriesId: "se_jojo",
    voterId: "s_bd_mata",
    vote: "revision",
    suggestedPublicationType: "weekly",
    comment: "Could be weekly if pacing tightens.",
    at: "Jun 14, 2026 · 11:32",
  },
  {
    id: "bv_vag_1",
    seriesId: "se_vag",
    voterId: "s_bd_sekishu",
    vote: "revision",
    comment: "Pacing has slipped 4 weeks in a row.",
    at: "Jun 16, 2026 · 10:00",
  },
  {
    id: "bv_vag_2",
    seriesId: "se_vag",
    voterId: "s_bd_mata",
    vote: "approve",
    comment: "Trust the mangaka, give 2 more issues.",
    at: "Jun 16, 2026 · 13:25",
  },
  {
    id: "bv_ghost_1",
    seriesId: "se_ghost",
    voterId: "s_bd_kojiro",
    vote: "approve",
    suggestedPublicationType: "weekly",
    comment: "Greenlight, weekly.",
    at: "Feb 10, 2026",
  },
];

export const boardDecisions: BoardDecision[] = [
  {
    id: "bd_ghost",
    seriesId: "se_ghost",
    finalDecision: "approved",
    publicationType: "weekly",
    chairId: "s_bd_sekishu",
    at: "Feb 11, 2026",
    note: "Approved for weekly slot.",
  },
  {
    id: "bd_gachi",
    seriesId: "se_gachi",
    finalDecision: "approved",
    publicationType: "weekly",
    chairId: "s_bd_sekishu",
    at: "Jan 20, 2026",
  },
];

export const votesBySeries = (seriesId: string) =>
  boardVotes.filter((v) => v.seriesId === seriesId);
export const decisionBySeries = (seriesId: string) =>
  boardDecisions.find((d) => d.seriesId === seriesId);
