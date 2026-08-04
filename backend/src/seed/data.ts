import bcrypt from "bcryptjs";
import type { Role } from "../types.js";

const now = new Date("2026-06-24T00:00:00.000Z").getTime();
const hour = 3_600_000;
const day = 86_400_000;
const ago = (hours: number) => new Date(now - hours * hour).toISOString();
const ahead = (days: number) => new Date(now + days * day).toISOString();

export type SeedUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  isChair?: boolean;
};

export const seedUsers: SeedUser[] = [
  { id: "u-admin", name: "Hayashi Admin", email: "admin@beachread.jp", password: "admin@beachread.jp", role: "ADMIN" },
  { id: "u-mangaka", name: "Inoue Takehiko", email: "inoue@beachread.jp", password: "inoue@beachread.jp", role: "MANGAKA" },
  { id: "u-assist", name: "Suzuki Jun", email: "jun@beachread.jp", password: "jun@beachread.jp", role: "ASSISTANT" },
  { id: "u-assist-2", name: "Nakamura Hina", email: "hina@beachread.jp", password: "hina@beachread.jp", role: "ASSISTANT" },
  {
    id: "u-editor",
    name: "Tanaka Akira",
    email: "tanaka@beachread.jp",
    password: "tanaka@beachread.jp",
    role: "EDITOR"
  },
  {
    id: "u-mobile-editor",
    name: "Mobile Editor",
    email: "editor@mangaflow.local",
    password: "editor@mangaflow.local",
    role: "EDITOR"
  },
  { id: "u-board", name: "Yamamoto Director", email: "board@beachread.jp", password: "board@beachread.jp", role: "BOARD", isChair: true },
  { id: "u-board-2", name: "Sato Eriko", email: "sato@beachread.jp", password: "sato@beachread.jp", role: "BOARD" },
  { id: "u-board-3", name: "Kobayashi Ren", email: "kobayashi@beachread.jp", password: "kobayashi@beachread.jp", role: "BOARD" },
  { id: "u-board-4", name: "Watanabe Kaoru", email: "watanabe@beachread.jp", password: "watanabe@beachread.jp", role: "BOARD" },
  { id: "u-board-5", name: "Mori Haruto", email: "mori@beachread.jp", password: "mori@beachread.jp", role: "BOARD" }
];

function manuscript(proposalId: string, version = 1) {
  return {
    id: `${proposalId}-mv${version}`,
    version,
    fileName: `${proposalId}-v${version}.pdf`,
    file: {
      originalName: `${proposalId}-v${version}.pdf`,
      mimeType: "application/pdf",
      size: 1_320_000 + version * 32_000
    },
    fileUrl: "metadata://signed-url-not-issued",
    fileType: "application/pdf",
    sizeKB: 1280 + version * 32,
    uploadedById: "u-mangaka",
    uploadedByName: "Inoue Takehiko",
    uploadedAt: ago(96 - version)
  };
}

export const seedProposals = [
  {
    id: "p-001",
    slug: "iron-coast",
    title: "Iron Coast",
    authorId: "u-mangaka",
    authorName: "Inoue Takehiko",
    synopsis: "A displaced smith returns to the iron coast to recover a family craft during a water war.",
    logline: "A forge without water becomes the last honest court.",
    genres: ["Drama", "Historical", "Action"],
    targetAudience: "seinen",
    requestedPublicationType: "MONTHLY",
    chaptersPlanned: 60,
    coverUrl: "/assets/covers/berserk.jpg",
    sampleChapterUrl: "metadata://sample",
    status: "DRAFT",
    votes: [],
    manuscripts: [manuscript("p-001")],
    materials: [],
    requestedChanges: [],
    revisionRound: 0,
    history: [{ id: "p-001-e1", proposalId: "p-001", actorId: "u-mangaka", actorName: "Inoue Takehiko", actorRole: "mangaka", type: "CREATE", toStatus: "DRAFT", createdAt: ago(72) }],
    createdAt: ago(72),
    updatedAt: ago(72)
  },
  {
    id: "p-002",
    slug: "neon-tide",
    title: "Neon Tide",
    authorId: "u-mangaka",
    authorName: "Inoue Takehiko",
    synopsis: "A neon repairer in Osaka 2089 finds the city's signs storing erased memories.",
    logline: "Every broken sign remembers someone the city chose to forget.",
    genres: ["Sci-Fi", "Mystery", "Drama"],
    targetAudience: "seinen",
    requestedPublicationType: "MONTHLY",
    chaptersPlanned: 40,
    coverUrl: "/assets/covers/ghostfixers.jpg",
    sampleChapterUrl: "metadata://sample",
    status: "PENDING_EDITOR",
    assignedEditorId: "u-editor",
    assignedEditorName: "Tanaka Akira",
    votes: [],
    manuscripts: [manuscript("p-002")],
    materials: [],
    requestedChanges: [],
    revisionRound: 0,
    submittedAt: ago(48),
    history: [
      { id: "p-002-e1", proposalId: "p-002", actorId: "u-mangaka", actorName: "Inoue Takehiko", actorRole: "mangaka", type: "CREATE", toStatus: "DRAFT", createdAt: ago(96) },
      { id: "p-002-e2", proposalId: "p-002", actorId: "u-mangaka", actorName: "Inoue Takehiko", actorRole: "mangaka", type: "SUBMIT", fromStatus: "DRAFT", toStatus: "PENDING_EDITOR", createdAt: ago(48) }
    ],
    createdAt: ago(96),
    updatedAt: ago(48)
  },
  {
    id: "p-003",
    slug: "salt-letters",
    title: "Salt Letters",
    authorId: "u-mangaka",
    authorName: "Inoue Takehiko",
    synopsis: "A boat courier crosses a postwar archipelago with the last letters between divided families.",
    logline: "Some mail is heavier than ballast.",
    genres: ["Drama", "Slice of Life", "Historical"],
    targetAudience: "josei",
    requestedPublicationType: "MONTHLY",
    chaptersPlanned: 24,
    coverUrl: "/assets/covers/monster.jpg",
    sampleChapterUrl: "metadata://sample",
    status: "CHANGES_REQUESTED",
    assignedEditorId: "u-editor",
    assignedEditorName: "Tanaka Akira",
    claimedByEditorId: "u-editor",
    claimedByEditorName: "Tanaka Akira",
    claimedAt: ago(110),
    reviewStartedAt: ago(110),
    votes: [],
    manuscripts: [manuscript("p-003")],
    materials: [],
    revisionRound: 1,
    submittedAt: ago(120),
    requestedChanges: [
      {
        id: "rc-003-1",
        editorId: "u-editor",
        editorName: "Tanaka Akira",
        comment: "Expand supporting characters and soften the opening tone.",
        createdAt: ago(100),
        items: [
          { id: "rc-003-1-i1", text: "Introduce two supporting characters in chapter 1.", resolved: false },
          { id: "rc-003-1-i2", text: "Lighten the first ten pages for josei positioning.", resolved: false }
        ]
      }
    ],
    history: [
      { id: "p-003-e1", proposalId: "p-003", actorId: "u-mangaka", actorName: "Inoue Takehiko", actorRole: "mangaka", type: "CREATE", toStatus: "DRAFT", createdAt: ago(160) },
      { id: "p-003-e2", proposalId: "p-003", actorId: "u-editor", actorName: "Tanaka Akira", actorRole: "editor", type: "REQUEST_CHANGES", fromStatus: "EDITOR_REVIEWING", toStatus: "CHANGES_REQUESTED", comment: "Expand supporting characters.", createdAt: ago(100) }
    ],
    createdAt: ago(160),
    updatedAt: ago(100)
  },
  {
    id: "p-004",
    slug: "kabuki-static",
    title: "Kabuki Static",
    authorId: "u-mangaka",
    authorName: "Inoue Takehiko",
    synopsis: "A kabuki actor joins 1960s television and discovers stage scripts are being used as code.",
    logline: "Broadcast static becomes the chorus.",
    genres: ["Drama", "Mystery", "Historical"],
    targetAudience: "seinen",
    requestedPublicationType: "WEEKLY",
    chaptersPlanned: 36,
    coverUrl: "/assets/covers/kingdom.jpg",
    sampleChapterUrl: "metadata://sample",
    status: "BOARD_REVIEW",
    activeVotingSessionId: "vs-001",
    activeProposalVersionId: "1",
    assignedEditorId: "u-editor",
    assignedEditorName: "Tanaka Akira",
    editorForwardedAt: ago(40),
    // @deprecated cache — source of truth is proposalvotes collection
    votes: [
      { memberId: "u-board", memberName: "Yamamoto Director", voterId: "u-board", voterName: "Yamamoto Director", decision: "APPROVE", comment: "Strong concept.", createdAt: ago(18), votedAt: ago(18), isChair: true, weight: 1 },
      { memberId: "u-board-2", memberName: "Sato Eriko", voterId: "u-board-2", voterName: "Sato Eriko", decision: "APPROVE", createdAt: ago(12), votedAt: ago(12), weight: 1 }
    ],
    manuscripts: [manuscript("p-004")],
    materials: [],
    requestedChanges: [],
    revisionRound: 0,
    submittedAt: ago(100),
    history: [
      { id: "p-004-e1", proposalId: "p-004", actorId: "u-editor", actorName: "Tanaka Akira", actorRole: "editor", type: "FORWARD", fromStatus: "EDITOR_REVIEWING", toStatus: "PENDING_BOARD", createdAt: ago(40) },
      { id: "p-004-e2", proposalId: "p-004", actorId: "u-board", actorName: "Yamamoto Director", actorRole: "board", type: "VOTE", comment: "APPROVE", createdAt: ago(18) }
    ],
    createdAt: ago(200),
    updatedAt: ago(12)
  },
  {
    id: "p-009",
    slug: "ember-engine",
    title: "Ember Engine",
    authorId: "u-mangaka",
    authorName: "Inoue Takehiko",
    synopsis: "Two engineer sisters on a soul-powered steamship decide whether to save the captain or free the last soul.",
    logline: "A boiler room becomes a courtroom for the dead.",
    genres: ["Fantasy", "Drama", "Adventure"],
    targetAudience: "seinen",
    requestedPublicationType: "MONTHLY",
    chaptersPlanned: 32,
    coverUrl: "/assets/covers/gachiakuta.jpg",
    sampleChapterUrl: "metadata://sample",
    status: "BOARD_REVIEW",
    activeVotingSessionId: "vs-003",
    activeProposalVersionId: "1",
    assignedEditorId: "u-editor",
    assignedEditorName: "Tanaka Akira",
    // @deprecated cache
    votes: [
      { memberId: "u-board-2", memberName: "Sato Eriko", voterId: "u-board-2", voterName: "Sato Eriko", decision: "APPROVE", createdAt: ago(20), votedAt: ago(20), weight: 1 },
      { memberId: "u-board-3", memberName: "Kobayashi Ren", voterId: "u-board-3", voterName: "Kobayashi Ren", decision: "APPROVE", createdAt: ago(18), votedAt: ago(18), weight: 1 },
      { memberId: "u-board-4", memberName: "Watanabe Kaoru", voterId: "u-board-4", voterName: "Watanabe Kaoru", decision: "REJECT", createdAt: ago(16), votedAt: ago(16), weight: 1 },
      { memberId: "u-board-5", memberName: "Mori Haruto", voterId: "u-board-5", voterName: "Mori Haruto", decision: "REJECT", createdAt: ago(14), votedAt: ago(14), weight: 1 }
    ],
    manuscripts: [manuscript("p-009")],
    materials: [],
    requestedChanges: [],
    revisionRound: 0,
    submittedAt: ago(100),
    history: [{ id: "p-009-e1", proposalId: "p-009", actorId: "system", actorName: "System", actorRole: "admin", type: "BOARD_REVOTE", fromStatus: "BOARD_REVIEW", toStatus: "BOARD_REVIEW", comment: "The prior Board round tied; a fresh re-vote is open.", createdAt: ago(14) }],
    createdAt: ago(300),
    updatedAt: ago(14)
  },
  {
    id: "p-007",
    slug: "harbor-of-bones",
    title: "Harbor of Bones",
    authorId: "u-editor",
    authorName: "Tanaka Akira",
    synopsis: "A fantasy story about an editor writing their own proposal.",
    logline: "No self-approval allowed.",
    genres: ["Fantasy", "Mystery"],
    targetAudience: "seinen",
    requestedPublicationType: "MONTHLY",
    chaptersPlanned: 24,
    coverUrl: "/assets/covers/berserk.jpg",
    sampleChapterUrl: "metadata://sample",
    status: "PENDING_EDITOR",
    assignedEditorId: "u-editor",
    assignedEditorName: "Tanaka Akira",
    votes: [],
    manuscripts: [manuscript("p-007")],
    materials: [],
    requestedChanges: [],
    revisionRound: 0,
    history: [{ id: "p-007-e1", proposalId: "p-007", actorId: "u-editor", actorName: "Tanaka Akira", actorRole: "editor", type: "CREATE", toStatus: "DRAFT", createdAt: ago(72) }],
    createdAt: ago(72),
    updatedAt: ago(72)
  }
];

/* ------------------------------------------------------------------ */
/*  ProposalVotes (new collection — source of truth for board votes)   */
/* ------------------------------------------------------------------ */

export const seedProposalVotes = [
  // p-004 Kabuki Static — 2 votes in session vs-001
  {
    id: "pv-001",
    sessionId: "vs-001",
    proposalId: "p-004",
    voterId: "u-board",
    voterName: "Yamamoto Director",
    voterRole: "BOARD",
    decision: "APPROVE",
    comment: "Strong concept.",
    votedAt: ago(18),
    weight: 1,
    createdAt: ago(18),
    updatedAt: ago(18)
  },
  {
    id: "pv-002",
    sessionId: "vs-001",
    proposalId: "p-004",
    voterId: "u-board-2",
    voterName: "Sato Eriko",
    voterRole: "BOARD",
    decision: "APPROVE",
    comment: "",
    votedAt: ago(12),
    weight: 1,
    createdAt: ago(12),
    updatedAt: ago(12)
  },
  // p-009 Ember Engine — prior tied round (2 approve, 2 reject, four-seat snapshot)
  {
    id: "pv-003",
    sessionId: "vs-002",
    proposalId: "p-009",
    voterId: "u-board-2",
    voterName: "Sato Eriko",
    voterRole: "BOARD",
    decision: "APPROVE",
    comment: "",
    votedAt: ago(20),
    weight: 1,
    createdAt: ago(20),
    updatedAt: ago(20)
  },
  {
    id: "pv-004",
    sessionId: "vs-002",
    proposalId: "p-009",
    voterId: "u-board-3",
    voterName: "Kobayashi Ren",
    voterRole: "BOARD",
    decision: "APPROVE",
    comment: "",
    votedAt: ago(18),
    weight: 1,
    createdAt: ago(18),
    updatedAt: ago(18)
  },
  {
    id: "pv-005",
    sessionId: "vs-002",
    proposalId: "p-009",
    voterId: "u-board-4",
    voterName: "Watanabe Kaoru",
    voterRole: "BOARD",
    decision: "REJECT",
    comment: "Not suited for current market.",
    votedAt: ago(16),
    weight: 1,
    createdAt: ago(16),
    updatedAt: ago(16)
  },
  {
    id: "pv-006",
    sessionId: "vs-002",
    proposalId: "p-009",
    voterId: "u-board-5",
    voterName: "Mori Haruto",
    voterRole: "BOARD",
    decision: "REJECT",
    comment: "",
    votedAt: ago(14),
    weight: 1,
    createdAt: ago(14),
    updatedAt: ago(14)
  },
];

function pages(chapterId: string, count: number, status: "UPLOADED" | "FINALIZED" = "UPLOADED") {
  return Array.from({ length: count }, (_, index) => ({
    id: `${chapterId}-p${index + 1}`,
    index: index + 1,
    pageNumber: index + 1,
    fileName: `page-${String(index + 1).padStart(2, "0")}.jpg`,
    fileUrl: `https://picsum.photos/seed/${chapterId}-${index + 1}/300/420`,
    imageUrl: `https://picsum.photos/seed/${chapterId}-${index + 1}/300/420`,
    status,
    sizeKB: 310 + index,
    uploadedAt: ago(36)
  }));
}

export const seedSeries = [
  {
    id: "s-berserk-prod",
    slug: "berserk-prod",
    title: "Berserk: Lost Chapters",
    synopsis: "A side story from the Black Swordsman period.",
    genres: ["Seinen", "Dark Fantasy"],
    coverUrl: "/assets/covers/berserk.jpg",
    status: "ONGOING",
    visibility: "PUBLIC",
    publicationType: "WEEKLY",
    cadence: "monthly",
    startDate: ahead(-90),
    targetChapters: 24,
    authorId: "u-mangaka",
    authorName: "Inoue Takehiko",
    editorId: "u-editor",
    editorName: "Tanaka Akira",
    /** @deprecated use seriesmembers */
    assistantIds: ["u-assist"],
    createdAt: ahead(-90),
    updatedAt: ahead(-2)
  },
  {
    id: "s-vinland-prod",
    slug: "vinland-arc",
    title: "Vinland: New Horizon",
    synopsis: "A new land and a quieter kind of conquest.",
    genres: ["Seinen", "Historical"],
    coverUrl: "/assets/covers/vinland.jpg",
    status: "PLANNING",
    visibility: "PRIVATE",
    publicationType: "MONTHLY",
    cadence: "monthly",
    startDate: ahead(14),
    targetChapters: 12,
    authorId: "u-mangaka",
    authorName: "Inoue Takehiko",
    editorId: "u-editor",
    editorName: "Tanaka Akira",
    /** @deprecated use seriesmembers */
    assistantIds: ["u-assist", "u-assist-2"],
    createdAt: ahead(-10),
    updatedAt: ahead(-1)
  }
];

export const seedChapters = [
  {
    id: "ch-s-berserk-prod-4",
    seriesId: "s-berserk-prod",
    number: 4,
    title: "Echoes",
    targetPages: 18,
    // Chapter stays READY_FOR_PUBLICATION; the SCHEDULED state lives on its
    // Publication (see seedPublications).
    status: "READY_FOR_PUBLICATION",
    assigneeId: "u-mangaka",
    assigneeName: "Inoue Takehiko",
    scheduledAt: ahead(3),
    readyForPublicationAt: ago(5),
    readyByEditorId: "u-editor",
    scheduledById: "u-editor",
    pages: pages("ch-s-berserk-prod-4", 18, "FINALIZED"),
    reviewNotes: [],
    revisionRound: 0,
    history: [],
    createdAt: ahead(-30),
    updatedAt: ahead(-3)
  },
  {
    id: "ch-s-berserk-prod-5",
    seriesId: "s-berserk-prod",
    number: 5,
    title: "Old Wound",
    targetPages: 18,
    // Canonical: chapter awaiting Tantou (Editor) review. A frozen review
    // snapshot is required before the Editor can approve; an empty page-version
    // list keeps the demo snapshot valid without pinning generated page ids.
    status: "TANTOU_REVIEW",
    reviewSnapshot: { pageVersionIds: [], frozenAt: ahead(-1) },
    assigneeId: "u-mangaka",
    assigneeName: "Inoue Takehiko",
    reviewDueAt: ahead(2),
    pages: pages("ch-s-berserk-prod-5", 18),
    reviewNotes: [
      {
        id: "rn-1",
        authorId: "u-editor",
        authorName: "Tanaka Akira",
        authorRole: "editor",
        text: "Panel rhythm needs one more beat on page 12.",
        resolved: false,
        createdAt: ahead(-1)
      }
    ],
    revisionRound: 0,
    history: [],
    createdAt: ahead(-20),
    updatedAt: ahead(-1)
  },
  {
    id: "ch-s-vinland-prod-1",
    seriesId: "s-vinland-prod",
    number: 1,
    title: "New Harbor",
    targetPages: 22,
    // Canonical: editor-approved chapter ready for publication scheduling.
    status: "READY_FOR_PUBLICATION",
    assigneeId: "u-mangaka",
    assigneeName: "Inoue Takehiko",
    readyByEditorId: "u-editor",
    pages: pages("ch-s-vinland-prod-1", 22, "FINALIZED"),
    reviewNotes: [],
    revisionRound: 0,
    history: [],
    createdAt: ahead(-12),
    updatedAt: ahead(-1)
  }
];

// Scheduling lives on Publication, not on the chapter. Chapter ch-s-berserk-prod-4
// stays READY_FOR_PUBLICATION while this Publication holds the SCHEDULED state.
export const seedPublications = [
  {
    id: "pub-berserk-prod-4",
    seriesId: "s-berserk-prod",
    chapterId: "ch-s-berserk-prod-4",
    status: "SCHEDULED",
    scheduledAt: ahead(3),
    scheduledById: "u-editor",
    createdAt: ago(5),
    updatedAt: ago(1)
  }
];

export const seedStudioRegions = [
  {
    id: "reg-001",
    seriesId: "s-berserk-prod",
    chapterId: "ch-s-berserk-prod-5",
    pageId: "ch-s-berserk-prod-5-p1",
    type: "speech_bubble",
    status: "DETECTED",
    lockStatus: "UNLOCKED",
    x: 120,
    y: 160,
    width: 280,
    height: 160,
    label: "Bubble 01"
  }
];

export const seedStudioTasks = [
  {
    id: "tsk-001",
    seriesId: "s-berserk-prod",
    chapterId: "ch-s-berserk-prod-5",
    pageId: "ch-s-berserk-prod-5-p1",
    title: "Clean speech bubble on page 01",
    type: "speech_bubble",
    assigneeId: "u-assist",
    assigneeName: "Suzuki Jun",
    priority: "high",
    // MANGAKA_APPROVED — waiting for Editor's final review
    status: "MANGAKA_APPROVED",
    dueAt: ahead(1),
    instructions: "Keep lettering area clear; preserve original panel texture.",
    rateCode: "SPEECH_BUBBLE",
    rateVersion: 1,
    quantity: 1,
    rateSnapshot: 25,
    estimatedAmount: 25,
    currency: "USD",
    startedAt: ago(48),
    submittedAt: ago(32),
    mangakaReviewedAt: ago(20),
    mangakaReviewedById: "u-mangaka",
    createdAt: ago(48),
    updatedAt: ago(20)
  },
  {
    id: "tsk-002",
    seriesId: "s-berserk-prod",
    chapterId: "ch-s-berserk-prod-5",
    pageId: "ch-s-berserk-prod-5-p1",
    title: "Lettering task awaiting work",
    type: "speech_bubble",
    assigneeId: "u-assist",
    assigneeName: "Suzuki Jun",
    priority: "medium",
    // TODO (was previously OPEN — now canonical enum)
    status: "TODO",
    dueAt: ahead(2),
    instructions: "Prepare the lettering layer for the assigned page.",
    rateCode: "SPEECH_BUBBLE",
    rateVersion: 1,
    quantity: 1,
    rateSnapshot: 25,
    estimatedAmount: 25,
    currency: "USD",
    createdAt: ago(24),
    updatedAt: ago(24)
  },
  {
    id: "tsk-003",
    seriesId: "s-vinland-prod",
    chapterId: "ch-s-vinland-prod-1",
    pageId: "ch-s-vinland-prod-1-p1",
    title: "Typeset background text page 01",
    type: "lettering",
    assigneeId: "u-assist-2",
    assigneeName: "Nakamura Hina",
    priority: "normal",
    rateCode: "LETTERING",
    rateVersion: 1,
    quantity: 1,
    rateSnapshot: 20,
    estimatedAmount: 20,
    currency: "USD",
    // Fully completed after editor approval
    status: "MANGAKA_APPROVED",
    dueAt: ahead(-2),
    startedAt: ago(72),
    submittedAt: ago(50),
    mangakaReviewedAt: ago(40),
    mangakaReviewedById: "u-mangaka",
    createdAt: ago(80),
    updatedAt: ago(20)
  }
];

// Demo-only fixtures inherited from the legacy EarningItem examples above.
// Production rates must be created by an Admin; these values are not defaults.
export const seedRateTables = [
  {
    id: "rate-speech-bubble-v1",
    code: "SPEECH_BUBBLE",
    label: "Speech bubble demo rate",
    workUnitType: "PAGE",
    amount: 25,
    currency: "USD",
    version: 1,
    status: "ACTIVE",
    effectiveFrom: ago(24 * 365),
    createdById: "u-admin",
    updatedById: "u-admin",
    createdAt: ago(24),
    updatedAt: ago(24),
  },
  {
    id: "rate-lettering-v1",
    code: "LETTERING",
    label: "Lettering demo rate",
    workUnitType: "PAGE",
    amount: 20,
    currency: "USD",
    version: 1,
    status: "ACTIVE",
    effectiveFrom: ago(24 * 365),
    createdById: "u-admin",
    updatedById: "u-admin",
    createdAt: ago(24),
    updatedAt: ago(24),
  },
];

export const seedComments = [
  {
    id: "cmt-001",
    seriesId: "s-berserk-prod",
    chapterId: "ch-s-berserk-prod-5",
    pageId: "ch-s-berserk-prod-5-p1",
    taskId: "tsk-001",
    targetType: "TASK",
    targetId: "tsk-001",
    authorId: "u-editor",
    authorName: "Tanaka Akira",
    authorRole: "EDITOR",
    body: "The first bubble is too close to the character face.",
    /** @deprecated use body */
    text: "The first bubble is too close to the character face.",
    isBlocking: true,
    status: "OPEN",
    createdAt: ago(12)
  }
];

export const seedSubmissions = [
  {
    id: "sub-001",
    taskId: "tsk-001",
    chapterId: "ch-s-berserk-prod-5",
    assistantId: "u-assist",
    assistantName: "Suzuki Jun",
    submittedBy: { id: "u-assist", name: "Suzuki Jun" },
    submittedAt: ago(32),
    version: 1,
    versionLabel: "v1",
    // After Mangaka approved, now waiting for Editor review
    status: "MANGAKA_APPROVED",
    mangakaDecision: "APPROVED",
    mangakaNote: "Bubble cleaned well. Pass to editor.",
    mangakaReviewedById: "u-mangaka",
    mangakaReviewedAt: ago(20),
    resultText: "Cleaned bubble and exported metadata-only preview.",
    // Legacy fields kept for compat
  },
  {
    id: "sub-002",
    taskId: "tsk-003",
    chapterId: "ch-s-vinland-prod-1",
    assistantId: "u-assist-2",
    assistantName: "Nakamura Hina",
    submittedBy: { id: "u-assist-2", name: "Nakamura Hina" },
    submittedAt: ago(50),
    version: 1,
    versionLabel: "v1",
    // Fully editor-approved — eligible for earning
    status: "MANGAKA_APPROVED",
    mangakaDecision: "APPROVED",
    mangakaNote: "Clean typeset.",
    mangakaReviewedById: "u-mangaka",
    mangakaReviewedAt: ago(40),
    resultText: "Typeset background text completed.",
  }
];

export const seedMaterials = [
  {
    id: "mat-001",
    seriesId: "s-berserk-prod",
    scope: "SERIES",
    ownerType: "series",
    ownerId: "s-berserk-prod",
    title: "Chapter 5 reference board",
    kind: "reference",
    // type field deprecated, kind is source of truth
    tags: ["reference", "chapter-5"],
    currentVersion: 1,
    versions: [
      {
        id: "mat-001-v1",
        version: 1,
        fileName: "chapter-5-reference.pdf",
        fileUrl: "metadata://signed-url-not-issued",
        fileType: "application/pdf",
        sizeKB: 900,
        uploadedById: "u-mangaka",
        uploadedByName: "Inoue Takehiko",
        uploadedAt: ago(36)
      }
    ],
    createdAt: ago(36),
    updatedAt: ago(36)
  }
];

export const seedVotingSessions = [
  {
    id: "vs-001",
    title: "Board review - weekly slate",
    mode: "SCHEDULED",
    targetType: "PROPOSAL",
    proposalId: "p-004",
    proposalVersionId: "1",
    status: "OPEN",
    version: 1,
    scheduledFor: ahead(2),
    closesAt: ahead(3),
    proposalIds: ["p-004"],
    eligibleVoterIds: ["u-board", "u-board-2", "u-board-3", "u-board-4", "u-board-5"],
    quorum: 3,
    chairId: "u-board",
    rules: {
      approveThreshold: 3,
      rejectThreshold: 3,
    },
    createdById: "u-editor",
    createdByName: "Tanaka Akira",
    openedAt: ago(2),
    outcomes: [
      {
        proposalId: "p-004",
        decision: "PENDING",
        approveCount: 2,
        rejectCount: 0,
        finalReason: "Waiting for more votes."
      }
    ],
    notes: []
  },
  {
    id: "vs-002",
    title: "Board review - Ember Engine",
    mode: "SCHEDULED",
    targetType: "PROPOSAL",
    proposalId: "p-009",
    proposalVersionId: "1",
    status: "TIED",
    version: 2,
    scheduledFor: ago(16),
    closesAt: ago(13),
    closedAt: ago(13),
    proposalIds: ["p-009"],
    eligibleVoterIds: ["u-board-2", "u-board-3", "u-board-4", "u-board-5"],
    quorum: 3,
    chairId: "u-board",
    rules: {
      approveThreshold: 3,
      rejectThreshold: 3,
    },
    createdById: "u-editor",
    createdByName: "Tanaka Akira",
    openedAt: ago(50),
    outcomes: [
      {
        proposalId: "p-009",
        decision: "TIED",
        approveCount: 2,
        rejectCount: 2,
        finalReason: "All eligible Board members voted and the round ended in a tie."
      }
    ],
    notes: []
  },
  {
    id: "vs-003",
    title: "Board review - Ember Engine (re-vote)",
    mode: "SCHEDULED",
    targetType: "PROPOSAL",
    proposalId: "p-009",
    proposalVersionId: "1",
    reVoteOfSessionId: "vs-002",
    status: "OPEN",
    version: 1,
    scheduledFor: ago(12),
    closesAt: ahead(1),
    proposalIds: ["p-009"],
    eligibleVoterIds: ["u-board-2", "u-board-3", "u-board-4", "u-board-5"],
    quorum: 3,
    chairId: "u-board",
    rules: {
      approveThreshold: 3,
      rejectThreshold: 3,
    },
    createdById: "u-board",
    createdByName: "Yamamoto Director",
    openedAt: ago(12),
    outcomes: [],
    notes: [
      {
        id: "vsn-003",
        authorId: "u-board",
        authorName: "Yamamoto Director",
        text: "Fresh re-vote opened after the prior round tied.",
        createdAt: ago(12)
      }
    ]
  }
];

export const seedRankings = [
  {
    id: "rank-001",
    seriesId: "s-berserk-prod",
    seriesTitle: "Berserk: Lost Chapters",
    period: "2026-W26",
    readerScore: 8.4,
    voteCount: 18420,
    finalScore: 8.1,
    rank: 1,
    previousRank: 2,
    movement: 1,
    status: "SUBMITTED",
    source: "CSV_IMPORT",
    importBatchId: "rimport-001",
    importedById: "u-admin",
    importedAt: ago(12),
    atRisk: false
  },
  {
    id: "rank-002",
    seriesId: "s-vinland-prod",
    seriesTitle: "Vinland: New Horizon",
    period: "2026-W26",
    readerScore: 4.2,
    voteCount: 5400,
    finalScore: 4.0,
    rank: 8,
    previousRank: 6,
    movement: -2,
    status: "AT_RISK",
    source: "CSV_IMPORT",
    importBatchId: "rimport-001",
    importedById: "u-admin",
    importedAt: ago(12),
    atRisk: true
  }
];

/* ------------------------------------------------------------------ */
/*  RankingImports (new collection)                                     */
/* ------------------------------------------------------------------ */

export const seedRankingImports = [
  {
    id: "rimport-001",
    period: "2026-W26",
    sourceFileKey: "imports/rankings/2026-W26.csv",
    sourceFileName: "rankings-2026-W26.csv",
    importedById: "u-admin",
    importedByName: "Hayashi Admin",
    status: "IMPORTED",
    totalRows: 10,
    successRows: 10,
    failedRows: 0,
    errors: [],
    importedAt: ago(12),
    createdAt: ago(14),
    updatedAt: ago(12)
  }
];

export const seedEarnings = [
  {
    id: "earn-001",
    assistantId: "u-assist",
    period: "2026-06",
    subtotal: 450,
    bonus: 30,
    penalty: 0,
    amount: 480,
    currency: "USD",
    status: "PENDING",
    createdAt: ago(48),
    updatedAt: ago(48)
  },
  {
    id: "earn-002",
    assistantId: "u-assist-2",
    period: "2026-06",
    subtotal: 300,
    bonus: 20,
    penalty: 0,
    amount: 320,
    currency: "USD",
    status: "CONFIRMED",
    confirmedById: "u-admin",
    confirmedAt: ago(10),
    createdAt: ago(48),
    updatedAt: ago(10)
  },
  {
    id: "earn-003",
    assistantId: "u-assist",
    period: "2026-05",
    subtotal: 170,
    bonus: 10,
    penalty: 0,
    amount: 180,
    currency: "USD",
    status: "PAID",
    confirmedById: "u-admin",
    confirmedAt: ago(300),
    paidAt: ago(200),
    paidById: "u-admin",
    createdAt: ago(350),
    updatedAt: ago(200)
  }
];

/* ------------------------------------------------------------------ */
/*  EarningItems (new collection — traces earnings back to tasks)       */
/* ------------------------------------------------------------------ */

export const seedEarningItems = [
  {
    id: "ei-001",
    earningId: "earn-001",
    assistantId: "u-assist",
    taskId: "tsk-001",
    submissionId: "sub-001",
    seriesId: "s-berserk-prod",
    chapterId: "ch-s-berserk-prod-5",
    taskType: "speech_bubble",
    rate: 25,
    amount: 25,
    currency: "USD",
    // Still PENDING because submission hasn't been editor-approved yet
    status: "PENDING",
    createdAt: ago(20),
    updatedAt: ago(20)
  },
  {
    id: "ei-002",
    earningId: "earn-002",
    assistantId: "u-assist-2",
    taskId: "tsk-003",
    submissionId: "sub-002",
    seriesId: "s-vinland-prod",
    chapterId: "ch-s-vinland-prod-1",
    taskType: "lettering",
    rate: 20,
    amount: 20,
    currency: "USD",
    // Approved earning item is eligible for payout.
    status: "APPROVED",
    approvedById: "u-admin",
    approvedAt: ago(18),
    createdAt: ago(50),
    updatedAt: ago(18)
  }
];

export const seedSeriesMembers = [
  {
    id: "sm-001",
    seriesId: "s-berserk-prod",
    userId: "u-assist",
    role: "assistant",
    // Legacy free-text retained so existing controllers keep working.
    scope: "Full chapter",
    accessScope: "CHAPTER_ONLY",
    specialization: "GENERAL",
    status: "active",
    assignedChapterIds: ["ch-s-berserk-prod-4", "ch-s-berserk-prod-5"],
    assignedTaskIds: ["tsk-001"],
    createdAt: new Date("2026-06-24T00:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-06-24T00:00:00.000Z").toISOString()
  },
  {
    id: "sm-002",
    seriesId: "s-vinland-prod",
    userId: "u-assist",
    role: "assistant",
    scope: "Backgrounds only",
    accessScope: "TASK_ONLY",
    specialization: "BACKGROUND",
    status: "active",
    assignedChapterIds: ["ch-s-vinland-prod-1"],
    assignedTaskIds: [],
    createdAt: new Date("2026-06-24T00:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-06-24T00:00:00.000Z").toISOString()
  },
  {
    id: "sm-003",
    seriesId: "s-vinland-prod",
    userId: "u-assist-2",
    role: "assistant",
    scope: "Lineart & Inking",
    accessScope: "TASK_ONLY",
    specialization: "INKING",
    status: "active",
    assignedChapterIds: ["ch-s-vinland-prod-1"],
    assignedTaskIds: ["tsk-003"],
    createdAt: new Date("2026-06-24T00:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-06-24T00:00:00.000Z").toISOString()
  },
  {
    id: "sm-editor-berserk",
    seriesId: "s-berserk-prod",
    userId: "u-editor",
    role: "editor",
    scope: "full_series",
    status: "active",
    assignedChapterIds: [],
    assignedTaskIds: [],
    createdAt: new Date("2026-06-24T00:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-06-24T00:00:00.000Z").toISOString()
  },
  {
    id: "sm-editor-vinland",
    seriesId: "s-vinland-prod",
    userId: "u-editor",
    role: "editor",
    scope: "full_series",
    status: "active",
    assignedChapterIds: [],
    assignedTaskIds: [],
    createdAt: new Date("2026-06-24T00:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-06-24T00:00:00.000Z").toISOString()
  }
];

export async function usersWithHashes() {
  return Promise.all(
    seedUsers.map(async ({ password, ...user }) => ({
      ...user,
      email: user.email.toLowerCase(),
      active: true,
      passwordHash: await bcrypt.hash(password, 10)
    }))
  );
}
