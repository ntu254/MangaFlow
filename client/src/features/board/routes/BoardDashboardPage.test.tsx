import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import * as React from "react";
import { BoardDashboardPage } from "./BoardDashboardPage";
import type { Series } from "@/features/series/api/series";
import type { BoardMember, VoteSummary } from "../api/board";

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
vi.mock("@clerk/react", () => ({
  useAuth: () => ({
    getToken: () => Promise.resolve("mock-token")
  })
}));

// Mock API
vi.mock("../api/board", () => ({
  fetchBoardMembers: vi.fn(() => Promise.resolve([])),
  fetchBoardVoteSummary: vi.fn(() => Promise.resolve({ approve: 0, reject: 0, needsRevision: 0, totalVotes: 0 }))
}));

vi.mock("@/features/series/api/series", () => ({
  fetchSeriesList: vi.fn(() => Promise.resolve([]))
}));

const mockSeries: (Series & { voteSummary: VoteSummary }) = {
  id: "s1",
  title: "Board Review Manga",
  slug: "board-review-manga",
  description: "Proposal for the board to review.",
  status: "BOARD_REVIEW",
  genre: ["DRAMA"],
  coverUrl: null,
  ownerId: "u_mangaka",
  publicationType: "WEEKLY",
  createdAt: "2026-06-03T00:00:00Z",
  updatedAt: "2026-06-03T00:00:00Z",
  voteSummary: {
    approve: 2,
    reject: 1,
    needsRevision: 0,
    totalVotes: 3
  }
};

const mockMembers: BoardMember[] = [
  {
    id: "bm1",
    userId: "u_chair",
    role: "BOARD_CHAIR",
    status: "ACTIVE",
    createdAt: "2026-06-03T00:00:00Z",
    updatedAt: "2026-06-03T00:00:00Z"
  },
  {
    id: "bm2",
    userId: "u_member",
    role: "BOARD_MEMBER",
    status: "ACTIVE",
    createdAt: "2026-06-03T00:00:00Z",
    updatedAt: "2026-06-03T00:00:00Z"
  }
];

const mockUser = {
  id: "u_member",
  fullName: "Board Member User",
  email: "bm@example.com",
  systemRole: "BOARD",
  status: "ACTIVE"
};

describe("BoardDashboardPage", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      location: {
        pathname: "/app/board/dashboard"
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
        <BoardDashboardPage />
      </MemoryRouter>
    );
    expect(html).toContain("Loading Board Dashboard...");
  });

  it("renders series under board review and board members panel", () => {
    mockStates = [
      [mockSeries],    // seriesList
      mockMembers,     // boardMembers
      mockUser,        // currentUser
      false,           // isLoading
      null             // error
    ];
    mockStateIndex = 0;

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/app/board/dashboard"]}>
        <BoardDashboardPage />
      </MemoryRouter>
    );

    expect(html).toContain("Board Review Manga");
    expect(html).toContain("Proposal for the board to review.");
    expect(html).toContain("Approve: 2");
    expect(html).toContain("Reject: 1");
    expect(html).toContain("Review &amp; Vote");
    expect(html).toContain("Board Members");
    expect(html).toContain("You");
    expect(html).toContain("Chair");
  });
});
