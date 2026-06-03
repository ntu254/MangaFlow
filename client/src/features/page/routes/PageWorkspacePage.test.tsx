import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import * as React from "react";
import { PageWorkspacePage } from "./PageWorkspacePage";
import { ToastProvider } from "@/shared/components/feedback/Toast";
import type { Page } from "@/features/page/api/page";
import type { Region } from "@/features/region/api/region";
import type { Annotation } from "@/features/annotation/api/annotation";
import type { Task } from "@/features/task/api/task";

// Global mock state variables
let mockStateMap: Record<number, any> = {};
let mockStateIndex = 0;

// Mock React useState
vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    useState: (initial: any) => {
      const idx = mockStateIndex++;
      if (idx in mockStateMap) {
        return [mockStateMap[idx], vi.fn()];
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

// Mock React Router Params
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom") as any;
  return {
    ...actual,
    useParams: () => ({ pageId: "p1" })
  };
});

// Mock APIs
vi.mock("@/features/page/api/page", () => ({
  getPage: vi.fn(),
  editorApprovePage: vi.fn(),
  requestPageRevision: vi.fn()
}));
vi.mock("@/features/annotation/api/annotation", () => ({
  createAnnotation: vi.fn(),
  deleteAnnotation: vi.fn(),
  listAnnotations: vi.fn(),
  updateAnnotation: vi.fn()
}));
vi.mock("@/features/region/api/region", () => ({
  createRegion: vi.fn(),
  deleteRegion: vi.fn(),
  listRegions: vi.fn(),
  regionTypes: ["BUBBLE", "PANEL", "ILLUSTRATION"]
}));
vi.mock("@/features/task/api/task", () => ({
  createTaskFromRegion: vi.fn(),
  deleteTask: vi.fn(),
  listTasks: vi.fn(),
  taskPriorities: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
  taskTypes: ["INK", "COLOR", "TONE", "LETTER", "CLEANUP", "OTHER"]
}));
vi.mock("@/features/comment/components/CommentPanel", () => ({
  CommentPanel: () => <div data-testid="comment-panel">Comment Panel</div>
}));

const mockPage: Page = {
  id: "p1",
  chapterId: "ch1",
  pageNumber: 1,
  originalFileUrl: "http://example.com/p1.jpg",
  width: 800,
  height: 1200,
  currentVersion: 1,
  status: "SUBMITTED",
  createdAt: "2026-06-03T00:00:00Z",
  updatedAt: "2026-06-03T00:00:00Z"
};

const mockRegions: Region[] = [
  {
    id: "r1",
    pageId: "p1",
    type: "BUBBLE",
    source: "MANUAL",
    shape: "RECTANGLE",
    x: 10,
    y: 10,
    width: 100,
    height: 100,
    createdBy: "user1",
    createdAt: "2026-06-03T00:00:00Z",
    updatedAt: "2026-06-03T00:00:00Z"
  }
] as unknown as Region[];

const mockAnnotations: Annotation[] = [];

const mockTasks: Task[] = [
  {
    id: "t1",
    seriesId: "s1",
    chapterId: "ch1",
    pageId: "p1",
    regionId: "r1",
    title: "Test Task 1",
    description: "Description 1",
    status: "TODO",
    type: "OTHER",
    priority: "MEDIUM",
    assignedBy: "mangaka1",
    assignedTo: "assistant1",
    revisionRound: 1,
    baseRate: 10,
    bonusAmount: 5,
    dueDate: "2026-06-10T00:00:00Z",
    createdAt: "2026-06-03T00:00:00Z",
    updatedAt: "2026-06-03T00:00:00Z"
  }
] as unknown as Task[];

describe("PageWorkspacePage", () => {
  beforeEach(() => {
    vi.stubGlobal("confirm", () => true);
    vi.stubGlobal("alert", () => {});
    mockStateMap = {};
    mockStateIndex = 0;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders loading state initially", () => {
    vi.stubGlobal("window", {
      location: {
        pathname: "/app/editor/pages/p1/workspace"
      }
    });

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ToastProvider>
          <PageWorkspacePage />
        </ToastProvider>
      </MemoryRouter>
    );
    expect(html).toContain("Loading page workspace");
  });

  it("renders Editor layout, displaying page approval controls and hiding editing tools & forms", () => {
    vi.stubGlobal("window", {
      location: {
        pathname: "/app/editor/pages/p1/workspace"
      }
    });

    mockStateMap = {
      1: { status: "ready", page: mockPage, regions: mockRegions, annotations: mockAnnotations, tasks: mockTasks },
      22: { id: "user1", systemRole: "EDITOR" }
    };
    mockStateIndex = 0;

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/app/editor/pages/p1/workspace"]}>
        <ToastProvider>
          <PageWorkspacePage />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(html).toContain("Approve Page");
    expect(html).toContain("Request Revision");
    expect(html).not.toContain("Workspace tool"); // tool Mode selection
    expect(html).not.toContain("Assign task"); // task form button
    expect(html).not.toContain("Delete"); // delete button for tasks or regions
  });

  it("renders Mangaka layout, rendering editing tools, task forms, delete buttons, and hiding page approval controls", () => {
    vi.stubGlobal("window", {
      location: {
        pathname: "/app/mangaka/pages/p1/workspace"
      }
    });

    mockStateMap = {
      1: { status: "ready", page: mockPage, regions: mockRegions, annotations: mockAnnotations, tasks: mockTasks },
      22: { id: "user1", systemRole: "MANGAKA" }
    };
    mockStateIndex = 0;

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/app/mangaka/pages/p1/workspace"]}>
        <ToastProvider>
          <PageWorkspacePage />
        </ToastProvider>
      </MemoryRouter>
    );

    expect(html).not.toContain("Approve Page");
    expect(html).not.toContain("Request Revision");
    expect(html).toContain("Workspace tool");
    expect(html).toContain("Assign task");
    expect(html).toContain("Delete"); // delete button for tasks or regions is rendered
  });
});
