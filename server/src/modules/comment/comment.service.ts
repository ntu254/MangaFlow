import type { CommentRepository } from "./comment.repository.js";
import type { CommentStatus, CommentTargetType } from "./comment.model.js";

export type CommentUser = {
  id: string;
  fullName: string;
  email: string;
};

export type Comment = {
  id: string;
  targetType: CommentTargetType;
  targetId: string;
  pageId?: string;
  annotationId?: string;
  content: string;
  createdBy: string;
  createdByUserInfo?: CommentUser;
  status: CommentStatus;
  fixedBy?: string;
  fixedByUserInfo?: CommentUser;
  fixedAt?: string;
  verifiedBy?: string;
  verifiedByUserInfo?: CommentUser;
  verifiedAt?: string;
  resolvedBy?: string;
  resolvedByUserInfo?: CommentUser;
  resolvedAt?: string;
  reopenedBy?: string;
  reopenedByUserInfo?: CommentUser;
  reopenedAt?: string;
  reopenReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCommentInput = {
  targetType: CommentTargetType;
  targetId: string;
  pageId?: string;
  annotationId?: string;
  content: string;
  createdBy: string;
};

export type CreateCommentRecord = CreateCommentInput & {
  status: CommentStatus;
};

export type UpdateCommentRecord = {
  content?: string;
  status?: CommentStatus;
  fixedBy?: string | null;
  fixedAt?: Date | null;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;
  resolvedBy?: string | null;
  resolvedAt?: Date | null;
  reopenedBy?: string | null;
  reopenedAt?: Date | null;
  reopenReason?: string | null;
};

export class CommentServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

function assertNonEmpty(value: string | undefined, code: string, message: string, max = 2000) {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new CommentServiceError(code, message);
  }
  if (trimmed.length > max) {
    throw new CommentServiceError(code, `${message} (${max} characters max)`);
  }
  return trimmed;
}

export function createCommentService(repository: CommentRepository) {
  return {
    async createComment(input: CreateCommentInput): Promise<Comment> {
      const content = assertNonEmpty(input.content, "INVALID_CONTENT", "Comment content is required", 2000);
      if (!input.targetType) throw new CommentServiceError("INVALID_TARGET_TYPE", "Target type is required");
      if (!input.targetId) throw new CommentServiceError("INVALID_TARGET_ID", "Target id is required");
      if (!input.createdBy) throw new CommentServiceError("INVALID_CREATOR", "Creator user id is required");

      return repository.createComment({
        targetType: input.targetType,
        targetId: input.targetId,
        pageId: input.pageId,
        annotationId: input.annotationId,
        content,
        createdBy: input.createdBy,
        status: "OPEN"
      });
    },

    async getById(commentId: string): Promise<Comment> {
      const comment = await repository.findById(commentId);
      if (!comment) {
        throw new CommentServiceError("COMMENT_NOT_FOUND", "Comment not found", 404);
      }
      return comment;
    },

    async listForTarget(targetType: CommentTargetType, targetId: string): Promise<Comment[]> {
      if (!targetType) throw new CommentServiceError("INVALID_TARGET_TYPE", "Target type is required");
      if (!targetId) throw new CommentServiceError("INVALID_TARGET_ID", "Target id is required");
      return repository.findByTarget(targetType, targetId);
    },

    async updateComment(commentId: string, content: string, userId: string, isAdmin: boolean): Promise<Comment> {
      const comment = await this.getById(commentId);
      if (comment.createdBy !== userId && !isAdmin) {
        throw new CommentServiceError("FORBIDDEN", "Only the comment author or Admin can edit this comment", 403);
      }

      const cleanContent = assertNonEmpty(content, "INVALID_CONTENT", "Comment content is required", 2000);
      return repository.updateComment(commentId, { content: cleanContent });
    },

    async deleteComment(commentId: string, userId: string, isAdmin: boolean): Promise<void> {
      const comment = await this.getById(commentId);
      if (comment.createdBy !== userId && !isAdmin) {
        throw new CommentServiceError("FORBIDDEN", "Only the comment author or Admin can delete this comment", 403);
      }
      await repository.deleteComment(commentId);
    },

    async markFixed(commentId: string, userId: string): Promise<Comment> {
      const comment = await this.getById(commentId);
      if (comment.status !== "OPEN") {
        throw new CommentServiceError("INVALID_STATUS_TRANSITION", `Cannot mark comment as fixed from status ${comment.status}`);
      }

      return repository.updateComment(commentId, {
        status: "FIXED_BY_ASSISTANT",
        fixedBy: userId,
        fixedAt: new Date(),
        // Clear previous verify/resolve logs to reset transition tracking if re-triggered
        verifiedBy: null,
        verifiedAt: null,
        resolvedBy: null,
        resolvedAt: null
      });
    },

    async verifyFixed(commentId: string, userId: string): Promise<Comment> {
      const comment = await this.getById(commentId);
      if (comment.status !== "FIXED_BY_ASSISTANT") {
        throw new CommentServiceError("INVALID_STATUS_TRANSITION", `Cannot verify comment from status ${comment.status}`);
      }

      return repository.updateComment(commentId, {
        status: "VERIFIED_BY_MANGAKA",
        verifiedBy: userId,
        verifiedAt: new Date()
      });
    },

    async resolve(commentId: string, userId: string): Promise<Comment> {
      // Editor can resolve a comment from any state
      return repository.updateComment(commentId, {
        status: "RESOLVED_BY_EDITOR",
        resolvedBy: userId,
        resolvedAt: new Date()
      });
    },

    async reopen(commentId: string, reason: string, userId: string): Promise<Comment> {
      const cleanReason = assertNonEmpty(reason, "INVALID_REOPEN_REASON", "Reopen reason is required", 1000);

      // Reopening resets the status to OPEN
      return repository.updateComment(commentId, {
        status: "OPEN",
        reopenedBy: userId,
        reopenedAt: new Date(),
        reopenReason: cleanReason,
        fixedBy: null,
        fixedAt: null,
        verifiedBy: null,
        verifiedAt: null,
        resolvedBy: null,
        resolvedAt: null
      });
    },

    async hasUnresolvedCommentsForPages(pageIds: string[]): Promise<boolean> {
      return repository.hasUnresolvedCommentsForPages(pageIds);
    }
  };
}


export type CommentService = ReturnType<typeof createCommentService>;
