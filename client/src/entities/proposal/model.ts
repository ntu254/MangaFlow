export type ProposalStatus =
  | "draft"
  | "submitted"
  | "editor-review"
  | "revision-requested"
  | "forwarded-to-board"
  | "board-review"
  | "approved"
  | "rejected";

export type SeriesProposal = {
  id: string;
  seriesId: string;
  title: string;
  jp?: string;
  synopsis: string;
  genre: string[];
  targetAudience: "shonen" | "seinen" | "shojo" | "josei";
  requestedPublicationType: "weekly" | "monthly";
  status: ProposalStatus;
  createdBy: string; // staff id
  createdAt: string;
};

export const proposals: SeriesProposal[] = [
  {
    id: "pr_jojo",
    seriesId: "se_jojo",
    title: "Steel Ball Run",
    jp: "スティール・ボール・ラン",
    synopsis: "A transcontinental race across post-war America, with a mystical Stand twist.",
    genre: ["Adventure", "Seinen"],
    targetAudience: "seinen",
    requestedPublicationType: "monthly",
    status: "board-review",
    createdBy: "s_man_sano",
    createdAt: "Jun 04, 2026",
  },
  {
    id: "pr_grand",
    seriesId: "se_grand",
    title: "Grand Blue",
    jp: "ぐらんぶる",
    synopsis: "Coming-of-age diving comedy set on the coast of Izu.",
    genre: ["Comedy", "Seinen"],
    targetAudience: "seinen",
    requestedPublicationType: "monthly",
    status: "draft",
    createdBy: "s_man_sano",
    createdAt: "Jun 10, 2026",
  },
  {
    id: "pr_slam",
    seriesId: "se_slam",
    title: "Slam Dunk",
    jp: "スラムダンク",
    synopsis: "Delinquent reborn through high-school basketball.",
    genre: ["Sports", "Shonen"],
    targetAudience: "shonen",
    requestedPublicationType: "weekly",
    status: "editor-review",
    createdBy: "s_man_kei",
    createdAt: "Jun 12, 2026",
  },
  {
    id: "pr_ghost",
    seriesId: "se_ghost",
    title: "Ghost Fixers",
    synopsis: "Exorcists for hire chase the ghosts the system forgot.",
    genre: ["Action", "Supernatural"],
    targetAudience: "shonen",
    requestedPublicationType: "weekly",
    status: "approved",
    createdBy: "s_man_kei",
    createdAt: "Feb 02, 2026",
  },
  {
    id: "pr_gachi",
    seriesId: "se_gachi",
    title: "Gachiakuta",
    synopsis: "A boy thrown into the abyss fights with weaponized refuse.",
    genre: ["Action", "Shonen"],
    targetAudience: "shonen",
    requestedPublicationType: "weekly",
    status: "approved",
    createdBy: "s_man_kei",
    createdAt: "Jan 15, 2026",
  },
];

export const findProposal = (id: string) => proposals.find((p) => p.id === id);
export const proposalBySeries = (seriesId: string) =>
  proposals.find((p) => p.seriesId === seriesId);
