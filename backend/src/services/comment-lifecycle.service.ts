import { StudioCommentModel } from "../db/models.js";
import { AppError } from "../lib/http.js";
import { runWorkflowTransaction } from "./workflow-support.service.js";
import { audit } from "./audit.service.js";
import type { AuthedRequest } from "../types.js";
import type { ClientSession } from "mongoose";

export type CommentLifecycleActor = {
  id: string;
  name: string;
  role: string;
};

export interface ResolveCommentOptions {
  note?: string;
}

/**
 * Sprint 3.1 / COM-001 — close a comment as RESOLVED. Returns the
 * updated comment. Throws when the comment is already resolved or when
 * the actor is the assignor of a blocking comment that still needs
 * reviewer approval.
 */
export async function resolveComment(
  req: AuthedRequest,
  actor: CommentLifecycleActor,
  commentId: string,
  options: ResolveCommentOptions = {},
) {
  const updated = await runWorkflowTransaction(async (session: ClientSession) => {
    const comment = await StudioCommentModel.findOne({ id: commentId }).session(session);
    if (!comment) {
      throw new AppError(404, "Comment not found.", "COMMENT_NOT_FOUND");
    }
    if (comment.status === "RESOLVED") {
      throw new AppError(409, "Comment is already resolved.", "COMMENT_ALREADY_RESOLVED");
    }

    // Sprint 3.1 / COM-001 — when a blocking comment was created by an
    // Editor (or other reviewer), the requester should not be the one
    // marking it resolved. Reviewers must sign off the fix.
    if (comment.isBlocking && comment.authorRole === "editor" && actor.role !== "EDITOR") {
      throw new AppError(
        403,
        "Only an Editor can resolve a blocking review comment.",
        "REVIEWER_RESOLVE_REQUIRED",
      );
    }

    comment.status = "RESOLVED";
    comment.resolvedById = actor.id;
    comment.resolvedByName = actor.name;
    comment.resolvedAt = new Date();
    if (options.note) comment.resolutionNote = options.note;
    comment.updatedAt = new Date();
    await comment.save({ session });
    return comment.toObject();
  });

  await audit(req, "comment.resolved", "comment", commentId, {
    actorId: actor.id,
    note: options.note,
  });
  return updated;
}

export interface ReopenCommentOptions {
  reason: string;
}

/**
 * Sprint 3.1 / COM-001 — re-open a previously resolved comment. The
 * reason is captured in the audit log so the team can see why the
 * resolution was rolled back.
 */
export async function reopenComment(
  req: AuthedRequest,
  actor: CommentLifecycleActor,
  commentId: string,
  options: ReopenCommentOptions,
) {
  if (!options.reason?.trim()) {
    throw new AppError(400, "A reason is required to reopen a comment.", "REASON_REQUIRED");
  }
  const updated = await runWorkflowTransaction(async (session: ClientSession) => {
    const comment = await StudioCommentModel.findOne({ id: commentId }).session(session);
    if (!comment) {
      throw new AppError(404, "Comment not found.", "COMMENT_NOT_FOUND");
    }
    if (comment.status !== "RESOLVED") {
      throw new AppError(
        409,
        "Only resolved comments can be reopened.",
        "COMMENT_NOT_RESOLVED",
      );
    }

    comment.status = "REOPENED";
    comment.reopenedById = actor.id;
    comment.reopenedByName = actor.name;
    comment.reopenedAt = new Date();
    // Stash the reopen reason on the resolution note so the
    // latest-action trail is visible without a separate audit query.
    comment.resolutionNote = `Reopened: ${options.reason}`;
    comment.updatedAt = new Date();
    await comment.save({ session });
    return comment.toObject();
  });

  await audit(req, "comment.reopened", "comment", commentId, {
    actorId: actor.id,
    reason: options.reason,
  });
  return updated;
}