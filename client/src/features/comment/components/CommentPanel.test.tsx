import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CommentList } from "./CommentList";
import { CommentItem } from "./CommentItem";
import { ToastProvider } from "@/shared/components/feedback/Toast";
import type { Comment } from "../api/comment";

const mockComments: Comment[] = [
  {
    id: "c1",
    targetType: "PAGE",
    targetId: "p1",
    content: "Dialogue bubble is pixelated",
    createdBy: "user1",
    status: "OPEN",
    createdAt: "2026-06-03T00:00:00.000Z",
    updatedAt: "2026-06-03T00:00:00.000Z"
  },
  {
    id: "c2",
    targetType: "PAGE",
    targetId: "p1",
    content: "Background screentone is missing",
    createdBy: "user2",
    status: "FIXED_BY_ASSISTANT",
    fixedBy: "user3",
    fixedAt: "2026-06-03T01:00:00.000Z",
    createdAt: "2026-06-03T00:30:00.000Z",
    updatedAt: "2026-06-03T01:00:00.000Z"
  },
  {
    id: "c3",
    targetType: "PAGE",
    targetId: "p1",
    content: "Typo in title bubble",
    createdBy: "user2",
    status: "RESOLVED_BY_EDITOR",
    resolvedBy: "user4",
    resolvedAt: "2026-06-03T02:00:00.000Z",
    createdAt: "2026-06-03T00:30:00.000Z",
    updatedAt: "2026-06-03T02:00:00.000Z"
  }
];

const mockHandlers = {
  onMarkFixed: vi.fn(),
  onVerifyFixed: vi.fn(),
  onResolve: vi.fn(),
  onReopen: vi.fn()
};

describe("Comment Components (List & Item)", () => {
  it("renders empty state when no comments exist", () => {
    const html = renderToStaticMarkup(
      <CommentList
        comments={[]}
        currentUser={{ id: "user1", systemRole: "MANGAKA" }}
        {...mockHandlers}
      />
    );
    expect(html).toContain("No comments yet.");
  });

  it("renders comment content, author, dates, and status badges", () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <CommentList
          comments={mockComments}
          currentUser={{ id: "currentUser", systemRole: "MANGAKA" }}
          {...mockHandlers}
        />
      </ToastProvider>
    );

    // Content
    expect(html).toContain("Dialogue bubble is pixelated");
    expect(html).toContain("Background screentone is missing");
    
    // Authors
    expect(html).toContain("User (user1)");
    expect(html).toContain("User (user2)");
    
    // Status Badges
    expect(html).toContain("Open");
    expect(html).toContain("Fixed (Assistant)");
  });

  it("renders action log history correctly", () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <CommentList
          comments={mockComments}
          currentUser={{ id: "currentUser", systemRole: "MANGAKA" }}
          {...mockHandlers}
        />
      </ToastProvider>
    );

    // Fixed log
    expect(html).toContain("Marked fixed by User (user3)");
    // Resolved log
    expect(html).toContain("Resolved by User (user4)");
  });

  describe("Role-based Action Button Rendering", () => {
    it("renders Mark Fixed button only for Assistant or Admin when status is OPEN", () => {
      // Assistant role
      const assistantHtml = renderToStaticMarkup(
        <ToastProvider>
          <CommentItem
            comment={mockComments[0]} // OPEN
            currentUser={{ id: "user3", systemRole: "ASSISTANT" }}
            {...mockHandlers}
          />
        </ToastProvider>
      );
      expect(assistantHtml).toContain("Mark Fixed");

      // Admin role
      const adminHtml = renderToStaticMarkup(
        <ToastProvider>
          <CommentItem
            comment={mockComments[0]} // OPEN
            currentUser={{ id: "user4", systemRole: "ADMIN" }}
            {...mockHandlers}
          />
        </ToastProvider>
      );
      expect(adminHtml).toContain("Mark Fixed");

      // Mangaka role (should NOT see Mark Fixed)
      const mangakaHtml = renderToStaticMarkup(
        <ToastProvider>
          <CommentItem
            comment={mockComments[0]} // OPEN
            currentUser={{ id: "user1", systemRole: "MANGAKA" }}
            {...mockHandlers}
          />
        </ToastProvider>
      );
      expect(mangakaHtml).not.toContain("Mark Fixed");
    });

    it("renders Verify Fixed button only for Mangaka or Admin when status is FIXED_BY_ASSISTANT", () => {
      // Mangaka role
      const mangakaHtml = renderToStaticMarkup(
        <ToastProvider>
          <CommentItem
            comment={mockComments[1]} // FIXED_BY_ASSISTANT
            currentUser={{ id: "user1", systemRole: "MANGAKA" }}
            {...mockHandlers}
          />
        </ToastProvider>
      );
      expect(mangakaHtml).toContain("Verify Fixed");

      // Admin role
      const adminHtml = renderToStaticMarkup(
        <ToastProvider>
          <CommentItem
            comment={mockComments[1]} // FIXED_BY_ASSISTANT
            currentUser={{ id: "user4", systemRole: "ADMIN" }}
            {...mockHandlers}
          />
        </ToastProvider>
      );
      expect(adminHtml).toContain("Verify Fixed");

      // Assistant role (should NOT see Verify Fixed)
      const assistantHtml = renderToStaticMarkup(
        <ToastProvider>
          <CommentItem
            comment={mockComments[1]} // FIXED_BY_ASSISTANT
            currentUser={{ id: "user3", systemRole: "ASSISTANT" }}
            {...mockHandlers}
          />
        </ToastProvider>
      );
      expect(assistantHtml).not.toContain("Verify Fixed");
    });

    it("renders Resolve and Reopen buttons only for Editor or Admin when status is appropriate", () => {
      // Editor role on resolved comment should see Reopen
      const editorReopenHtml = renderToStaticMarkup(
        <ToastProvider>
          <CommentItem
            comment={mockComments[2]} // RESOLVED_BY_EDITOR
            currentUser={{ id: "user4", systemRole: "EDITOR" }}
            {...mockHandlers}
          />
        </ToastProvider>
      );
      expect(editorReopenHtml).toContain("Reopen");
      // Check that the resolve button (with blue-600 background style) is not present
      expect(editorReopenHtml).not.toContain("bg-blue-600");

      // Editor role on open comment should see Resolve
      const editorResolveHtml = renderToStaticMarkup(
        <ToastProvider>
          <CommentItem
            comment={mockComments[0]} // OPEN
            currentUser={{ id: "user4", systemRole: "EDITOR" }}
            {...mockHandlers}
          />
        </ToastProvider>
      );
      expect(editorResolveHtml).toContain("bg-blue-600"); // Resolve button classes
      expect(editorResolveHtml).not.toContain("Reopen"); // Not resolved yet

      // Assistant role should NOT see Resolve or Reopen
      const assistantHtml = renderToStaticMarkup(
        <ToastProvider>
          <CommentItem
            comment={mockComments[0]} // OPEN
            currentUser={{ id: "user3", systemRole: "ASSISTANT" }}
            {...mockHandlers}
          />
        </ToastProvider>
      );
      expect(assistantHtml).not.toContain("bg-blue-600");
      expect(assistantHtml).not.toContain("Reopen");
    });
  });
});
