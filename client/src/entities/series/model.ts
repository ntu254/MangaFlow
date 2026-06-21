import berserk from "@/shared/assets/cover-berserk.jpg";
import jojo from "@/shared/assets/cover-jojo.jpg";
import vagabond from "@/shared/assets/cover-vagabond-small.jpg";
import onepiece from "@/shared/assets/cover-onepiece.jpg";
import monster from "@/shared/assets/cover-monster.jpg";
import slamdunk from "@/shared/assets/cover-slamdunk.jpg";
import vinland from "@/shared/assets/cover-vinland.jpg";
import fma from "@/shared/assets/cover-fma.jpg";
import grandblue from "@/shared/assets/cover-grandblue.jpg";
import kingdom from "@/shared/assets/cover-kingdom.jpg";
import ghostFixers from "@/shared/assets/cover-ghostfixers.jpg";
import gokuragukai from "@/shared/assets/cover-gokuragukai.jpg";
import gachiakuta from "@/shared/assets/cover-gachiakuta.jpg";

export type SeriesStatus =
  | "draft"
  | "editor-review"
  | "revision-requested"
  | "board-review"
  | "ongoing"
  | "at-risk"
  | "completed"
  | "cancelled"
  | "archived"
  | "rejected"
  | "withdrawn";
export type PublicationType = "weekly" | "monthly" | "bi-weekly";

export type Series = {
  publicationType: PublicationType;
  pages?: { uploaded: number; total: number };
  pendingTasks?: number;
  currentChapter?: string;
  nextAction?: string;
  id: string;
  slug: string;
  title: string;
  jp: string;
  cover: string;
  mangakaId: string;
  editorId: string;
  status: SeriesStatus;
  tags: string[];
  synopsis: string;
  rankingHistory: { period: string; rank: number }[];
};

export const series: Series[] = [
  {
    id: "se_ghost",
    slug: "ghost-fixers",
    title: "Ghost Fixers",
    jp: "ゴーストフィクサーズ",
    cover: ghostFixers,
    mangakaId: "s_man_kei",
    editorId: "s_ed_otsu",
    status: "ongoing",
    publicationType: "weekly",
    pages: { uploaded: 18, total: 20 },
    pendingTasks: 3,
    currentChapter: "Ch. 12",
    nextAction: "Review submissions",
    tags: ["Action", "Supernatural", "Shonen"],
    synopsis: "A pair of exorcists for hire chase down the ghosts the system forgot.",
    rankingHistory: [
      { period: "2026-W22", rank: 8 },
      { period: "2026-W23", rank: 6 },
      { period: "2026-W24", rank: 5 },
      { period: "2026-W25", rank: 4 },
    ],
  },
  {
    id: "se_goku",
    slug: "gokuragukai",
    title: "Gokuragukai",
    jp: "極楽街",
    cover: gokuragukai,
    mangakaId: "s_man_sano",
    editorId: "s_ed_inei",
    status: "ongoing",
    publicationType: "weekly",
    pages: { uploaded: 18, total: 20 },
    pendingTasks: 3,
    currentChapter: "Ch. 327",
    nextAction: "Review submissions",
    tags: ["Action", "Seinen"],
    synopsis: "Two cohabitants fight monsters in the streets of an undying city.",
    rankingHistory: [
      { period: "2026-W22", rank: 12 },
      { period: "2026-W23", rank: 10 },
      { period: "2026-W24", rank: 11 },
      { period: "2026-W25", rank: 9 },
    ],
  },
  {
    id: "se_gachi",
    slug: "gachiakuta",
    title: "Gachiakuta",
    jp: "ガチアクタ",
    cover: gachiakuta,
    mangakaId: "s_man_kei",
    editorId: "s_ed_otsu",
    status: "ongoing",
    publicationType: "weekly",
    pages: { uploaded: 18, total: 20 },
    pendingTasks: 3,
    currentChapter: "Ch. 48",
    nextAction: "Review submissions",
    tags: ["Shonen", "Action"],
    synopsis: "A boy thrown into the abyss fights with weaponized refuse.",
    rankingHistory: [
      { period: "2026-W22", rank: 3 },
      { period: "2026-W23", rank: 3 },
      { period: "2026-W24", rank: 2 },
      { period: "2026-W25", rank: 2 },
    ],
  },
  {
    id: "se_vag",
    slug: "vagabond",
    title: "Vagabond",
    jp: "バガボンド",
    cover: vagabond,
    mangakaId: "s_man_takezo",
    editorId: "s_ed_otsu",
    status: "at-risk",
    publicationType: "weekly",
    pages: { uploaded: 2, total: 20 },
    pendingTasks: 12,
    currentChapter: "Ch. 327",
    nextAction: "Upload drafts ASAP",
    tags: ["Seinen", "Historical"],
    synopsis: "The wandering road of a young swordsman who would be Musashi.",
    rankingHistory: [
      { period: "2026-W22", rank: 22 },
      { period: "2026-W23", rank: 25 },
      { period: "2026-W24", rank: 28 },
      { period: "2026-W25", rank: 31 },
    ],
  },
  {
    id: "se_op",
    slug: "one-piece",
    title: "One Piece",
    jp: "ワンピース",
    cover: onepiece,
    mangakaId: "s_man_takezo",
    editorId: "s_ed_inei",
    status: "ongoing",
    publicationType: "weekly",
    pages: { uploaded: 18, total: 20 },
    pendingTasks: 3,
    currentChapter: "Ch. 1122",
    nextAction: "Review submissions",
    tags: ["Shonen", "Adventure"],
    synopsis: "",
    rankingHistory: [{ period: "2026-W25", rank: 1 }],
  },
  {
    id: "se_berserk",
    slug: "berserk",
    title: "Berserk",
    jp: "ベルセルク",
    cover: berserk,
    mangakaId: "s_man_takezo",
    editorId: "s_ed_inei",
    status: "completed",
    publicationType: "monthly",
    pages: { uploaded: 45, total: 45 },
    pendingTasks: 0,
    currentChapter: "Ch. 162",
    nextAction: "View archives",
    tags: ["Seinen"],
    synopsis: "",
    rankingHistory: [],
  },
  {
    id: "se_jojo",
    slug: "jojo-sbr",
    title: "Steel Ball Run",
    jp: "スティール・ボール・ラン",
    cover: jojo,
    mangakaId: "s_man_sano",
    editorId: "s_ed_otsu",
    status: "board-review",
    publicationType: "monthly",
    pages: { uploaded: 0, total: 0 },
    pendingTasks: 0,
    currentChapter: "Ch. 1",
    nextAction: "Waiting for board",
    tags: ["Seinen"],
    synopsis: "",
    rankingHistory: [],
  },
  {
    id: "se_monster",
    slug: "monster",
    title: "Monster",
    jp: "MONSTER",
    cover: monster,
    mangakaId: "s_man_sano",
    editorId: "s_ed_otsu",
    status: "completed",
    publicationType: "monthly",
    pages: { uploaded: 45, total: 45 },
    pendingTasks: 0,
    currentChapter: "Ch. 162",
    nextAction: "View archives",
    tags: ["Seinen", "Thriller"],
    synopsis: "",
    rankingHistory: [],
  },
  {
    id: "se_slam",
    slug: "slam-dunk",
    title: "Slam Dunk",
    jp: "スラムダンク",
    cover: slamdunk,
    mangakaId: "s_man_kei",
    editorId: "s_ed_inei",
    status: "editor-review",
    publicationType: "weekly",
    pages: { uploaded: 5, total: 20 },
    pendingTasks: 1,
    currentChapter: "Ch. 12",
    nextAction: "Waiting for feedback",
    tags: ["Shonen", "Sports"],
    synopsis: "",
    rankingHistory: [],
  },
  {
    id: "se_vinland",
    slug: "vinland",
    title: "Vinland Saga",
    jp: "ヴィンランド・サガ",
    cover: vinland,
    mangakaId: "s_man_takezo",
    editorId: "s_ed_otsu",
    status: "ongoing",
    publicationType: "weekly",
    pages: { uploaded: 18, total: 20 },
    pendingTasks: 3,
    currentChapter: "Ch. 327",
    nextAction: "Review submissions",
    tags: ["Seinen"],
    synopsis: "",
    rankingHistory: [],
  },
  {
    id: "se_fma",
    slug: "fma",
    title: "Fullmetal Alchemist",
    jp: "鋼の錬金術師",
    cover: fma,
    mangakaId: "s_man_kei",
    editorId: "s_ed_otsu",
    status: "completed",
    publicationType: "monthly",
    pages: { uploaded: 45, total: 45 },
    pendingTasks: 0,
    currentChapter: "Ch. 162",
    nextAction: "View archives",
    tags: ["Shonen"],
    synopsis: "",
    rankingHistory: [],
  },
  {
    id: "se_kingdom",
    slug: "kingdom",
    title: "Kingdom",
    jp: "キングダム",
    cover: kingdom,
    mangakaId: "s_man_sano",
    editorId: "s_ed_inei",
    status: "ongoing",
    publicationType: "weekly",
    pages: { uploaded: 18, total: 20 },
    pendingTasks: 3,
    currentChapter: "Ch. 327",
    nextAction: "Review submissions",
    tags: ["Seinen", "Historical"],
    synopsis: "",
    rankingHistory: [],
  },
  {
    id: "se_grand",
    slug: "grand-blue",
    title: "Grand Blue",
    jp: "ぐらんぶる",
    cover: grandblue,
    mangakaId: "s_man_sano",
    editorId: "s_ed_otsu",
    status: "draft",
    publicationType: "monthly",
    pages: { uploaded: 0, total: 45 },
    pendingTasks: 5,
    currentChapter: "Ch. 1",
    nextAction: "Finalize manuscript",
    tags: ["Seinen", "Comedy"],
    synopsis: "",
    rankingHistory: [],
  },
];

export const findSeries = (id: string) => series.find((s) => s.id === id);
