import bcrypt from "bcryptjs";
import {
  AuditEntryModel,
  ChapterModel,
  EarningModel,
  MaterialModel,
  NotificationModel,
  ProposalModel,
  RankingModel,
  SeriesModel,
  StudioCommentModel,
  SubmissionModel,
  UserModel,
} from "../db/models.js";
import { AppError } from "../lib/http.js";
import { audit, broadcastNotification } from "./audit.service.js";
import { id } from "../domain/ids.js";
import type { AuthedRequest } from "../types.js";

const PROTECTED_FIELDS = ["passwordHash", "id", "createdAt", "updatedAt"];

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
  const user = await UserModel.create({
    id: id("u"),
    name: body.name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: body.role,
    active: body.active ?? true,
    isChair: Boolean(body.isChair),
    isEditorInChief: Boolean(body.isEditorInChief),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await audit(req, "user.create", "user", (user as any).id, {
    role: body.role,
    active: body.active ?? true,
  });
  return user.toObject();
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
  const setFields: Record<string, unknown> = { ...persistedPatch };
  await UserModel.findOneAndUpdate(
    { id: userId },
    { $set: { ...setFields, updatedAt: new Date() } },
    { returnDocument: "after" },
  ).lean();

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

  return UserModel.findOne({ id: userId }).lean();
}

export async function deactivateUser(req: AuthedRequest, userId: string) {
  await assertDoesNotRemoveCurrentAdmin(req, userId, { active: false });
  return updateUser(req, userId, { active: false });
}

export async function deleteUser(req: AuthedRequest, userId: string) {
  await assertDoesNotRemoveCurrentAdmin(req, userId, { active: false });
  const existing = await UserModel.findOne({ id: userId }).lean();
  if (!existing) throw new AppError(404, "User not found.", "NOT_FOUND");
  await UserModel.findOneAndUpdate(
    { id: userId },
    { $set: { active: false, deletedAt: new Date(), updatedAt: new Date() } },
    { returnDocument: "after" },
  ).lean();
  await audit(req, "user.delete", "user", userId, {
    softDelete: true,
    previousRole: (existing as any).role,
  });
  return UserModel.findOne({ id: userId }).lean();
}

export async function listAuditEntries(filters?: { action?: string; actorId?: string }) {
  const query: Record<string, unknown> = {};
  if (filters?.action) query.action = filters.action;
  if (filters?.actorId) query.actorId = filters.actorId;
  return AuditEntryModel.find(query).sort({ createdAt: -1 }).limit(200).lean();
}

export async function listManagedNotifications(filters?: {
  targetRole?: string;
  status?: string;
  type?: string;
}) {
  const query: Record<string, unknown> = {};
  if (filters?.targetRole) query.targetRole = filters.targetRole;
  if (filters?.status) query.status = filters.status;
  if (filters?.type) query.type = filters.type;
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
  if (existing.status === "SENT") {
    throw new AppError(409, "Sent notifications cannot be edited directly.", "SENT_IMMUTABLE");
  }
  const updated = await NotificationModel.findOneAndUpdate(
    { id: notificationId },
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
  const patch =
    existing.status === "SENT"
      ? { status: "ARCHIVED", archivedAt: new Date(), updatedAt: new Date() }
      : {
          status: "ARCHIVED",
          archivedAt: new Date(),
          deletedAt: new Date(),
          updatedAt: new Date(),
        };
  const updated = await NotificationModel.findOneAndUpdate(
    { id: notificationId },
    { $set: patch },
    { returnDocument: "after" },
  ).lean();
  await audit(req, "notification.delete", "notification", notificationId, {
    archived: true,
    previousStatus: existing.status,
  });
  return updated;
}

export async function listEarnings() {
  return EarningModel.find({}).sort({ period: -1 }).lean();
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
    ChapterModel.countDocuments({ status: "IN_REVIEW" }),
    ChapterModel.countDocuments({ status: "REVISION" }),
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

  const chapters = await ChapterModel.find({ status: { $in: ["REVISION", "IN_REVIEW"] } })
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
      severity: chapter.status === "REVISION" ? "MEDIUM" : "LOW",
      detail: chapter.status === "REVISION" ? "Revision loop open" : "Awaiting editorial review",
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

export async function confirmEarning(req: AuthedRequest, earningId: string) {
  const earning = (await EarningModel.findOne({ id: earningId }).lean()) as any;
  if (!earning) {
    throw new AppError(404, "Earning not found.", "NOT_FOUND");
  }
  if (earning.status !== "PENDING") {
    throw new AppError(
      409,
      `Cannot confirm earning in status ${earning.status}. Must be PENDING.`,
      "INVALID_STATUS",
    );
  }

  await EarningModel.findOneAndUpdate(
    { id: earningId },
    { $set: { status: "CONFIRMED", updatedAt: new Date() } },
    { returnDocument: "after" },
  ).lean();

  await audit(req, "earning.confirm", "earning", earningId, {
    assistantId: earning.assistantId,
    period: earning.period,
    amount: earning.amount,
  });

  return EarningModel.findOne({ id: earningId }).lean() as any;
}

export async function markPaidEarning(req: AuthedRequest, earningId: string, reason?: string) {
  const earning = (await EarningModel.findOne({ id: earningId }).lean()) as any;
  if (!earning) {
    throw new AppError(404, "Earning not found.", "NOT_FOUND");
  }
  if (earning.status !== "CONFIRMED") {
    throw new AppError(
      409,
      `Cannot mark paid earning in status ${earning.status}. Must be CONFIRMED.`,
      "INVALID_STATUS",
    );
  }

  await EarningModel.findOneAndUpdate(
    { id: earningId },
    { $set: { status: "PAID", updatedAt: new Date() } },
    { returnDocument: "after" },
  ).lean();

  await audit(req, "earning.mark_paid", "earning", earningId, {
    assistantId: earning.assistantId,
    period: earning.period,
    amount: earning.amount,
    reason,
  });

  return EarningModel.findOne({ id: earningId }).lean() as any;
}

export async function voidEarning(req: AuthedRequest, earningId: string, reason: string) {
  const earning = (await EarningModel.findOne({ id: earningId }).lean()) as any;
  if (!earning) {
    throw new AppError(404, "Earning not found.", "NOT_FOUND");
  }
  if (earning.status === "VOIDED") {
    throw new AppError(
      409,
      `Cannot void earning already in status ${earning.status}.`,
      "INVALID_STATUS",
    );
  }

  await EarningModel.findOneAndUpdate(
    { id: earningId },
    { $set: { status: "VOIDED", updatedAt: new Date() } },
    { returnDocument: "after" },
  ).lean();

  await audit(req, "earning.void", "earning", earningId, {
    assistantId: earning.assistantId,
    period: earning.period,
    amount: earning.amount,
    reason,
  });

  return EarningModel.findOne({ id: earningId }).lean() as any;
}

export async function executeOverride(
  req: AuthedRequest,
  action: string,
  targetId: string | undefined,
  reason: string,
) {
  await audit(req, `admin.override.${action}`, "admin", targetId ?? "system", {
    reason,
    timestamp: new Date().toISOString(),
  });
  return { success: true, action, targetId, reason };
}
