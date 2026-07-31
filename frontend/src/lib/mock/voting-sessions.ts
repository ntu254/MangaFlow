import type { VotingSession } from "@/entities/board/model/voting-types";

const now = Date.now();
const ago = (h: number) => new Date(now - h * 3600_000).toISOString();
const ahead = (h: number) => new Date(now + h * 3600_000).toISOString();

export const seedVotingSessions: VotingSession[] = [
  {
    id: "vs-001",
    title: "Board Session — This Week",
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
        reason: "Awaiting more votes (2/5).",
      },
    ],
    notes: [
      {
        id: "sn-001",
        authorId: "u-editor",
        authorName: "Tanaka Akira",
        text: "Requesting Board attention to the kabuki concept section — reference materials attached.",
        createdAt: ago(2),
      },
    ],
  },
  {
    id: "vs-002",
    title: "Ad-hoc Session — Ramen Saint",
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
        reason: "Quorum of 3 APPROVE reached.",
      },
    ],
    notes: [],
  },
  {
    id: "vs-003",
    title: "Board Re-vote — Ember Engine",
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
        reason: "Prior round tied 2-2. A fresh Board re-vote is open.",
      },
    ],
    notes: [
      {
        id: "sn-003",
        authorId: "u-board",
        authorName: "Yamamoto Director",
        text: "Fresh Board re-vote opened — chapter 2 pacing needs reassessment.",
        createdAt: ago(13),
      },
    ],
  },
];
