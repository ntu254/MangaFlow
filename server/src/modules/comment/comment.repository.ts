import mongoose from "mongoose";
import { CommentModel, type CommentDocument, type CommentTargetType } from "./comment.model.js";
import type { CreateCommentRecord, Comment, UpdateCommentRecord } from "./comment.service.js";

function serializeComment(document: CommentDocument & { _id: unknown }): Comment {
  return {
    id: String(document._id),
    targetType: document.targetType,
    targetId: String(document.targetId),
    pageId: document.pageId ? String(document.pageId) : undefined,
    annotationId: document.annotationId ? String(document.annotationId) : undefined,
    content: document.content,
    createdBy: String(document.createdBy),
    status: document.status,
    fixedBy: document.fixedBy ? String(document.fixedBy) : undefined,
    fixedAt: document.fixedAt?.toISOString(),
    verifiedBy: document.verifiedBy ? String(document.verifiedBy) : undefined,
    verifiedAt: document.verifiedAt?.toISOString(),
    resolvedBy: document.resolvedBy ? String(document.resolvedBy) : undefined,
    resolvedAt: document.resolvedAt?.toISOString(),
    reopenedBy: document.reopenedBy ? String(document.reopenedBy) : undefined,
    reopenedAt: document.reopenedAt?.toISOString(),
    reopenReason: document.reopenReason,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString()
  };
}

export function createMongoCommentRepository() {
  return {
    async createComment(data: CreateCommentRecord): Promise<Comment> {
      const comment = await CommentModel.create({
        targetType: data.targetType,
        targetId: data.targetId,
        pageId: data.pageId,
        annotationId: data.annotationId,
        content: data.content,
        createdBy: data.createdBy,
        status: data.status
      });
      return serializeComment(comment);
    },

    async findById(commentId: string): Promise<Comment | null> {
      if (!mongoose.isValidObjectId(commentId)) return null;
      const comment = await CommentModel.findById(commentId);
      return comment ? serializeComment(comment) : null;
    },

    async findByTarget(targetType: CommentTargetType, targetId: string): Promise<Comment[]> {
      if (!mongoose.isValidObjectId(targetId)) return [];
      const comments = await CommentModel.find({ targetType, targetId }).sort({ createdAt: -1 });
      return comments.map(serializeComment);
    },

    async updateComment(commentId: string, updates: UpdateCommentRecord): Promise<Comment> {
      const comment = await CommentModel.findByIdAndUpdate(
        commentId,
        { $set: updates },
        { new: true }
      );
      if (!comment) {
        throw new Error("Comment not found for update");
      }
      return serializeComment(comment);
    },

    async deleteComment(commentId: string): Promise<void> {
      if (!mongoose.isValidObjectId(commentId)) return;
      await CommentModel.findByIdAndDelete(commentId);
    }
  };
}

export type CommentRepository = ReturnType<typeof createMongoCommentRepository>;
