import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import type { AuthVerifier } from "../auth/auth.middleware.js";
import type { AuthUser, SystemRole, UserRepository } from "../auth/auth.service.js";
import type { Series, SeriesRepository } from "../series/series.service.js";
import type { Manuscript } from "./manuscript.service.js";
import type { ManuscriptRepository } from "./manuscript.repository.js";
import type { Chapter } from "../chapter/chapter.service.js";
import type { ChapterRepository } from "../chapter/chapter.repository.js";
import type { Page } from "../page/page.service.js";
import type { PageRepository } from "../page/page.repository.js";
import type { CommentRepository } from "../comment/comment.repository.js";
import type { Comment } from "../comment/comment.service.js";

const now = "2026-06-03T00:00:00.000Z";
const seriesId = "507f1f77bcf86cd799439a21";
const ownerId = "507f1f77bcf86cd799439a22";
const editorId = "507f1f77bcf86cd799439a23";
const assistantId = "507f1f77bcf86cd799439a24";
const adminId = "507f1f77bcf86cd799439a25";

function createAuthUser(clerkId: string, id: string, systemRole: SystemRole): AuthUser {
  return {
    id,
    clerkId,
    email: `${clerkId}@example.com`,
    fullName: clerkId,
    avatarUrl: null,
    systemRole,
    requestedSystemRole: null,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now
  };
}

const mangaka = createAuthUser("clerk_mangaka", ownerId, "MANGAKA");
const editor = createAuthUser("clerk_editor", editorId, "EDITOR");
const assistant = createAuthUser("clerk_assistant", assistantId, "ASSISTANT");
const admin = createAuthUser("clerk_admin", adminId, "ADMIN");
const users = [mangaka, editor, assistant, admin];

function createVerifier(clerkId: string, systemRole: SystemRole | null = null): AuthVerifier {
  return {
    async verify() {
      return { clerkId, systemRole, status: "ACTIVE" as const };
    },
    async verifyWithProfile() {
      return { clerkId, email: `${clerkId}@example.com`, fullName: clerkId, avatarUrl: null };
    }
  };
}

function createUserRepository(): UserRepository {
  const byClerkId = new Map(users.map((user) => [user.clerkId, user]));
  return {
    async findByClerkId(clerkId) {
      return byClerkId.get(clerkId) ?? null;
    },
    async upsertFromProfile() {
      throw new Error("not needed");
    },
    async updateOnboarding() {
      throw new Error("not needed");
    }
  };
}

function createSeriesRepository(roleByUserId: Record<string, string | null>): SeriesRepository {
  const series: Series = {
    id: seriesId,
    title: "Approval Series",
    slug: "approval-series",
    description: "Series for approval testing",
    genre: [],
    coverUrl: null,
    ownerId,
    status: "DRAFT",
    publicationType: "WEEKLY",
    createdAt: now,
    updatedAt: now
  };
  return {
    async createSeries() {
      return series;
    },
    async findSeriesById() {
      return series;
    },
    async findSeriesBySlug() {
      return series;
    },
    async listSeriesForUser() {
      return [series];
    },
    async updateSeries() {
      return series;
    },
    async deleteSeries() {
      return false;
    },
    async getSeriesMemberRole(inputSeriesId, userId) {
      if (inputSeriesId !== seriesId) return null;
      return roleByUserId[userId] ?? null;
    }
  };
}

function createManuscript(overrides: Partial<Manuscript> = {}): Manuscript {
  return {
    id: overrides.id ?? "manuscript_1",
    seriesId: seriesId,
    uploadedBy: ownerId,
    title: "Test Manuscript",
    fileUrls: ["http://localhost/file.pdf"],
    currentVersion: 1,
    status: overrides.status ?? "EDITOR_REVIEW",
    createdAt: now,
    updatedAt: now
  };
}

function createManuscriptRepository(seed: Manuscript[] = []) {
  const manuscripts = new Map(seed.map((m) => [m.id, m]));
  const repository: ManuscriptRepository = {
    async createManuscript() {
      throw new Error("not needed");
    },
    async findManuscriptsBySeries() {
      return [...manuscripts.values()];
    },
    async findById(id: string) {
      return manuscripts.get(id) ?? null;
    },
    async updateStatus(id: string, status: any) {
      const m = manuscripts.get(id);
      if (!m) return null;
      const updated = { ...m, status, updatedAt: now };
      manuscripts.set(id, updated);
      return updated;
    }
  };
  return { repository, manuscripts };
}

function createChapter(overrides: Partial<Chapter> = {}): Chapter {
  return {
    id: overrides.id ?? "chapter_1",
    seriesId: seriesId,
    title: "Chapter One",
    chapterNumber: 1,
    status: overrides.status ?? "EDITOR_REVIEW",
    createdAt: now,
    updatedAt: now
  };
}

function createChapterRepository(seed: Chapter[] = []) {
  const chapters = new Map(seed.map((c) => [c.id, c]));
  const repository: ChapterRepository = {
    async createChapter() {
      throw new Error("not needed");
    },
    async findChaptersBySeries() {
      return [...chapters.values()];
    },
    async findById(id: string) {
      return chapters.get(id) ?? null;
    },
    async updateChapter(id: string, data: any) {
      const c = chapters.get(id);
      if (!c) return null;
      const updated = { ...c, ...data, updatedAt: now };
      chapters.set(id, updated as any);
      return updated as any;
    },
    async deleteChapter() {
      return false;
    }
  };
  return { repository, chapters };
}

function createPage(overrides: Partial<Page> = {}): Page {
  return {
    id: overrides.id ?? "page_1",
    chapterId: overrides.chapterId ?? "chapter_1",
    pageNumber: 1,
    originalFileUrl: "http://localhost/page.jpg",
    width: 1200,
    height: 1600,
    currentVersion: 1,
    status: overrides.status ?? "MANGAKA_APPROVED",
    createdAt: now,
    updatedAt: now
  };
}

function createPageRepository(seed: Page[] = []) {
  const pages = new Map(seed.map((p) => [p.id, p]));
  const repository: PageRepository = {
    async createPage() {
      throw new Error("not needed");
    },
    async findPagesByChapter(chapterId: string) {
      return [...pages.values()].filter((p) => p.chapterId === chapterId);
    },
    async findById(id: string) {
      return pages.get(id) ?? null;
    },
    async updatePage(id: string, data: any) {
      const p = pages.get(id);
      if (!p) return null;
      const updated = { ...p, ...data, updatedAt: now };
      pages.set(id, updated as any);
      return updated as any;
    },
    async deletePage() {
      return false;
    }
  };
  return { repository, pages };
}

function createCommentRepository(seedComments: Comment[] = []): CommentRepository {
  const comments = new Map(seedComments.map((c) => [c.id, c]));
  return {
    async createComment() {
      throw new Error("not needed");
    },
    async findById(id: string) {
      return comments.get(id) ?? null;
    },
    async findByTarget() {
      return [];
    },
    async updateComment() {
      throw new Error("not needed");
    },
    async deleteComment() {
      throw new Error("not needed");
    },
    async hasUnresolvedCommentsForPages(pageIds: string[]) {
      return [...comments.values()].some(
        (c) =>
          ((c.pageId && pageIds.includes(c.pageId)) ||
            (c.targetType === "PAGE" && pageIds.includes(c.targetId))) &&
          c.status !== "RESOLVED_BY_EDITOR"
      );
    }
  } as unknown as CommentRepository;
}

describe("Editor Approval API Integration Tests", () => {
  const testManuscript = createManuscript({ id: "m1", status: "EDITOR_REVIEW" });
  const testChapter = createChapter({ id: "c1", status: "EDITOR_REVIEW" });
  const testPage = createPage({ id: "p1", chapterId: "c1", status: "MANGAKA_APPROVED" });

  const roleByUserId = {
    [ownerId]: "OWNER_MANGAKA",
    [editorId]: "EDITOR",
    [assistantId]: "ASSISTANT",
    [adminId]: "ADMIN"
  };

  function verifierFor(clerkId: string) {
    const user = users.find(u => u.clerkId === clerkId);
    return createVerifier(clerkId, user?.systemRole ?? null);
  }

  const sharedDeps = {
    userRepository: createUserRepository(),
    seriesRepository: createSeriesRepository(roleByUserId)
  };

  describe("Manuscript Approval & Revision", () => {
    it("allows Admin to approve and request revision", async () => {
      const manuscriptRepo = createManuscriptRepository([testManuscript]);
      const app = createApp({
        authVerifier: verifierFor(admin.clerkId),
        manuscriptRepository: manuscriptRepo.repository,
        ...sharedDeps
      });

      // Approve
      const approveRes = await request(app)
        .post("/api/manuscripts/m1/approve")
        .set("Authorization", "Bearer valid");
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe("APPROVED");

      // Reset to EDITOR_REVIEW to test revision request
      manuscriptRepo.manuscripts.set("m1", createManuscript({ id: "m1", status: "EDITOR_REVIEW" }));

      // Request Revision
      const revisionRes = await request(app)
        .post("/api/manuscripts/m1/request-revision")
        .set("Authorization", "Bearer valid");
      expect(revisionRes.status).toBe(200);
      expect(revisionRes.body.data.status).toBe("REVISION_REQUESTED");
    });

    it("allows Series Editor to approve", async () => {
      const manuscriptRepo = createManuscriptRepository([testManuscript]);
      const app = createApp({
        authVerifier: verifierFor(editor.clerkId),
        manuscriptRepository: manuscriptRepo.repository,
        ...sharedDeps
      });

      const approveRes = await request(app)
        .post("/api/manuscripts/m1/approve")
        .set("Authorization", "Bearer valid");
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe("APPROVED");
    });

    it("rejects non-editors and non-admins with 403", async () => {
      const manuscriptRepo = createManuscriptRepository([testManuscript]);
      const app = createApp({
        authVerifier: verifierFor(mangaka.clerkId),
        manuscriptRepository: manuscriptRepo.repository,
        ...sharedDeps
      });

      const approveRes = await request(app)
        .post("/api/manuscripts/m1/approve")
        .set("Authorization", "Bearer valid");
      expect(approveRes.status).toBe(403);
    });
  });

  describe("Page Approval & Revision", () => {
    it("allows Editor to approve and request revision when no unresolved comments exist", async () => {
      const pageRepo = createPageRepository([testPage]);
      const commentRepo = createCommentRepository([]);
      const app = createApp({
        authVerifier: verifierFor(editor.clerkId),
        pageRepository: pageRepo.repository,
        commentRepository: commentRepo,
        chapterRepository: createChapterRepository([testChapter]).repository,
        ...sharedDeps
      });

      // Approve
      const approveRes = await request(app)
        .post("/api/pages/p1/editor-approve")
        .set("Authorization", "Bearer valid");
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe("EDITOR_APPROVED");

      // Reset Page
      pageRepo.pages.set("p1", createPage({ id: "p1", chapterId: "c1", status: "MANGAKA_APPROVED" }));

      // Request Revision
      const revisionRes = await request(app)
        .post("/api/pages/p1/request-revision")
        .set("Authorization", "Bearer valid");
      expect(revisionRes.status).toBe(200);
      expect(revisionRes.body.data.status).toBe("NEEDS_REVISION");
    });

    it("blocks approval with 400 Bad Request if page has unresolved comments", async () => {
      const pageRepo = createPageRepository([testPage]);
      const unresolvedComment: Comment = {
        id: "comm1",
        targetType: "PAGE",
        targetId: "p1",
        content: "Fix this error",
        createdBy: ownerId,
        status: "OPEN",
        createdAt: now,
        updatedAt: now
      };
      const commentRepo = createCommentRepository([unresolvedComment]);
      const app = createApp({
        authVerifier: verifierFor(editor.clerkId),
        pageRepository: pageRepo.repository,
        commentRepository: commentRepo,
        chapterRepository: createChapterRepository([testChapter]).repository,
        ...sharedDeps
      });

      const approveRes = await request(app)
        .post("/api/pages/p1/editor-approve")
        .set("Authorization", "Bearer valid");
      expect(approveRes.status).toBe(400);
      expect(approveRes.body.message).toContain("unresolved comments");
    });
  });

  describe("Chapter Approval & Revision", () => {
    it("allows Editor to approve and request revision when pages have no unresolved comments", async () => {
      const chapterRepo = createChapterRepository([testChapter]);
      const pageRepo = createPageRepository([testPage]);
      const commentRepo = createCommentRepository([]);
      const app = createApp({
        authVerifier: verifierFor(editor.clerkId),
        chapterRepository: chapterRepo.repository,
        pageRepository: pageRepo.repository,
        commentRepository: commentRepo,
        ...sharedDeps
      });

      // Approve
      const approveRes = await request(app)
        .post("/api/chapters/c1/approve")
        .set("Authorization", "Bearer valid");
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe("READY_FOR_PUBLICATION");

      // Reset Chapter
      chapterRepo.chapters.set("c1", createChapter({ id: "c1", status: "EDITOR_REVIEW" }));

      // Request Revision
      const revisionRes = await request(app)
        .post("/api/chapters/c1/request-revision")
        .set("Authorization", "Bearer valid");
      expect(revisionRes.status).toBe(200);
      expect(revisionRes.body.data.status).toBe("IN_PROGRESS");
    });

    it("blocks approval with 400 Bad Request if any page in chapter has unresolved comments", async () => {
      const chapterRepo = createChapterRepository([testChapter]);
      const pageRepo = createPageRepository([testPage]);
      const unresolvedComment: Comment = {
        id: "comm1",
        targetType: "PAGE",
        targetId: "p1",
        content: "Redraw this",
        createdBy: ownerId,
        status: "OPEN",
        createdAt: now,
        updatedAt: now
      };
      const commentRepo = createCommentRepository([unresolvedComment]);
      const app = createApp({
        authVerifier: verifierFor(editor.clerkId),
        chapterRepository: chapterRepo.repository,
        pageRepository: pageRepo.repository,
        commentRepository: commentRepo,
        ...sharedDeps
      });

      const approveRes = await request(app)
        .post("/api/chapters/c1/approve")
        .set("Authorization", "Bearer valid");
      expect(approveRes.status).toBe(400);
      expect(approveRes.body.message).toContain("unresolved comments");
    });
  });
});

