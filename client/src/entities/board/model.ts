export type Ballot = {
  id: string;
  seriesId: string;
  chapterId?: string;
  reason: "manuscript" | "at-risk" | "new-series";
  openedAt: string;
  status: "open" | "closed";
  votes: { staffId: string; vote: "approve" | "revision" | "reject"; note: string }[];
};

export const ballots: Ballot[] = [
  {
    id: "b1",
    seriesId: "se_vag",
    reason: "at-risk",
    openedAt: "Jun 16, 2026",
    status: "open",
    votes: [
      { staffId: "s_bd_sekishu", vote: "revision", note: "Pacing has slipped 4 weeks in a row." },
      { staffId: "s_bd_mata", vote: "approve", note: "Trust the mangaka, give 2 more issues." },
    ],
  },
  {
    id: "b2",
    seriesId: "se_jojo",
    chapterId: "ch_jojo",
    reason: "manuscript",
    openedAt: "Jun 17, 2026",
    status: "open",
    votes: [{ staffId: "s_bd_kojiro", vote: "approve", note: "Strong finale." }],
  },
];

