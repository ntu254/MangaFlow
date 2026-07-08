import berserk from "@/assets/covers/berserk.jpg";
import onepiece from "@/assets/covers/onepiece.jpg";
import slamdunk from "@/assets/covers/slamdunk.jpg";
import vinland from "@/assets/covers/vinland.jpg";
import fullmetal from "@/assets/covers/fullmetal.jpg";
import monster from "@/assets/covers/monster.jpg";
import gachiakuta from "@/assets/covers/gachiakuta.jpg";
import kingdom from "@/assets/covers/kingdom.jpg";
import grandblue from "@/assets/covers/grandblue.jpg";
import ghostfixers from "@/assets/covers/ghostfixers.jpg";
import gokuragukai from "@/assets/covers/gokuragukai.jpg";
import heroCover from "@/assets/covers/hero-vagabond.jpg";

export type Series = {
  slug: string;
  title: string;
  romaji: string;
  author: string;
  cover: string;
  genres: string[];
  chapters: number;
  reads: number;
  synopsis: string;
  status: "ongoing" | "completed" | "at_risk";
  updatedAt: string;
};

export const heroSeries = {
  slug: "vagabond",
  title: "Vagabond",
  romaji: "バガボンド",
  author: "Inoue Takehiko",
  cover: heroCover,
  genres: ["Seinen", "Drama", "Epic", "Martial Arts"],
  synopsis:
    "The story starts in 1600, in the aftermath of the decisive Battle of Sekigahara. Two 17-year-old teenagers who joined the losing side, Takezō Shinmen and Matahachi Hon'iden, lie wounded in the battlefield and pursued by survivor hunters. They manage to escape and swear to become 'Invincible Under the Heavens'.",
};

export const series: Series[] = [
  {
    slug: "berserk",
    title: "Berserk",
    romaji: "ベルセルク",
    author: "Miura Kentaro",
    cover: berserk,
    genres: ["Seinen", "Dark Fantasy"],
    chapters: 376,
    reads: 717293,
    status: "ongoing",
    updatedAt: "2h",
    synopsis: "Guts, a lone mercenary, hunts demons in a dark medieval world.",
  },
  {
    slug: "jojo-7",
    title: "JoJo no Kimyou na Bouken Part 7: Steel Ball Run",
    romaji: "ジョジョの奇妙な冒険 Part7 STEEL BALL RUN",
    author: "Araki Hirohiko",
    cover: gokuragukai,
    genres: ["Shounen", "Adventure"],
    chapters: 95,
    reads: 717293,
    status: "completed",
    updatedAt: "5h",
    synopsis: "A cross-country horse race across 1890s America.",
  },
  {
    slug: "vagabond",
    title: "Vagabond",
    romaji: "バガボンド",
    author: "Inoue Takehiko",
    cover: heroCover,
    genres: ["Seinen", "Drama"],
    chapters: 327,
    reads: 717293,
    status: "ongoing",
    updatedAt: "1d",
    synopsis: heroSeries.synopsis,
  },
  {
    slug: "one-piece",
    title: "One Piece",
    romaji: "ONE PIECE",
    author: "Oda Eiichiro",
    cover: onepiece,
    genres: ["Shounen", "Adventure"],
    chapters: 1122,
    reads: 717293,
    status: "ongoing",
    updatedAt: "3h",
    synopsis: "Monkey D. Luffy sets out to become the King of the Pirates.",
  },
  {
    slug: "monster",
    title: "Monster",
    romaji: "MONSTER",
    author: "Urasawa Naoki",
    cover: monster,
    genres: ["Seinen", "Psychological"],
    chapters: 162,
    reads: 717293,
    status: "completed",
    updatedAt: "1w",
    synopsis: "Dr. Tenma hunts the man whose life he once saved.",
  },
  {
    slug: "slam-dunk",
    title: "Slam Dunk",
    romaji: "SLAM DUNK",
    author: "Inoue Takehiko",
    cover: slamdunk,
    genres: ["Shounen", "Sports"],
    chapters: 376,
    reads: 717293,
    status: "completed",
    updatedAt: "2w",
    synopsis: "Hanamichi Sakuragi joins the basketball team to impress a girl.",
  },
  {
    slug: "vinland-saga",
    title: "Vinland Saga",
    romaji: "ヴィンランド・サガ",
    author: "Yukimura Makoto",
    cover: vinland,
    genres: ["Seinen", "Historical"],
    chapters: 95,
    reads: 717293,
    status: "ongoing",
    updatedAt: "4d",
    synopsis: "Thorfinn seeks revenge against the man who killed his father.",
  },
  {
    slug: "fullmetal-alchemist",
    title: "Fullmetal Alchemist",
    romaji: "鋼の錬金術師",
    author: "Arakawa Hiromu",
    cover: fullmetal,
    genres: ["Shounen", "Fantasy"],
    chapters: 327,
    reads: 717293,
    status: "completed",
    updatedAt: "3w",
    synopsis: "Two brothers search for the Philosopher's Stone.",
  },
  {
    slug: "grand-blue",
    title: "Grand Blue",
    romaji: "ぐらんぶる",
    author: "Inoue Kenji",
    cover: grandblue,
    genres: ["Seinen", "Comedy"],
    chapters: 1122,
    reads: 717293,
    status: "ongoing",
    updatedAt: "6h",
    synopsis: "A diving club that mostly drinks.",
  },
  {
    slug: "kingdom",
    title: "Kingdom",
    romaji: "キングダム",
    author: "Hara Yasuhisa",
    cover: kingdom,
    genres: ["Seinen", "Historical"],
    chapters: 162,
    reads: 717293,
    status: "ongoing",
    updatedAt: "5d",
    synopsis: "A war orphan rises to become a Great General of the Heavens.",
  },
];

export type ChapterUpdate = {
  vol: number;
  ch: number;
  title: string;
};

export const latestUpdates: { series: Series; updates: ChapterUpdate[]; updatedAgo: string }[] = [
  {
    series: {
      ...series[0],
      slug: "ghost-fixers",
      title: "Ghost Fixers",
      romaji: "Tanaka Yasuki",
      cover: ghostfixers,
      genres: ["Action", "Supernatural", "Shonen", "Mystery"],
    },
    updates: [
      { vol: 5, ch: 20, title: '"Victory"' },
      { vol: 5, ch: 19, title: '"Dependent"' },
      { vol: 5, ch: 18, title: '"First Love"' },
      { vol: 5, ch: 17, title: '"Comrades"' },
    ],
    updatedAgo: "16min ago",
  },
  {
    series: {
      ...series[1],
      slug: "gokuragukai",
      title: "Gokuragukai",
      romaji: "Sano Yuto",
      cover: gokuragukai,
      genres: ["Action", "Supernatural", "Shonen", "Mystery"],
    },
    updates: [
      { vol: 5, ch: 20, title: '"Take my Love!"' },
      { vol: 4, ch: 19, title: '"Let\'s make a..."' },
      { vol: 4, ch: 18, title: '"Girl Trouble"' },
      { vol: 4, ch: 17, title: '"Tons of proble..."' },
    ],
    updatedAgo: "16min ago",
  },
  {
    series: {
      ...series[4],
      slug: "gachiakuta",
      title: "Gachiakuta",
      romaji: "Kei Urana",
      cover: gachiakuta,
      genres: ["Action", "Supernatural", "Shonen", "Mystery"],
    },
    updates: [
      { vol: 5, ch: 20, title: '"Take my Love!"' },
      { vol: 4, ch: 19, title: '"Let\'s make a..."' },
      { vol: 4, ch: 18, title: '"Girl Trouble"' },
      { vol: 4, ch: 17, title: '"Tons of proble..."' },
    ],
    updatedAgo: "16min ago",
  },
];

export const recentlyAdded = [
  { slug: "ghost-fixers", title: "Ghost Fixers", tags: "Shounen / Drama", cover: ghostfixers },
  { slug: "gokuragukai", title: "Gokuragukai", tags: "Seinen / Action", cover: gokuragukai },
  { slug: "gachiakuta", title: "Gachiakuta", tags: "Shounen / Action", cover: gachiakuta },
  { slug: "ghost-fixers-2", title: "Ghost Fixers", tags: "Shounen / Drama", cover: ghostfixers },
  { slug: "gokuragukai-2", title: "Gokuragukai", tags: "Seinen / Action", cover: gokuragukai },
  { slug: "gachiakuta-2", title: "Gachiakuta", tags: "Shounen / Action", cover: gachiakuta },
  { slug: "ghost-fixers-3", title: "Ghost Fixers", tags: "Shounen / Drama", cover: ghostfixers },
  { slug: "gokuragukai-3", title: "Gokuragukai", tags: "Seinen / Action", cover: gokuragukai },
  { slug: "gachiakuta-3", title: "Gachiakuta", tags: "Shounen / Action", cover: gachiakuta },
];

export function findSeries(slug: string): Series | undefined {
  if (slug === heroSeries.slug) return series.find((s) => s.slug === slug);
  return series.find((s) => s.slug === slug);
}
