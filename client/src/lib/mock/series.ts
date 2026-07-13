import berserk from "@/assets/covers/berserk.jpg";
import vinland from "@/assets/covers/vinland.jpg";
import monster from "@/assets/covers/monster.jpg";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";

const now = Date.now();
const day = 86400000;
const iso = (offsetDays: number) => new Date(now + offsetDays * day).toISOString();

function makeChapter(
  seriesId: string,
  number: number,
  title: string,
  status: Chapter["status"],
  overrides: Partial<Chapter> = {},
): Chapter {
  const id = `ch-${seriesId}-${number}`;
  return {
    id,
    seriesId,
    number,
    title,
    status,
    assigneeId: "u-mangaka",
    assigneeName: "Inoue Takehiko",
    plannedAt: iso(number * 7 - 30),
    draftDueAt: iso(number * 7 - 21),
    reviewDueAt: iso(number * 7 - 14),
    pages:
      status === "PLANNED"
        ? []
        : Array.from({ length: 18 }, (_, i) => ({
            id: `${id}-p${i + 1}`,
            index: i + 1,
            fileName: `page-${String(i + 1).padStart(2, "0")}.jpg`,
            fileUrl: "",
            sizeKB: 320 + i * 4,
            uploadedAt: iso(number * 7 - 25),
          })),
    reviewNotes: [],
    revisionRound: 0,
    history: [
      {
        id: `${id}-e0`,
        chapterId: id,
        actorId: "u-editor",
        actorName: "Tanaka Akira",
        actorRole: "editor",
        type: "CREATE",
        toStatus: "PLANNED",
        createdAt: iso(number * 7 - 30),
      },
    ],
    createdAt: iso(number * 7 - 30),
    updatedAt: iso(number * 7 - 5),
    ...overrides,
  };
}

export const seedSeries: ProductionSeries[] = [
  {
    id: "s-berserk-prod",
    slug: "berserk-prod",
    title: "Berserk: Lost Chapters",
    synopsis: "A side story about Guts during the Black Swordsman arc.",
    genres: ["Seinen", "Dark Fantasy"],
    coverUrl: berserk,
    status: "ONGOING",
    cadence: "weekly",
    startDate: iso(-90),
    targetChapters: 24,
    authorId: "u-mangaka",
    authorName: "Inoue Takehiko",
    editorId: "u-editor",
    editorName: "Tanaka Akira",
    assistantIds: ["u-assist"],
    createdAt: iso(-90),
    updatedAt: iso(-2),
  },
  {
    id: "s-vinland-prod",
    slug: "vinland-arc",
    title: "Vinland: New Horizon",
    synopsis: "Continuing Thorfinn's journey in a new land.",
    genres: ["Seinen", "Historical"],
    coverUrl: vinland,
    status: "PLANNING",
    cadence: "monthly",
    startDate: iso(14),
    targetChapters: 12,
    authorId: "u-mangaka",
    authorName: "Inoue Takehiko",
    editorId: "u-editor",
    editorName: "Tanaka Akira",
    assistantIds: [],
    createdAt: iso(-10),
    updatedAt: iso(-1),
  },
  {
    id: "s-monster-prod",
    slug: "monster-epilogue",
    title: "Monster: Epilogue",
    synopsis: "A short concluding arc for Tenma's journey.",
    genres: ["Seinen", "Psyforlogical"],
    coverUrl: monster,
    status: "COMPLETED",
    cadence: "weekly",
    startDate: iso(-300),
    targetChapters: 4,
    authorId: "u-mangaka",
    authorName: "Inoue Takehiko",
    editorId: "u-editor",
    editorName: "Tanaka Akira",
    assistantIds: [],
    createdAt: iso(-310),
    updatedAt: iso(-60),
  },
];

export const seedChapters: Chapter[] = [
  // Berserk Lost Chapters — mix of statuses
  makeChapter("s-berserk-prod", 1, "The Opening Darkness", "PUBLISHED", {
    publishedAt: iso(-60),
    scheduledAt: iso(-60),
  }),
  makeChapter("s-berserk-prod", 2, "The Nameless Sword", "PUBLISHED", {
    publishedAt: iso(-46),
    scheduledAt: iso(-46),
  }),
  makeChapter("s-berserk-prod", 3, "Old Wound", "PUBLISHED", {
    publishedAt: iso(-32),
    scheduledAt: iso(-32),
  }),
  makeChapter("s-berserk-prod", 4, "Efores", "SCHEDULED", {
    scheduledAt: iso(3),
  }),
  makeChapter("s-berserk-prod", 5, "Last Moonlight", "IN_REVIEW", {
    reviewDueAt: iso(2),
    reviewNotes: [
      {
        id: "ch-s-berserk-prod-5-n1",
        authorId: "u-editor",
        authorName: "Tanaka Akira",
        authorRole: "editor",
        text: "Panel 3 on page 12 loses rhythm; review the spacing around the speech bubble.",
        resolved: false,
        createdAt: iso(-1),
      },
      {
        id: "ch-s-berserk-prod-5-n2",
        authorId: "u-board",
        authorName: "Editorial Board",
        authorRole: "board",
        text: "The ending tone is too dark; consider adding more highlights.",
        resolved: true,
        createdAt: iso(-3),
      },
    ],
  }),
  makeChapter("s-berserk-prod", 6, "Elegy", "DRAFTING", {
    draftDueAt: iso(5),
    pages: Array.from({ length: 8 }, (_, i) => ({
      id: `ch-s-berserk-prod-6-p${i + 1}`,
      index: i + 1,
      fileName: `wip-${i + 1}.jpg`,
      fileUrl: "",
      sizeKB: 280,
      uploadedAt: iso(-1),
    })),
  }),
  makeChapter("s-berserk-prod", 7, "Chapter 7 (draft note)", "PLANNED", {
    draftDueAt: iso(12),
  }),
  // Vinland: New Horizon — full status coverage
  makeChapter("s-vinland-prod", 1, "New Harbor", "PUBLISHED", {
    publishedAt: iso(-30),
    scheduledAt: iso(-30),
    pages: Array.from({ length: 20 }, (_, i) => ({
      id: `ch-s-vinland-prod-1-p${i + 1}`,
      index: i + 1,
      fileName: `vin01-${String(i + 1).padStart(2, "0")}.jpg`,
      fileUrl: "",
      sizeKB: 310 + i * 3,
      uploadedAt: iso(-32),
    })),
  }),
  makeChapter("s-vinland-prod", 2, "Oath on the Sand", "PUBLISHED", {
    publishedAt: iso(-14),
    scheduledAt: iso(-14),
    pages: Array.from({ length: 20 }, (_, i) => ({
      id: `ch-s-vinland-prod-2-p${i + 1}`,
      index: i + 1,
      fileName: `vin02-${String(i + 1).padStart(2, "0")}.jpg`,
      fileUrl: "",
      sizeKB: 305 + i * 3,
      uploadedAt: iso(-16),
    })),
  }),
  makeChapter("s-vinland-prod", 3, "Cold Sun", "SCHEDULED", {
    scheduledAt: iso(5),
    pages: Array.from({ length: 22 }, (_, i) => ({
      id: `ch-s-vinland-prod-3-p${i + 1}`,
      index: i + 1,
      fileName: `vin03-${String(i + 1).padStart(2, "0")}.jpg`,
      fileUrl: "",
      sizeKB: 315 + i * 3,
      uploadedAt: iso(-2),
    })),
  }),
  makeChapter("s-vinland-prod", 4, "Stranger in the Forest", "APPROVED", {
    pages: Array.from({ length: 24 }, (_, i) => ({
      id: `ch-s-vinland-prod-4-p${i + 1}`,
      index: i + 1,
      fileName: `vin04-${String(i + 1).padStart(2, "0")}.jpg`,
      fileUrl: "",
      sizeKB: 320,
      uploadedAt: iso(-4),
    })),
    reviewNotes: [
      {
        id: "ch-s-vinland-prod-4-n1",
        authorId: "u-editor",
        authorName: "Tanaka Akira",
        authorRole: "editor",
        text: "Adjusted page 14 lettering as requested.",
        resolved: true,
        createdAt: iso(-5),
      },
    ],
  }),
  makeChapter("s-vinland-prod", 5, "White Night", "IN_REVIEW", {
    reviewDueAt: iso(3),
    pages: Array.from({ length: 22 }, (_, i) => ({
      id: `ch-s-vinland-prod-5-p${i + 1}`,
      index: i + 1,
      fileName: `vin05-${String(i + 1).padStart(2, "0")}.jpg`,
      fileUrl: "",
      sizeKB: 318,
      uploadedAt: iso(-2),
    })),
    reviewNotes: [
      {
        id: "ch-s-vinland-prod-5-n1",
        authorId: "u-editor",
        authorName: "Tanaka Akira",
        authorRole: "editor",
        text: "Pages 08-09: the action flow is not continuous; add a reaction panel.",
        resolved: false,
        createdAt: iso(-1),
      },
      {
        id: "ch-s-vinland-prod-5-n2",
        authorId: "u-assist",
        authorName: "Mai Letterer",
        authorRole: "assistant",
        text: "Updated the SFX 'crash' font on page 15.",
        resolved: true,
        createdAt: iso(-2),
      },
    ],
  }),
  makeChapter("s-vinland-prod", 6, "Old Scar", "REVISION", {
    draftDueAt: iso(6),
    revisionRound: 1,
    pages: Array.from({ length: 18 }, (_, i) => ({
      id: `ch-s-vinland-prod-6-p${i + 1}`,
      index: i + 1,
      fileName: `vin06-rev1-${String(i + 1).padStart(2, "0")}.jpg`,
      fileUrl: "",
      sizeKB: 300,
      uploadedAt: iso(-1),
    })),
    reviewNotes: [
      {
        id: "ch-s-vinland-prod-6-n1",
        authorId: "u-editor",
        authorName: "Tanaka Akira",
        authorRole: "editor",
        text: "The battle background on page 04 needs more distant layers for depth.",
        resolved: false,
        createdAt: iso(-2),
      },
    ],
  }),
  makeChapter("s-vinland-prod", 7, "Call of the North Wind", "DRAFTING", {
    draftDueAt: iso(4),
    pages: Array.from({ length: 9 }, (_, i) => ({
      id: `ch-s-vinland-prod-7-p${i + 1}`,
      index: i + 1,
      fileName: `vin07-wip-${i + 1}.jpg`,
      fileUrl: "",
      sizeKB: 270,
      uploadedAt: iso(0),
    })),
  }),
  makeChapter("s-vinland-prod", 8, "Unnamed Horizon", "PLANNED", {
    draftDueAt: iso(20),
  }),
  // Monster Epilogue
  makeChapter("s-monster-prod", 1, "Opening Words", "PUBLISHED", { publishedAt: iso(-200) }),
  makeChapter("s-monster-prod", 2, "The Face", "PUBLISHED", { publishedAt: iso(-180) }),
  makeChapter("s-monster-prod", 3, "The Ghost", "PUBLISHED", { publishedAt: iso(-160) }),
  makeChapter("s-monster-prod", 4, "Finale", "PUBLISHED", { publishedAt: iso(-140) }),
];
