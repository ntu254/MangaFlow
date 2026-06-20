// Spec Flow 02 statuses + legacy review/publication statuses (kept for existing screens).
export type ChapterStatus =
  | "draft"
  | "in-production"
  | "ready-for-publication"
  | "archived"
  | "in-review"
  | "revision"
  | "board"
  | "approved"
  | "scheduled"
  | "published"
  | "rejected";

export type Chapter = {
  id: string;
  seriesId: string;
  number: string;
  title: string;
  status: ChapterStatus;
  scheduledAt?: string;
  publishedAt?: string;
  pages: number;
  publicationTypeSnapshot?: "weekly" | "monthly";
};

export const chapters: Chapter[] = [
  {
    id: "ch_g1",
    seriesId: "se_ghost",
    number: "Vol. 3 Ch. 19",
    title: "Victory",
    status: "scheduled",
    scheduledAt: "Jun 22, 2026",
    pages: 22,
  },
  {
    id: "ch_g2",
    seriesId: "se_ghost",
    number: "Vol. 3 Ch. 20",
    title: "Dependent",
    status: "in-review",
    pages: 24,
  },
  {
    id: "ch_g3",
    seriesId: "se_ghost",
    number: "Vol. 3 Ch. 21",
    title: "Quiet Town",
    status: "draft",
    pages: 18,
  },
  {
    id: "ch_gk1",
    seriesId: "se_goku",
    number: "Vol. 5 Ch. 20",
    title: "Take my Love!",
    status: "published",
    publishedAt: "Jun 15, 2026",
    pages: 20,
  },
  {
    id: "ch_gk2",
    seriesId: "se_goku",
    number: "Vol. 5 Ch. 21",
    title: "Let's make a...",
    status: "revision",
    pages: 22,
  },
  {
    id: "ch_ga1",
    seriesId: "se_gachi",
    number: "Vol. 8 Ch. 102",
    title: "Refuse Heart",
    status: "approved",
    pages: 21,
  },
  {
    id: "ch_ga2",
    seriesId: "se_gachi",
    number: "Vol. 8 Ch. 103",
    title: "Below The Rim",
    status: "in-review",
    pages: 23,
  },
  {
    id: "ch_v1",
    seriesId: "se_vag",
    number: "Vol. 38 Ch. 327",
    title: "Long Road",
    status: "board",
    pages: 20,
  },
  {
    id: "ch_sd1",
    seriesId: "se_slam",
    number: "Vol. 1 Ch. 1",
    title: "Sakuragi Hanamichi",
    status: "in-review",
    pages: 50,
  },
  {
    id: "ch_op",
    seriesId: "se_op",
    number: "Ch. 1122",
    title: "New Dawn",
    status: "scheduled",
    scheduledAt: "Jun 20, 2026",
    pages: 17,
  },
  {
    id: "ch_jojo",
    seriesId: "se_jojo",
    number: "Vol. 24 Ch. 95",
    title: "The End",
    status: "board",
    pages: 64,
  },
];

export const findChapter = (id: string) => chapters.find((c) => c.id === id);
export const chaptersBySeries = (sid: string) => chapters.filter((c) => c.seriesId === sid);
