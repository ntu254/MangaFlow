import {
  AuditEntryModel,
  ChapterModel,
  EarningModel,
  EarningItemModel,
  MaterialModel,
  NotificationModel,
  ProposalModel,
  RankingModel,
  SeriesModel,
  StudioCommentModel,
  SubmissionModel,
} from "../db/models.js";
import { AppError } from "../lib/http.js";
import { audit, broadcastNotification } from "./audit.service.js";
import type { AuthedRequest } from "../types.js";

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
  const earnings = await EarningModel.find({ assistantId })
    .sort({ period: -1, updatedAt: -1 })
    .lean();
  const items = await EarningItemModel.find({ assistantId }).sort({ createdAt: -1 }).lean();
  // Attach each month's approved-task line items so the assistant can see what
  // makes up their monthly total (flowchart AD).
  return earnings.map((earning: any) => ({
    ...earning,
    items: items.filter((item: any) => item.earningId === earning.id),
  }));
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
