import mongoose from "mongoose";
import { CommentModel, type CommentDocument, type CommentTargetType } from "./comment.model.js";
import type { CreateCommentRecord, Comment, UpdateCommentRecord } from "./comment.service.js";

function serializeComment(document: any): Comment {
  const serializeUserField = (field: any) => {
    if (!field) return undefined;
    if (field && typeof field === "object" && field._id) {
      return {
        id: String(field._id),
        fullName: field.fullName,
        email: field.email
      };
    }
    return undefined;
  };

  const getUserIdString = (field: any) => {
    if (!field) return "";
    if (field && typeof field === "object" && field._id) {
      return String(field._id);
    }
    return String(field);
  };

  return {
    id: String(document._id),
    targetType: document.targetType,
    targetId: String(document.targetId),
    pageId: document.pageId ? String(document.pageId) : undefined,
    annotationId: document.annotationId ? String(document.annotationId) : undefined,
    content: document.content,
    createdBy: getUserIdString(document.createdBy),
    createdByUserInfo: serializeUserField(document.createdBy),
    status: document.status,
    fixedBy: document.fixedBy ? getUserIdString(document.fixedBy) : undefined,
    fixedByUserInfo: serializeUserField(document.fixedBy),
    fixedAt: document.fixedAt?.toISOString(),
    verifiedBy: document.verifiedBy ? getUserIdString(document.verifiedBy) : undefined,
    verifiedByUserInfo: serializeUserField(document.verifiedBy),
    verifiedAt: document.verifiedAt?.toISOString(),
    resolvedBy: document.resolvedBy ? getUserIdString(document.resolvedBy) : undefined,
    resolvedByUserInfo: serializeUserField(document.resolvedBy),
    resolvedAt: document.resolvedAt?.toISOString(),
    reopenedBy: document.reopenedBy ? getUserIdString(document.reopenedBy) : undefined,
    reopenedByUserInfo: serializeUserField(document.reopenedBy),
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
      const populated = await CommentModel.findById(comment._id)
        .populate("createdBy")
        .populate("fixedBy")
        .populate("verifiedBy")
        .populate("resolvedBy")
        .populate("reopenedBy");
      return serializeComment(populated || comment);
    },

    async findById(commentId: string): Promise<Comment | null> {
      if (!mongoose.isValidObjectId(commentId)) return null;
      const comment = await CommentModel.findById(commentId)
        .populate("createdBy")
        .populate("fixedBy")
        .populate("verifiedBy")
        .populate("resolvedBy")
        .populate("reopenedBy");
      return comment ? serializeComment(comment) : null;
    },

    async findByTarget(targetType: CommentTargetType, targetId: string): Promise<Comment[]> {
      if (!mongoose.isValidObjectId(targetId)) return [];
      const comments = await CommentModel.find({ targetType, targetId })
        .populate("createdBy")
        .populate("fixedBy")
        .populate("verifiedBy")
        .populate("resolvedBy")
        .populate("reopenedBy")
        .sort({ createdAt: -1 });
      return comments.map(serializeComment);
    },

    async updateComment(commentId: string, updates: UpdateCommentRecord): Promise<Comment> {
      const comment = await CommentModel.findByIdAndUpdate(
        commentId,
        { $set: updates },
        { returnDocument: "after" }
      )
        .populate("createdBy")
        .populate("fixedBy")
        .populate("verifiedBy")
        .populate("resolvedBy")
        .populate("reopenedBy");
      if (!comment) {
        throw new Error("Comment not found for update");
      }
      return serializeComment(comment);
    },

    async deleteComment(commentId: string): Promise<void> {
      if (!mongoose.isValidObjectId(commentId)) return;
      await CommentModel.findByIdAndDelete(commentId);
    },

    async hasUnresolvedCommentsForPages(pageIds: string[]): Promise<boolean> {
      const validPageIds = pageIds.filter(id => mongoose.isValidObjectId(id));
      if (validPageIds.length === 0) return false;

      const count = await CommentModel.countDocuments({
        $or: [
          { pageId: { $in: validPageIds } },
          { targetType: "PAGE", targetId: { $in: validPageIds } }
        ],
        status: { $ne: "RESOLVED_BY_EDITOR" }
      });
      return count > 0;
    }
  };
}


export type CommentRepository = ReturnType<typeof createMongoCommentRepository>;
