import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import type { AuthVerifier } from "../auth/auth.middleware.js";
import type { AuthUser, SystemRole, UserRepository } from "../auth/auth.service.js";
import type { Series, SeriesRepository } from "../series/series.service.js";
import type { ManuscriptRepository } from "../manuscript/manuscript.repository.js";
import type { ChapterRepository } from "../chapter/chapter.repository.js";
import type { PageRepository } from "../page/page.repository.js";
import type { TaskRepository } from "../task/task.repository.js";
import type { SubmissionRepository } from "../submission/submission.repository.js";
import type { CommentRepository } from "./comment.repository.js";
import { createCommentService, type Comment, type CreateCommentRecord, type UpdateCommentRecord } from "./comment.service.js";

const now = "2026-06-03T00:00:00.000Z";
const seriesId = "507f1f77bcf86cd799439391";
const chapterId = "507f1f77bcf86cd799439392";
const pageId = "507f1f77bcf86cd799439393";
const ownerId = "507f1f77bcf86cd799439394";
const editorId = "507f1f77bcf86cd799439395";
const assistantId = "507f1f77bcf86cd799439396";
const strangerId = "507f1f77bcf86cd799439397";
const adminId = "507f1f77bcf86cd799439398";
const strangerAssistantId = "507f1f77bcf86cd799439399";

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

const owner = createAuthUser("clerk_comment_owner", ownerId, "MANGAKA");
const editor = createAuthUser("clerk_comment_editor", editorId, "EDITOR");
const assistant = createAuthUser("clerk_comment_assistant", assistantId, "ASSISTANT");
const stranger = createAuthUser("clerk_comment_stranger", strangerId, "MANGAKA");
const admin = createAuthUser("clerk_comment_admin", adminId, "ADMIN");
const strangerAssistant = createAuthUser("clerk_comment_stranger_assistant", strangerAssistantId, "ASSISTANT");
const users = [owner, editor, assistant, stranger, admin, strangerAssistant];


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
  const byId = new Map(users.map((user) => [user.id, user]));
  return {
    async findByClerkId(clerkId) {
      return byClerkId.get(clerkId) ?? null;
    },
    async upsertFromProfile(profile) {
      const existing = byClerkId.get(profile.clerkId);
      if (existing) return existing;
      const created = createAuthUser(profile.clerkId, `user_${profile.clerkId}`, "MANGAKA");
      byClerkId.set(profile.clerkId, created);
      byId.set(created.id, created);
      return created;
    },
    async updateOnboarding() {
      throw new Error("not needed in comment route tests");
    },
    async findById(userId) {
      return byId.get(userId) ?? null;
    }
  };
}

function createSeriesRepository(roleByUserId: Record<string, string | null>): SeriesRepository {
  const series: Series = {
    id: seriesId,
    title: "Comment Series",
    slug: "comment-series",
    description: "Comment tests",
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
    async listSeriesForUser(userId) {
      return roleByUserId[userId] ? [series] : [];
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

function createManuscriptRepository() {
  return {
    async findById() {
      return { id: "manuscript_1", seriesId };
    }
  } as unknown as ManuscriptRepository;
}

function createChapterRepository() {
  return {
    async findById() {
      return { id: chapterId, seriesId };
    }
  } as unknown as ChapterRepository;
}

function createPageRepository() {
  return {
    async findById() {
      return { id: pageId, chapterId };
    }
  } as unknown as PageRepository;
}

function createTaskRepository() {
  return {
    async findById() {
      return { id: "task_1", seriesId, assignedTo: assistantId };
    }
  } as unknown as TaskRepository;
}

function createSubmissionRepository() {
  return {
    async findById() {
      return { id: "submission_1", taskId: "task_1" };
    }
  } as unknown as SubmissionRepository;
}

function createTestComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: overrides.id ?? "comment_1",
    targetType: overrides.targetType ?? "PAGE",
    targetId: overrides.targetId ?? pageId,
    pageId: overrides.pageId,
    annotationId: overrides.annotationId,
    content: overrides.content ?? "Need rework",
    createdBy: overrides.createdBy ?? ownerId,
    status: overrides.status ?? "OPEN",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function createCommentRepository(seed: Comment[] = []) {
  const comments = new Map(seed.map((c) => [c.id, c]));
  const repository: CommentRepository = {
    async createComment(data: CreateCommentRecord) {
      const comment = createTestComment({ id: `comment_${comments.size + 1}`, ...data });
      comments.set(comment.id, comment);
      return comment;
    },
    async findById(commentId) {
      return comments.get(commentId) ?? null;
    },
    async findByTarget(targetType, targetId) {
      return [...comments.values()].filter(
        (c) => c.targetType === targetType && c.targetId === targetId
      );
    },
    async updateComment(commentId, updates: UpdateCommentRecord) {
      const current = comments.get(commentId);
      if (!current) throw new Error("Comment not found");
      const updated = { ...current };
      for (const [key, val] of Object.entries(updates)) {
        if (val === null) {
          delete (updated as any)[key];
        } else {
          (updated as any)[key] = val instanceof Date ? val.toISOString() : val;
        }
      }
      updated.updatedAt = now;
      comments.set(commentId, updated);
      return updated;
    },
    async deleteComment(commentId) {
      comments.delete(commentId);
    },
    async hasUnresolvedCommentsForPages(pageIds) {
      return [...comments.values()].some(
        (c) =>
          ((c.pageId && pageIds.includes(c.pageId)) ||
            (c.targetType === "PAGE" && pageIds.includes(c.targetId))) &&
          c.status !== "RESOLVED_BY_EDITOR"
      );
    }
  };
  return { repository, comments };
}

function createCommentApp(
  clerkId: string,
  roleByUserId: Record<string, string | null>,
  seedComments: Comment[] = []
) {
  const { repository: commentRepository, comments } = createCommentRepository(seedComments);
  const user = users.find(u => u.clerkId === clerkId);
  const app = createApp({
    authVerifier: createVerifier(clerkId, user?.systemRole ?? null),
    userRepository: createUserRepository(),
    seriesRepository: createSeriesRepository(roleByUserId),
    manuscriptRepository: createManuscriptRepository(),
    chapterRepository: createChapterRepository(),
    pageRepository: createPageRepository(),
    taskRepository: createTaskRepository(),
    submissionRepository: createSubmissionRepository(),
    commentRepository
  });
  return { app, comments };
}

describe("comment routes integration tests", () => {
  it("allows series members to create and read comments", async () => {
    const { app } = createCommentApp(owner.clerkId, {
      [ownerId]: "OWNER_MANGAKA",
      [assistantId]: "ASSISTANT"
    });

    const createResponse = await request(app)
      .post("/api/comments")
      .set("Authorization", "Bearer valid")
      .send({
        targetType: "PAGE",
        targetId: pageId,
        content: "Fix dialog text"
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data).toMatchObject({
      targetType: "PAGE",
      targetId: pageId,
      content: "Fix dialog text",
      createdBy: ownerId,
      status: "OPEN"
    });

    const listResponse = await request(app)
      .get(`/api/comments/target/PAGE/${pageId}`)
      .set("Authorization", "Bearer valid");

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
  });

  it("denies access to non-series-members", async () => {
    const { app } = createCommentApp(stranger.clerkId, { [strangerId]: null });

    const createResponse = await request(app)
      .post("/api/comments")
      .set("Authorization", "Bearer valid")
      .send({
        targetType: "PAGE",
        targetId: pageId,
        content: "Fix dialog text"
      });

    expect(createResponse.status).toBe(403);
  });

  it("allows only creator or admin to edit or delete comment", async () => {
    const existing = createTestComment({ id: "c1", createdBy: ownerId });
    const { app, comments } = createCommentApp(
      assistant.clerkId,
      { [assistantId]: "ASSISTANT", [ownerId]: "OWNER_MANGAKA" },
      [existing]
    );

    // Assistant tries to edit owner's comment -> 403
    const editResponse = await request(app)
      .patch("/api/comments/c1")
      .set("Authorization", "Bearer valid")
      .send({ content: "Hacked!" });
    expect(editResponse.status).toBe(403);

    // Creator edits own comment -> 200
    const creatorApp = createCommentApp(
      owner.clerkId,
      { [assistantId]: "ASSISTANT", [ownerId]: "OWNER_MANGAKA" },
      [existing]
    ).app;
    const selfEdit = await request(creatorApp)
      .patch("/api/comments/c1")
      .set("Authorization", "Bearer valid")
      .send({ content: "Updated content" });
    expect(selfEdit.status).toBe(200);

    // Creator deletes own comment -> 200
    const selfDelete = await request(creatorApp)
      .delete("/api/comments/c1")
      .set("Authorization", "Bearer valid");
    expect(selfDelete.status).toBe(200);
  });

  it("handles mark-fixed endpoint permissions", async () => {
    const existing = createTestComment({ id: "c1", targetType: "TASK", targetId: "task_1", status: "OPEN" });
    const { app } = createCommentApp(
      assistant.clerkId,
      { [assistantId]: "ASSISTANT", [ownerId]: "OWNER_MANGAKA" },
      [existing]
    );

    // Assigned assistant can mark fixed
    const response = await request(app)
      .post("/api/comments/c1/mark-fixed")
      .set("Authorization", "Bearer valid");
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("FIXED_BY_ASSISTANT");

    // Stranger assistant cannot mark fixed
    const strangerApp = createCommentApp(
      strangerAssistant.clerkId,
      { [strangerAssistant.id]: "ASSISTANT" },
      [existing]
    ).app;
    const response2 = await request(strangerApp)
      .post("/api/comments/c1/mark-fixed")
      .set("Authorization", "Bearer valid");
    expect(response2.status).toBe(403);

  });

  it("handles verify-fixed endpoint permissions", async () => {
    const existing = createTestComment({ id: "c1", status: "FIXED_BY_ASSISTANT" });
    const { app } = createCommentApp(
      owner.clerkId,
      { [ownerId]: "OWNER_MANGAKA" },
      [existing]
    );

    const response = await request(app)
      .post("/api/comments/c1/verify-fixed")
      .set("Authorization", "Bearer valid");
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("VERIFIED_BY_MANGAKA");
  });

  it("handles resolve and reopen endpoints permissions", async () => {
    const existing = createTestComment({ id: "c1", status: "OPEN" });
    const { app } = createCommentApp(
      editor.clerkId,
      { [editorId]: "EDITOR" },
      [existing]
    );

    // Editor resolves
    const response = await request(app)
      .post("/api/comments/c1/resolve")
      .set("Authorization", "Bearer valid");
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("RESOLVED_BY_EDITOR");

    // Editor reopens
    const response2 = await request(app)
      .post("/api/comments/c1/reopen")
      .set("Authorization", "Bearer valid")
      .send({ reason: "Not fixed well enough" });
    expect(response2.status).toBe(200);
    expect(response2.body.data.status).toBe("OPEN");
    expect(response2.body.data.reopenReason).toBe("Not fixed well enough");
  });
});

