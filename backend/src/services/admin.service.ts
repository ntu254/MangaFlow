import bcrypt from "bcryptjs";
import {
  ChapterModel,
  EarningModel,
  MaterialModel,
  NotificationModel,
  ProposalModel,
  RankingModel,
  RefreshSessionModel,
  SeriesModel,
  StudioCommentModel,
  SubmissionModel,
  UserModel,
} from "../db/models.js";
import { AppError } from "../lib/http.js";
import { audit, broadcastNotification } from "./audit.service.js";
import { id } from "../domain/ids.js";
import { BOARD_TOTAL } from "./board-governance.service.js";
import { runWorkflowTransaction } from "./workflow-support.service.js";
import type { AuthedRequest } from "../types.js";
import type { ClientSession } from "mongoose";

const PROTECTED_FIELDS = ["passwordHash", "id", "createdAt", "updatedAt"];

type GovernanceState = {
  role: unknown;
  active: boolean;
  isChair: boolean;
  isEditorInChief: boolean;
};

function normalizedGovernanceState(
  current: Record<string, unknown> | undefined,
  patch: Record<string, unknown>,
): GovernanceState {
  const role = patch.role ?? current?.role;
  const active = Boolean(patch.active ?? current?.active ?? true);
  let isChair = Boolean(patch.isChair ?? current?.isChair);
  let isEditorInChief = Boolean(patch.isEditorInChief ?? current?.isEditorInChief);

  if (!active || role !== "BOARD") isChair = false;
  if (!active || role !== "EDITOR") isEditorInChief = false;

  if (patch.isChair === true && (!active || role !== "BOARD")) {
    throw new AppError(
      400,
      "Board Chair designation requires an active BOARD user.",
      "INVALID_BOARD_CHAIR",
    );
  }
  if (patch.isEditorInChief === true && (!active || role !== "EDITOR")) {
    throw new AppError(
      400,
      "Editor-in-Chief designation requires an active EDITOR user.",
      "INVALID_EDITOR_IN_CHIEF",
    );
  }

  return { role, active, isChair, isEditorInChief };
}

async function assertBoardCapacity(
  state: GovernanceState,
  session: ClientSession,
  excludeUserId?: string,
) {
  if (!(state.role === "BOARD" && state.active)) return;
  const filter: Record<string, unknown> = {
    role: "BOARD",
    active: { $ne: false },
  };
  if (excludeUserId) filter.id = { $ne: excludeUserId };
  const activeBoardCount = await UserModel.countDocuments(filter).session(session);
  if (activeBoardCount >= BOARD_TOTAL) {
    throw new AppError(
      409,
      `The active Board roster is capped at ${BOARD_TOTAL} members.`,
      "BOARD_ROSTER_FULL",
    );
  }
}

async function clearPreviousDesignationHolders(
  state: GovernanceState,
  targetUserId: string,
  session: ClientSession,
) {
  const updatedAt = new Date();
  if (state.isChair) {
    await UserModel.updateMany(
      { id: { $ne: targetUserId }, role: "BOARD", active: { $ne: false }, isChair: true },
      { $set: { isChair: false, updatedAt } },
      { session },
    );
  }
  if (state.isEditorInChief) {
    await UserModel.updateMany(
      {
        id: { $ne: targetUserId },
        role: "EDITOR",
        active: { $ne: false },
        isEditorInChief: true,
      },
      { $set: { isEditorInChief: false, updatedAt } },
      { session },
    );
  }
}

export async function listUsers() {
  return UserModel.find({}).sort({ role: 1, name: 1 }).lean();
}

export async function getUser(userId: string) {
  return UserModel.findOne({ id: userId }).lean();
}

export function adminUser(user: any) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active !== false,
    isChair: Boolean(user.isChair),
    isEditorInChief: Boolean(user.isEditorInChief),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function createUser(req: AuthedRequest, body: Record<string, unknown>) {
  const email = String(body.email).toLowerCase().trim();
  const existing = await UserModel.findOne({ email }).lean();
  if (existing) throw new AppError(409, "Email is already in use.", "EMAIL_IN_USE");

  const password = String(body.password ?? email);
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = id("u");
  const state = normalizedGovernanceState(undefined, body);
  const user = await runWorkflowTransaction(async (session) => {
    await assertBoardCapacity(state, session);
    await clearPreviousDesignationHolders(state, userId, session);
    const [createdUser] = await UserModel.create(
      [
        {
          id: userId,
          name: body.name,
          email,
          passwordHash,
          role: state.role,
          active: state.active,
          isChair: state.isChair,
          isEditorInChief: state.isEditorInChief,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      { session },
    );
    return createdUser.toObject();
  });
  await audit(req, "user.create", "user", (user as any).id, {
    role: state.role,
    active: state.active,
    isChair: state.isChair,
    isEditorInChief: state.isEditorInChief,
  });
  return user;
}

async function assertDoesNotRemoveCurrentAdmin(
  req: AuthedRequest,
  userId: string,
  patch: Record<string, unknown>,
) {
  if (req.actor?.id !== userId) return;
  const roleAfter = patch.role ?? req.actor.role;
  const activeAfter = patch.active;
  if (roleAfter !== "ADMIN" || activeAfter === false) {
    throw new AppError(
      400,
      "You cannot remove your own active admin access.",
      "SELF_ADMIN_LOCKOUT",
    );
  }
}

export async function updateUser(
  req: AuthedRequest,
  userId: string,
  patch: Record<string, unknown>,
) {
  const disallowed = Object.keys(patch).filter((key) => PROTECTED_FIELDS.includes(key));
  if (disallowed.length > 0) {
    throw new AppError(
      400,
      `Cannot overwrite protected fields: ${disallowed.join(", ")}`,
      "PROTECTED_FIELD",
    );
  }

  const existing = (await UserModel.findOne({ id: userId }).lean()) as any;
  if (!existing) {
    throw new AppError(404, "User not found.", "NOT_FOUND");
  }
  await assertDoesNotRemoveCurrentAdmin(req, userId, patch);

  const { reason, ...persistedPatch } = patch;
  const state = normalizedGovernanceState(existing, persistedPatch);
  const setFields: Record<string, unknown> = {
    ...persistedPatch,
    role: state.role,
    active: state.active,
    isChair: state.isChair,
    isEditorInChief: state.isEditorInChief,
  };
  const updated = await runWorkflowTransaction(async (session) => {
    await assertBoardCapacity(state, session, userId);
    await clearPreviousDesignationHolders(state, userId, session);
    return UserModel.findOneAndUpdate(
      { id: userId },
      { $set: { ...setFields, updatedAt: new Date() } },
      { returnDocument: "after", session },
    ).lean();
  });

  if (persistedPatch.role !== undefined || persistedPatch.active !== undefined) {
    await audit(req, "user.update", "user", userId, {
      changedFields: Object.keys(persistedPatch),
      previousRole: existing.role,
      newRole: persistedPatch.role ?? existing.role,
      previousActive: existing.active,
      newActive: persistedPatch.active ?? existing.active,
      reason,
    });
  }

  return updated;
}

export async function resetUserPassword(req: AuthedRequest, userId: string, password: string) {
  const existing = await UserModel.findOne({ id: userId }).lean();
  if (!existing) throw new AppError(404, "User not found.", "NOT_FOUND");

  const passwordHash = await bcrypt.hash(password, 10);
  const updated = await UserModel.findOneAndUpdate(
    { id: userId },
    { $set: { passwordHash, updatedAt: new Date() } },
    { returnDocument: "after" },
  ).lean();
  const revoked = await RefreshSessionModel.updateMany(
    { userId, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } },
  );

  await audit(req, "user.password_reset", "user", userId, {
    revokedSessions: revoked.modifiedCount,
  });
  return updated;
}

export async function deactivateUser(req: AuthedRequest, userId: string) {
  await assertDoesNotRemoveCurrentAdmin(req, userId, { active: false });
  return updateUser(req, userId, { active: false });
}

export async function deleteUser(req: AuthedRequest, userId: string) {
  await assertDoesNotRemoveCurrentAdmin(req, userId, { active: false });
  const existing = await UserModel.findOne({ id: userId }).lean();
  if (!existing) throw new AppError(404, "User not found.", "NOT_FOUND");
  await updateUser(req, userId, { active: false });
  const updated = await UserModel.findOneAndUpdate(
    { id: userId },
    {
      $set: {
        active: false,
        isChair: false,
        isEditorInChief: false,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  ).lean();
  await audit(req, "user.delete", "user", userId, {
    softDelete: true,
    previousRole: (existing as any).role,
  });
  return updated;
}

export async function listManagedNotifications(filters?: {
  targetRole?: string;
  status?: string;
  type?: string;
}) {
  const query: Record<string, unknown> = {};
  if (filters?.targetRole) query.audienceRole = filters.targetRole;
  if (filters?.type) query.kind = filters.type;
  if (filters?.status === "ARCHIVED") query.archivedAt = { $exists: true };
  if (filters?.status === "ACTIVE" || filters?.status === "SENT") {
    query.archivedAt = { $exists: false };
  }
  return NotificationModel.find(query).sort({ createdAt: -1 }).limit(500).lean();
}

export async function createManagedNotification(req: AuthedRequest, body: Record<string, unknown>) {
  const audienceType = (body.audienceType as string) ?? "USER";
  const audienceRole = body.audienceRole as string | undefined;
  const targetUserId = body.userId as string | undefined;
  const priority = (body.priority as string) ?? "NORMAL";
  const kind = (body.kind as string) ?? (body.type as string) ?? "admin.announcement";
  const title = body.title as string;
  const message = body.message as string;
  const actionUrl = body.actionUrl as string | undefined;

  if (audienceType === "USER" && !targetUserId) {
    throw new AppError(400, "userId is required for USER audience.", "VALIDATION_ERROR");
  }
  if (audienceType === "ROLE" && !audienceRole) {
    throw new AppError(400, "audienceRole is required for ROLE audience.", "VALIDATION_ERROR");
  }

  const { batchId, recipientCount } = await broadcastNotification({
    audienceType: audienceType as "USER" | "ROLE" | "ALL",
    audienceRole,
    targetUserId,
    kind,
    title,
    message,
    priority: priority as "LOW" | "NORMAL" | "HIGH",
    actionUrl,
    createdById: req.actor?.id,
    createdByName: req.actor?.name,
  });

  await audit(req, "notification.broadcast", "notification", batchId, {
    audienceType,
    audienceRole,
    recipientCount,
    priority,
  });

  return { batchId, recipientCount, audienceType, audienceRole, priority };
}

export async function patchManagedNotification(
  req: AuthedRequest,
  notificationId: string,
  patch: Record<string, unknown>,
) {
  const existing = (await NotificationModel.findOne({ id: notificationId }).lean()) as any;
  if (!existing) throw new AppError(404, "Notification not found.", "NOTIFICATION_NOT_FOUND");
  if (existing.sentAt || existing.status === "SENT") {
    throw new AppError(409, "Sent notifications cannot be edited directly.", "SENT_IMMUTABLE");
  }
  const target = existing.batchId ? { batchId: existing.batchId } : { id: notificationId };
  const updated = await NotificationModel.findOneAndUpdate(
    target,
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" },
  ).lean();
  await audit(req, "notification.update", "notification", notificationId, {
    changedFields: Object.keys(patch),
  });
  return updated;
}

export async function deleteManagedNotification(req: AuthedRequest, notificationId: string) {
  const existing = (await NotificationModel.findOne({ id: notificationId }).lean()) as any;
  if (!existing) throw new AppError(404, "Notification not found.", "NOTIFICATION_NOT_FOUND");
  const target = existing.batchId ? { batchId: existing.batchId } : { id: notificationId };
  const patch = { archivedAt: new Date(), updatedAt: new Date() };
  await NotificationModel.updateMany(target, { $set: patch });
  const updated = await NotificationModel.findOne(target).lean();
  await audit(req, "notification.delete", "notification", notificationId, {
    archived: true,
    batchId: existing.batchId,
  });
  return updated;
}

export async function listAssistantEarnings(assistantId: string) {
  return EarningModel.find({ assistantId }).sort({ period: -1, updatedAt: -1 }).lean();
}

export async function workflowSummary() {
  const [
    pendingEditor,
    pendingBoard,
    tieBreaks,
    chaptersInReview,
    revisionChapters,
    openComments,
    pendingSubmissions,
    atRiskRankings,
  ] = await Promise.all([
    ProposalModel.countDocuments({ status: { $in: ["PENDING_EDITOR", "CHANGES_REQUESTED"] } }),
    ProposalModel.countDocuments({ status: "PENDING_BOARD" }),
    ProposalModel.countDocuments({ status: "TIE_BREAK" }),
    ChapterModel.countDocuments({ status: "TANTOU_REVIEW" }),
    ChapterModel.countDocuments({ status: "REVISION_REQUIRED" }),
    StudioCommentModel.countDocuments({ status: { $ne: "RESOLVED" } }),
    SubmissionModel.countDocuments({
      status: { $in: ["PENDING", "SUBMITTED", "MANGAKA_APPROVED"] },
    }),
    RankingModel.countDocuments({ $or: [{ atRisk: true }, { status: "AT_RISK" }] }),
  ]);

  const proposals = await ProposalModel.find({
    status: { $in: ["CHANGES_REQUESTED", "PENDING_BOARD", "TIE_BREAK"] },
  })
    .sort({ updatedAt: -1 })
    .limit(25)
    .lean();

  const chapters = await ChapterModel.find({
    status: { $in: ["REVISION_REQUIRED", "TANTOU_REVIEW"] },
  })
    .sort({ updatedAt: -1 })
    .limit(25)
    .lean();

  const issues = [
    ...proposals.map((proposal: any) => ({
      id: proposal.id,
      item: proposal.title,
      owner: proposal.assignedEditorName ?? proposal.authorName ?? "Unassigned",
      stage: proposal.status,
      severity: proposal.status === "TIE_BREAK" ? "HIGH" : "MEDIUM",
      detail:
        proposal.status === "PENDING_BOARD"
          ? "Board packet waiting for votes"
          : "Manual follow-up may be needed",
      updatedAt: proposal.updatedAt,
    })),
    ...chapters.map((chapter: any) => ({
      id: chapter.id,
      item: `Chapter ${chapter.number} - ${chapter.title}`,
      owner: chapter.assigneeName ?? "Unassigned",
      stage: chapter.status,
      severity: chapter.status === "REVISION_REQUIRED" ? "MEDIUM" : "LOW",
      detail:
        chapter.status === "REVISION_REQUIRED" ? "Revision loop open" : "Awaiting editorial review",
      updatedAt: chapter.updatedAt,
    })),
  ];

  return {
    counts: {
      pendingEditor,
      pendingBoard,
      tieBreaks,
      chaptersInReview,
      revisionChapters,
      openComments,
      pendingSubmissions,
      atRiskRankings,
      issues: issues.length,
      highRisk: issues.filter((issue) => issue.severity === "HIGH").length,
    },
    issues,
  };
}

export async function storageSummary() {
  const materials = await MaterialModel.find({}).sort({ updatedAt: -1 }).limit(200).lean();
  const totalBytes = materials.reduce((sum: number, material: any) => {
    const direct = Number(material.size ?? material.metadata?.size ?? 0);
    const versionBytes = Array.isArray(material.versions)
      ? material.versions.reduce(
          (inner: number, version: any) => inner + Number(version.size ?? 0),
          0,
        )
      : 0;
    return sum + Math.max(direct, versionBytes);
  }, 0);

  return {
    indexedAssets: materials.length,
    totalBytes,
    assets: materials.map((material: any) => ({
      id: material.id,
      title: material.title ?? material.fileName ?? material.id,
      owner: material.seriesId ?? material.chapterId ?? material.proposalId ?? "unscoped",
      kind: material.kind ?? material.type ?? material.category ?? "material",
      sizeBytes:
        Number(material.size ?? material.metadata?.size ?? 0) ||
        Number(material.versions?.[material.versions.length - 1]?.size ?? 0),
      status: material.status ?? "ACTIVE",
      updatedAt: material.updatedAt,
    })),
  };
}
