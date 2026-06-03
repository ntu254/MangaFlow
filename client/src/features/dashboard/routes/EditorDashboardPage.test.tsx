import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import * as React from "react";
import { EditorDashboardPage } from "./EditorDashboardPage";
import type { Series } from "@/features/series/api/series";
import type { Manuscript } from "@/features/manuscript/api/manuscript";
import type { Chapter } from "@/features/chapter/api/chapter";

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

// Mock APIs
vi.mock("@/features/series/api/series", () => ({
  fetchSeriesList: vi.fn()
}));
vi.mock("@/features/manuscript/api/manuscript", () => ({
  listManuscripts: vi.fn()
}));
vi.mock("@/features/chapter/api/chapter", () => ({
  listChapters: vi.fn(),
  getChapter: vi.fn(),
  approveChapter: vi.fn(),
  requestChapterRevision: vi.fn()
}));

const mockSeriesList: Series[] = [
  {
    id: "s1",
    title: "Test Series 1",
    slug: "test-series-1",
    description: "Description 1",
    status: "ONGOING",
    genre: ["ACTION", "COMEDY"],
    coverUrl: "http://cover1.jpg",
    ownerId: "user1",
    publicationType: "MANGA",
    createdAt: "2026-06-03T00:00:00Z",
    updatedAt: "2026-06-03T00:00:00Z"
  }
];

const mockManuscripts = [
  {
    id: "m1",
    seriesId: "s1",
    title: "Test Manuscript 1",
    currentVersion: 1,
    status: "SUBMITTED",
    seriesTitle: "Test Series 1",
    createdBy: "user1",
    createdAt: "2026-06-03T00:00:00Z",
    updatedAt: "2026-06-03T00:00:00Z"
  }
] as unknown as (Manuscript & { seriesTitle: string })[];

const mockChapters = [
  {
    id: "ch1",
    seriesId: "s1",
    chapterNumber: 1,
    title: "Test Chapter 1",
    status: "READY_FOR_EDITOR",
    seriesTitle: "Test Series 1",
    deadline: "2026-06-10T00:00:00Z",
    createdBy: "user1",
    createdAt: "2026-06-03T00:00:00Z",
    updatedAt: "2026-06-03T00:00:00Z"
  }
] as unknown as (Chapter & { seriesTitle: string })[];

describe("EditorDashboardPage", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      location: {
        pathname: "/app/editor/dashboard"
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
        <EditorDashboardPage />
      </MemoryRouter>
    );
    expect(html).toContain("Loading Editor Dashboard...");
  });

  it("renders series, manuscripts, and chapters when loaded", () => {
    mockStates = [
      mockSeriesList,   // seriesList
      mockManuscripts,  // manuscripts
      mockChapters,     // chapters
      false,            // isLoading
      null              // error
    ];
    mockStateIndex = 0;

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/app/editor/dashboard"]}>
        <EditorDashboardPage />
      </MemoryRouter>
    );

    expect(html).toContain("Test Series 1");
    expect(html).toContain("Test Manuscript 1");
    expect(html).toContain("Ch. 1: Test Chapter 1");
    expect(html).toContain("READY_FOR_EDITOR");
    expect(html).toContain("SUBMITTED");
  });
});
