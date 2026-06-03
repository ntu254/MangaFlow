import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import * as React from "react";
import { ChapterPagesPage } from "./ChapterPagesPage";
import { ToastProvider } from "@/shared/components/feedback/Toast";
import type { Chapter } from "@/features/chapter/api/chapter";
import type { Page } from "../api/page";

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

// Mock APIs
vi.mock("@/features/chapter/api/chapter", () => ({
  getChapter: vi.fn(),
  approveChapter: vi.fn(),
  requestChapterRevision: vi.fn()
}));
vi.mock("../api/page", () => ({
  listPages: vi.fn(),
  createPage: vi.fn(),
  deletePage: vi.fn()
}));

const mockChapter: Chapter = {
  id: "ch1",
  seriesId: "s1",
  chapterNumber: 1,
  title: "Test Chapter 1",
  status: "READY_FOR_EDITOR",
  createdAt: "2026-06-03T00:00:00Z",
  updatedAt: "2026-06-03T00:00:00Z"
} as unknown as Chapter;

const mockPages: Page[] = [
  {
    id: "p1",
    chapterId: "ch1",
    pageNumber: 1,
    originalFileUrl: "http://example.com/p1.jpg",
    width: 800,
    height: 1200,
    currentVersion: 1,
    status: "UPLOADED",
    createdAt: "2026-06-03T00:00:00Z",
    updatedAt: "2026-06-03T00:00:00Z"
  }
];

describe("ChapterPagesPage", () => {
  beforeEach(() => {
    vi.stubGlobal("confirm", () => true);
    vi.stubGlobal("alert", () => {});
    mockStates = [];
    mockStateIndex = 0;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders loading state initially", () => {
    vi.stubGlobal("window", {
      location: {
        pathname: "/app/editor/chapters/ch1/pages"
      }
    });

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ToastProvider>
          <ChapterPagesPage />
        </ToastProvider>
      </MemoryRouter>
    );
    expect(html).toContain("animate-pulse");
  });

  it("renders Editor layout with approval controls and hides add/delete buttons", () => {
    vi.stubGlobal("window", {
      location: {
        pathname: "/app/editor/chapters/ch1/pages"
      }
    });

    mockStates = [
      mockChapter, // chapter
      mockPages,   // pages
      false,       // isLoading = false
      null         // error = null
    ];
    mockStateIndex = 0;

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/app/editor/chapters/ch1/pages"]}>
        <ToastProvider>
          <ChapterPagesPage />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(html).toContain("Approve Chapter");
    expect(html).toContain("Request Revision");
    expect(html).not.toContain("Add Pages");
    expect(html).not.toContain("Trash"); // delete page button
  });

  it("renders Mangaka layout with upload controls and hides approval buttons", () => {
    vi.stubGlobal("window", {
      location: {
        pathname: "/app/mangaka/chapters/ch1/pages"
      }
    });

    mockStates = [
      mockChapter, // chapter
      mockPages,   // pages
      false,       // isLoading = false
      null         // error = null
    ];
    mockStateIndex = 0;

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/app/mangaka/chapters/ch1/pages"]}>
        <ToastProvider>
          <ChapterPagesPage />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(html).not.toContain("Approve Chapter");
    expect(html).not.toContain("Request Revision");
    expect(html).toContain("Add Pages");
  });
});
