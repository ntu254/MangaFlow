export type RankingEntry = { seriesId: string; rank: number; votes: number };
export type RankingPeriod = {
  id: string;
  period: string;
  locked: boolean;
  entries: RankingEntry[];
};

export const rankings: RankingPeriod[] = [
  {
    id: "rk_w25",
    period: "2026 · Week 25",
    locked: false,
    entries: [
      { seriesId: "se_op", rank: 1, votes: 9421 },
      { seriesId: "se_gachi", rank: 2, votes: 7180 },
      { seriesId: "se_ghost", rank: 3, votes: 6052 },
      { seriesId: "se_goku", rank: 4, votes: 5340 },
      { seriesId: "se_kingdom", rank: 5, votes: 4801 },
    ],
  },
  {
    id: "rk_w24",
    period: "2026 · Week 24",
    locked: true,
    entries: [
      { seriesId: "se_op", rank: 1, votes: 9120 },
      { seriesId: "se_gachi", rank: 2, votes: 6890 },
      { seriesId: "se_ghost", rank: 3, votes: 5840 },
    ],
  },
];
