import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import * as React from "react";
import { BoardSeriesReviewPage } from "./BoardSeriesReviewPage";
import type { Series } from "@/features/series/api/series";
import type { Manuscript } from "@/features/manuscript/api/manuscript";
import type { BoardMember, BoardVote, VoteSummary } from "../api/board";

// Global mock state variables
let mockStates: any[] = [];
let mockStateIndex = 0;

// Mock React useState
vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    useState: (initial: any) => {
      if (mockStates.length > mockStateIndex) {
        const val = mockStates[mockStateIndex++];
        return [val, vi.fn()];
      }
      return original.useState(initial);
    }
  };
});

// Mock Clerk
vi.mock("@/shared/hooks/useAuth", () => ({
  useAuth: () => ({
    getToken: () => Promise.resolve("mock-token")
  })
}));

// Mock API
vi.mock("../api/board", () => ({
  fetchBoardMembers: vi.fn(),
  fetchBoardVotesForSeries: vi.fn(),
  fetchBoardVoteSummary: vi.fn(),
  submitBoardVote: vi.fn(),
  finalizeBoardDecision: vi.fn(),
  tieBreakBoardDecision: vi.fn()
}));

vi.mock("@/features/series/api/series", () => ({
  fetchSeriesById: vi.fn()
}));

vi.mock("@/features/manuscript/api/manuscript", () => ({
  listManuscripts: vi.fn()
}));

const mockSeries: Series = {
  id: "s1",
  title: "Board Review Manga",
  slug: "board-review-manga",
  description: "Proposal description for the board.",
  status: "BOARD_REVIEW",
  genre: ["DRAMA"],
  coverUrl: null,
  ownerId: "u_mangaka",
  publicationType: "WEEKLY",
  createdAt: "2026-06-03T00:00:00Z",
  updatedAt: "2026-06-03T00:00:00Z"
};

const mockManuscripts: Manuscript[] = [
  {
    id: "m1",
    seriesId: "s1",
    uploadedBy: "u_mangaka",
    title: "Manga v1 Proposal",
    description: "Initial chapters submitted to board.",
    fileUrls: ["http://localhost:5000/uploads/p1.jpg"],
    currentVersion: 1,
    status: "BOARD_REVIEW",
    createdAt: "2026-06-03T00:00:00Z",
    updatedAt: "2026-06-03T00:00:00Z"
  }
];

const mockMembers: BoardMember[] = [
  {
    id: "bm_chair",
    userId: "u_chair",
    role: "BOARD_CHAIR",
    status: "ACTIVE",
    createdAt: "2026-06-03T00:00:00Z",
    updatedAt: "2026-06-03T00:00:00Z"
  },
  {
    id: "bm_member",
    userId: "u_member",
    role: "BOARD_MEMBER",
    status: "ACTIVE",
    createdAt: "2026-06-03T00:00:00Z",
    updatedAt: "2026-06-03T00:00:00Z"
  }
];

describe("BoardSeriesReviewPage", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      location: {
        pathname: "/app/board/series/s1/review"
      }
    });
    mockStates = [];
    mockStateIndex = 0;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders loading state initially", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <BoardSeriesReviewPage />
      </MemoryRouter>
    );
    expect(html).toContain("Loading Review Workspace...");
  });

  it("renders series details, manuscript information, and vote summary", () => {
    mockStates = [
      mockSeries,        // series
      mockManuscripts,   // manuscripts
      mockMembers,       // boardMembers
      [],                // votes
      { approve: 0, reject: 0, needsRevision: 0, totalVotes: 0 }, // voteSummary
      { id: "u_member", systemRole: "BOARD", fullName: "Member User" }, // currentUser
      false,             // isLoading
      null,              // error
      "",                // selectedVote
      "",                // reason
      false,             // submittingVote
      false,             // finalizing
      "",                // tieBreakDecision
      "",                // tieBreakReason
      false              // submittingTieBreak
    ];
    mockStateIndex = 0;

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/app/board/series/s1/review"]}>
        <BoardSeriesReviewPage />
      </MemoryRouter>
    );

    expect(html).toContain("Board Review Manga");
    expect(html).toContain("Proposal description for the board.");
    expect(html).toContain("Manga v1 Proposal");
    expect(html).toContain("Submitted Manuscript");
    expect(html).toContain("Vote Summary");
    expect(html).toContain("Cast Your Vote");
    expect(html).toContain("Your Recommendation");
  });

  it("renders tie-break panel exclusively for Board Chair on tied votes", () => {
    const vote1: BoardVote = { id: "v1", seriesId: "s1", boardMemberId: "bm_chair", vote: "APPROVE", createdAt: "2026-06-03T00:00:00Z", updatedAt: "2026-06-03T00:00:00Z" };
    const vote2: BoardVote = { id: "v2", seriesId: "s1", boardMemberId: "bm_member", vote: "REJECT", createdAt: "2026-06-03T00:00:00Z", updatedAt: "2026-06-03T00:00:00Z" };

    mockStates = [
      mockSeries,        // series
      mockManuscripts,   // manuscripts
      mockMembers,       // boardMembers
      [vote1, vote2],    // votes
      { approve: 1, reject: 1, needsRevision: 0, totalVotes: 2 }, // voteSummary
      { id: "u_chair", systemRole: "BOARD", fullName: "Chair User" }, // currentUser
      false,             // isLoading
      null,              // error
      "",                // selectedVote
      "",                // reason
      false,             // submittingVote
      false,             // finalizing
      "",                // tieBreakDecision
      "",                // tieBreakReason
      false              // submittingTieBreak
    ];
    mockStateIndex = 0;

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/app/board/series/s1/review"]}>
        <BoardSeriesReviewPage />
      </MemoryRouter>
    );

    expect(html).toContain("Resolution Control");
    expect(html).toContain("Tie-break required!");
    expect(html).toContain("Votes are currently tied. As the Board Chair, you must cast the tie-breaking decision.");
    expect(html).toContain("Submit Tie-Break Decision");
  });
});
