import { describe, expect, it } from "vitest";
import type { CommentRepository } from "./comment.repository.js";
import { createCommentService, type CreateCommentRecord, type Comment, type UpdateCommentRecord } from "./comment.service.js";

const now = "2026-06-03T00:00:00.000Z";

function createComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: overrides.id ?? "comment_1",
    targetType: overrides.targetType ?? "PAGE",
    targetId: overrides.targetId ?? "page_1",
    pageId: overrides.pageId,
    annotationId: overrides.annotationId,
    content: overrides.content ?? "Fix this bubble",
    createdBy: overrides.createdBy ?? "user_1",
    status: overrides.status ?? "OPEN",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function createRepositories(seedComments: Comment[] = []) {
  const comments = new Map(seedComments.map((comment) => [comment.id, comment]));

  const commentRepository: CommentRepository = {
    async createComment(data: CreateCommentRecord) {
      const comment = createComment({
        id: `comment_${comments.size + 1}`,
        ...data
      });
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

      // Apply updates and handle null values to clear fields
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

  return { commentRepository, comments };
}

describe("comment service unit tests", () => {
  it("creates a comment with OPEN status", async () => {
    const { commentRepository } = createRepositories();
    const service = createCommentService(commentRepository);

    const comment = await service.createComment({
      targetType: "PAGE",
      targetId: "page_1",
      content: "Please fix",
      createdBy: "user_1"
    });

    expect(comment).toMatchObject({
      targetType: "PAGE",
      targetId: "page_1",
      content: "Please fix",
      createdBy: "user_1",
      status: "OPEN"
    });
  });

  it("validates missing or empty fields", async () => {
    const { commentRepository } = createRepositories();
    const service = createCommentService(commentRepository);

    await expect(
      service.createComment({
        targetType: "PAGE",
        targetId: "page_1",
        content: " ",
        createdBy: "user_1"
      })
    ).rejects.toMatchObject({ code: "INVALID_CONTENT" });
  });

  it("edits comment content if creator or admin", async () => {
    const existing = createComment({ id: "c1", createdBy: "user_1", content: "Old content" });
    const { commentRepository } = createRepositories([existing]);
    const service = createCommentService(commentRepository);

    // Edit by creator succeeds
    const updated = await service.updateComment("c1", "New content", "user_1", false);
    expect(updated.content).toBe("New content");

    // Edit by admin succeeds
    const updatedByAdmin = await service.updateComment("c1", "Admin content", "admin_1", true);
    expect(updatedByAdmin.content).toBe("Admin content");

    // Edit by another user fails
    await expect(
      service.updateComment("c1", "Hacked", "stranger_1", false)
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("deletes comment if creator or admin", async () => {
    const existing = createComment({ id: "c1", createdBy: "user_1" });
    const { commentRepository, comments } = createRepositories([existing]);
    const service = createCommentService(commentRepository);

    // Fails for stranger
    await expect(service.deleteComment("c1", "stranger", false)).rejects.toMatchObject({ code: "FORBIDDEN" });

    // Succeeds for creator
    await service.deleteComment("c1", "user_1", false);
    expect(comments.get("c1")).toBeUndefined();
  });

  it("handles markFixed workflow status transitions", async () => {
    const openComment = createComment({ id: "c1", status: "OPEN" });
    const { commentRepository } = createRepositories([openComment]);
    const service = createCommentService(commentRepository);

    const updated = await service.markFixed("c1", "assistant_1");
    expect(updated.status).toBe("FIXED_BY_ASSISTANT");
    expect(updated.fixedBy).toBe("assistant_1");
    expect(updated.fixedAt).toBeDefined();

    // Re-transitioning from FIXED_BY_ASSISTANT should fail
    await expect(service.markFixed("c1", "assistant_1")).rejects.toMatchObject({
      code: "INVALID_STATUS_TRANSITION"
    });
  });

  it("handles verifyFixed workflow status transitions", async () => {
    const fixedComment = createComment({ id: "c1", status: "FIXED_BY_ASSISTANT" });
    const { commentRepository } = createRepositories([fixedComment]);
    const service = createCommentService(commentRepository);

    const updated = await service.verifyFixed("c1", "mangaka_1");
    expect(updated.status).toBe("VERIFIED_BY_MANGAKA");
    expect(updated.verifiedBy).toBe("mangaka_1");
    expect(updated.verifiedAt).toBeDefined();

    // Cannot verify directly from OPEN status
    const openComment = createComment({ id: "c2", status: "OPEN" });
    const { commentRepository: repo2 } = createRepositories([openComment]);
    const service2 = createCommentService(repo2);
    await expect(service2.verifyFixed("c2", "mangaka_1")).rejects.toMatchObject({
      code: "INVALID_STATUS_TRANSITION"
    });
  });

  it("handles resolve workflow status transitions", async () => {
    const fixedComment = createComment({ id: "c1", status: "FIXED_BY_ASSISTANT" });
    const { commentRepository } = createRepositories([fixedComment]);
    const service = createCommentService(commentRepository);

    const updated = await service.resolve("c1", "editor_1");
    expect(updated.status).toBe("RESOLVED_BY_EDITOR");
    expect(updated.resolvedBy).toBe("editor_1");
  });

  it("handles reopen workflow status transitions", async () => {
    const resolvedComment = createComment({
      id: "c1",
      status: "RESOLVED_BY_EDITOR",
      resolvedBy: "editor_1",
      resolvedAt: now
    });
    const { commentRepository } = createRepositories([resolvedComment]);
    const service = createCommentService(commentRepository);

    const updated = await service.reopen("c1", "Need more rework", "editor_1");
    expect(updated.status).toBe("OPEN");
    expect(updated.reopenedBy).toBe("editor_1");
    expect(updated.reopenReason).toBe("Need more rework");
    // Verify previous logs are cleared
    expect(updated.resolvedBy).toBeUndefined();
  });
});
