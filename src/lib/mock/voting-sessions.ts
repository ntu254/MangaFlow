import type { VotingSession } from "@/entities/board/model/voting-types";

const now = Date.now();
const ago = (h: number) => new Date(now - h * 3600_000).toISOString();
const ahead = (h: number) => new Date(now + h * 3600_000).toISOString();

export const seedVotingSessions: VotingSession[] = [
  {
    id: "vs-001",
    title: "Phiên họp Board — Tuần này",
    mode: "SCHEDULED",
    status: "OPEN",
    scheduledFor: ahead(48),
    closesAt: ahead(72),
    proposalIds: ["p-004"],
    createdById: "u-editor",
    createdByName: "Tanaka Akira",
    openedAt: ago(2),
    outcomes: [
      {
        proposalId: "p-004",
        decision: "PENDING",
        approve: 2,
        reject: 0,
        abstain: 0,
        reason: "Đang chờ thêm phiếu (2/5).",
      },
    ],
    notes: [
      {
        id: "sn-001",
        authorId: "u-editor",
        authorName: "Tanaka Akira",
        text: "Yêu cầu Board chú ý phần concept kabuki — đã đính kèm tư liệu tham khảo.",
        createdAt: ago(2),
      },
    ],
  },
  {
    id: "vs-002",
    title: "Phiên ad-hoc — Ramen Saint",
    mode: "AD_HOC",
    status: "CLOSED",
    proposalIds: ["p-005"],
    createdById: "u-editor",
    createdByName: "Tanaka Akira",
    openedAt: ago(360),
    closedAt: ago(290),
    outcomes: [
      {
        proposalId: "p-005",
        decision: "APPROVED",
        approve: 3,
        reject: 0,
        abstain: 0,
        decidedAt: ago(290),
        reason: "Quorum 3 APPROVE đạt được.",
      },
    ],
    notes: [],
  },
  {
    id: "vs-003",
    title: "Phiên đặc biệt — Ember Engine (tie-break)",
    mode: "SCHEDULED",
    status: "OPEN",
    scheduledFor: ago(12),
    closesAt: ahead(24),
    proposalIds: ["p-009"],
    createdById: "u-editor",
    createdByName: "Tanaka Akira",
    openedAt: ago(50),
    outcomes: [
      {
        proposalId: "p-009",
        decision: "NO_QUORUM",
        approve: 2,
        reject: 2,
        abstain: 0,
        reason: "Hoà 2-2. Chờ Editor-in-chief phá tie.",
      },
    ],
    notes: [
      {
        id: "sn-003",
        authorId: "u-board",
        authorName: "Yamamoto Director",
        text: "Đề xuất chuyển cho Editor-in-chief quyết định cuối cùng — pacing chương 2 cần đánh giá lại.",
        createdAt: ago(13),
      },
    ],
  },
];
