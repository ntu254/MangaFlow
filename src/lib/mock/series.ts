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
    synopsis: "Phần ngoại truyện về Guts trong giai đoạn Black Swordsman.",
    genres: ["Seinen", "Dark Fantasy"],
    coverUrl: berserk,
    status: "ONGOING",
    cadence: "biweekly",
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
    synopsis: "Tiếp nối hành trình của Thorfinn ở vùng đất mới.",
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
    synopsis: "Vài chương kết tổng kết hành trình Tenma.",
    genres: ["Seinen", "Psychological"],
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
  makeChapter("s-berserk-prod", 1, "Bóng đêm khởi đầu", "PUBLISHED", {
    publishedAt: iso(-60),
    scheduledAt: iso(-60),
  }),
  makeChapter("s-berserk-prod", 2, "Lưỡi gươm vô danh", "PUBLISHED", {
    publishedAt: iso(-46),
    scheduledAt: iso(-46),
  }),
  makeChapter("s-berserk-prod", 3, "Vết thương cũ", "PUBLISHED", {
    publishedAt: iso(-32),
    scheduledAt: iso(-32),
  }),
  makeChapter("s-berserk-prod", 4, "Tiếng vọng", "SCHEDULED", {
    scheduledAt: iso(3),
  }),
  makeChapter("s-berserk-prod", 5, "Ánh trăng cuối", "IN_REVIEW", {
    reviewDueAt: iso(2),
    reviewNotes: [
      {
        id: "ch-s-berserk-prod-5-n1",
        authorId: "u-editor",
        authorName: "Tanaka Akira",
        authorRole: "editor",
        text: "Panel 3 trang 12: bố cục mất nhịp, cần xem lại khoảng trống giữa speech bubble.",
        resolved: false,
        createdAt: iso(-1),
      },
      {
        id: "ch-s-berserk-prod-5-n2",
        authorId: "u-board",
        authorName: "Hội đồng biên tập",
        authorRole: "board",
        text: "Tone màu phần kết quá tối, cân nhắc highlight thêm.",
        resolved: true,
        createdAt: iso(-3),
      },
    ],
  }),
  makeChapter("s-berserk-prod", 6, "Khúc bi tráng", "DRAFTING", {
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
  makeChapter("s-berserk-prod", 7, "Chương 7 (draft note)", "PLANNED", {
    draftDueAt: iso(12),
  }),
  // Vinland: New Horizon — full status coverage
  makeChapter("s-vinland-prod", 1, "Bến cảng mới", "PUBLISHED", {
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
  makeChapter("s-vinland-prod", 2, "Lời thề trên cát", "PUBLISHED", {
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
  makeChapter("s-vinland-prod", 3, "Mặt trời lạnh", "SCHEDULED", {
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
  makeChapter("s-vinland-prod", 4, "Người lạ trong rừng", "APPROVED", {
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
        text: "Đã chỉnh lại lettering trang 14 theo yêu cầu.",
        resolved: true,
        createdAt: iso(-5),
      },
    ],
  }),
  makeChapter("s-vinland-prod", 5, "Đêm trắng", "IN_REVIEW", {
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
        text: "Trang 08–09: hành động không liền mạch, cần insert thêm panel reaction.",
        resolved: false,
        createdAt: iso(-1),
      },
      {
        id: "ch-s-vinland-prod-5-n2",
        authorId: "u-assist",
        authorName: "Mai Letterer",
        authorRole: "assistant",
        text: "Đã sửa font cho SFX 'crash' ở trang 15.",
        resolved: true,
        createdAt: iso(-2),
      },
    ],
  }),
  makeChapter("s-vinland-prod", 6, "Vết sẹo cũ", "REVISION", {
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
        text: "Bối cảnh chiến trận trang 04 cần thêm tầng layer xa để tăng chiều sâu.",
        resolved: false,
        createdAt: iso(-2),
      },
    ],
  }),
  makeChapter("s-vinland-prod", 7, "Tiếng gọi gió Bắc", "DRAFTING", {
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
  makeChapter("s-vinland-prod", 8, "Chân trời chưa đặt tên", "PLANNED", {
    draftDueAt: iso(20),
  }),
  // Monster Epilogue
  makeChapter("s-monster-prod", 1, "Lời mở", "PUBLISHED", { publishedAt: iso(-200) }),
  makeChapter("s-monster-prod", 2, "Gương mặt", "PUBLISHED", { publishedAt: iso(-180) }),
  makeChapter("s-monster-prod", 3, "Bóng ma", "PUBLISHED", { publishedAt: iso(-160) }),
  makeChapter("s-monster-prod", 4, "Hồi kết", "PUBLISHED", { publishedAt: iso(-140) }),
];
