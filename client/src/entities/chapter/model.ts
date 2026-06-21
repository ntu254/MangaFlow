export type ChapterStatus =
  | "draft"
  | "in-production"
  | "ready-for-publication"
  | "published"
  | "archived";

export type Chapter = {
  id: string;
  seriesId: string;
  number: string;
  title: string;
  status: ChapterStatus;
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
    status: "ready-for-publication",
    pages: 22,
  },
  {
    id: "ch_g2",
    seriesId: "se_ghost",
    number: "Vol. 3 Ch. 20",
    title: "Dependent",
    status: "in-production",
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
    status: "in-production",
    pages: 22,
  },
  {
    id: "ch_ga1",
    seriesId: "se_gachi",
    number: "Vol. 8 Ch. 102",
    title: "Refuse Heart",
    status: "ready-for-publication",
    pages: 21,
  },
  {
    id: "ch_ga2",
    seriesId: "se_gachi",
    number: "Vol. 8 Ch. 103",
    title: "Below The Rim",
    status: "in-production",
    pages: 23,
  },
  {
    id: "ch_v1",
    seriesId: "se_vag",
    number: "Vol. 38 Ch. 327",
    title: "Long Road",
    status: "in-production",
    pages: 20,
  },
  {
    id: "ch_sd1",
    seriesId: "se_slam",
    number: "Vol. 1 Ch. 1",
    title: "Sakuragi Hanamichi",
    status: "in-production",
    pages: 50,
  },
  {
    id: "ch_op",
    seriesId: "se_op",
    number: "Ch. 1122",
    title: "New Dawn",
    status: "ready-for-publication",
    pages: 17,
  },
];

export const findChapter = (id: string) => chapters.find((c) => c.id === id);
export const chaptersBySeries = (sid: string) => chapters.filter((c) => c.seriesId === sid);
