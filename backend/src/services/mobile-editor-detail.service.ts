import { AppError } from "../lib/http.js";
import type { RequestActor } from "../types.js";
import {
  ChapterModel,
  MaterialModel,
  ProposalModel,
  PublicationModel,
  SeriesModel,
  StudioTaskModel,
  SubmissionModel,
} from "../db/models.js";
import { chapterReadiness } from "./chapter-readiness.service.js";
import { findChapterBlockingComments } from "./chapter-review.service.js";
import type {
  MobileWorkflowAction,
  MobileWorkflowActionDescriptor,
} from "../mobile/mobile-work-item.contract.js";

// Shared Editor projections used by both the mobile inbox and the detail
// endpoints. Capabilities and readiness come from canonical services; mobile
// never recomputes eligibility.

export function describeAction(input: {
  action: MobileWorkflowAction;
  enabled: boolean;
  disabledReason?: string | null;
  requiresConfirmation: boolean;
  requiresReason: boolean;
}): MobileWorkflowActionDescriptor {
  return {
    action: input.action,
    enabled: input.enabled,
    disabledReason: input.enabled ? null : (input.disabledReason ?? "Not available."),
    requiresConfirmation: input.requiresConfirmation,
    requiresReason: input.requiresReason,
  };
}

export interface EditorChapterContext {
  chapter: any;
  series: any;
  tasks: any[];
  submissions: any[];
  materials: any[];
  blockingComments: any[];
  readiness: ReturnType<typeof chapterReadiness>;
}

export async function loadEditorChapterContext(chapter: any): Promise<EditorChapterContext> {
  const chapterId = chapter.id;
  const pageIds = (chapter.pages ?? []).map((page: any) => page.id).filter(Boolean);
  const [series, tasks, submissions, materials] = await Promise.all([
    SeriesModel.findOne({ id: chapter.seriesId }).lean(),
    StudioTaskModel.find({ chapterId }).lean(),
    SubmissionModel.find({ chapterId }).lean(),
    MaterialModel.find({
      $and: [
        { $or: [{ chapterId }, { pageId: { $in: pageIds } }] },
        { $or: [{ fileKey: { $exists: true, $ne: "" } }, { url: { $exists: true, $ne: "" } }] },
      ],
    }).lean(),
  ]);
  // All blocking comments authored by the assigned Tantou, including RESOLVED
  // ones. This doubles as the review-screen display list, so RESOLVED
  // comments must stay visible for COMMENT_REOPEN — chapterReadiness's
  // allCommentsResolved check already treats a RESOLVED comment as passing,
  // so including it here does not change the readiness result.
  const blockingComments = await findChapterBlockingComments(chapter, tasks, submissions, []);
  const readiness = chapterReadiness(chapter, blockingComments, tasks, submissions, materials);
  return { chapter, series, tasks, submissions, materials, blockingComments, readiness };
}

function isAssignedTantou(actor: RequestActor, series: any): boolean {
  return Boolean(series) && series.editorId === actor.id;
}

function readinessSummary(readiness: ReturnType<typeof chapterReadiness>): string {
  const failed = readiness.items.filter((item) => !item.passed).map((item) => item.reason);
  return failed.length > 0 ? failed.join(" ") : "Chapter is ready.";
}

// Chapter review actions for the TANTOU_REVIEW stage. Only the assigned Tantou
// acts; EDITOR_APPROVE mirrors the backend readiness result exactly.
export function chapterReviewActions(
  actor: RequestActor,
  context: EditorChapterContext,
): MobileWorkflowActionDescriptor[] {
  const assigned = isAssignedTantou(actor, context.series);
  const notAssigned = "You are not the assigned Tantou for this series.";
  const approveReason = !assigned ? notAssigned : readinessSummary(context.readiness);
  return [
    describeAction({
      action: "REQUEST_REVISION",
      enabled: assigned,
      disabledReason: notAssigned,
      requiresConfirmation: true,
      requiresReason: true,
    }),
    describeAction({
      action: "REJECT",
      enabled: assigned,
      disabledReason: notAssigned,
      requiresConfirmation: true,
      requiresReason: true,
    }),
    describeAction({
      action: "EDITOR_APPROVE",
      enabled: assigned && context.readiness.ready,
      disabledReason: approveReason,
      requiresConfirmation: true,
      requiresReason: false,
    }),
  ];
}

// Publication actions for the READY_FOR_PUBLICATION stage, derived from the
// current Publication record.
export function chapterPublicationActions(
  actor: RequestActor,
  series: any,
  publication: any,
): MobileWorkflowActionDescriptor[] {
  const assigned = isAssignedTantou(actor, series);
  const notAssigned = "You are not the assigned Tantou for this series.";
  const scheduled = publication?.status === "SCHEDULED";
  const futureScheduled =
    scheduled && publication?.scheduledAt && new Date(publication.scheduledAt) > new Date();
  return [
    describeAction({
      action: "SCHEDULE",
      enabled: assigned,
      disabledReason: notAssigned,
      requiresConfirmation: true,
      requiresReason: false,
    }),
    describeAction({
      action: "POSTPONE",
      enabled: assigned && scheduled,
      disabledReason: !assigned ? notAssigned : "Nothing is scheduled to postpone.",
      requiresConfirmation: true,
      requiresReason: false,
    }),
    describeAction({
      action: "PUBLISH",
      enabled: assigned && !futureScheduled,
      disabledReason: !assigned
        ? notAssigned
        : "Publication is scheduled for a future date; postpone first to publish now.",
      requiresConfirmation: true,
      requiresReason: false,
    }),
  ];
}

export function readinessBlockers(
  readiness: ReturnType<typeof chapterReadiness>,
): Array<{ code: string; label: string; detail: string }> {
  return readiness.items
    .filter((item) => !item.passed)
    .map((item) => ({ code: item.key, label: humanizeKey(item.key), detail: item.reason }));
}

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}

// ---------------------------------------------------------------------------
// Detail projections
// ---------------------------------------------------------------------------

export async function getEditorChapterDetail(actor: RequestActor, chapterId: string) {
  if (actor.role !== "EDITOR") {
    throw new AppError(403, "Editor permission is required.", "FORBIDDEN");
  }
  const chapter = (await ChapterModel.findOne({ id: chapterId }).lean()) as any;
  if (!chapter) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");
  const context = await loadEditorChapterContext(chapter);
  const publication = (await PublicationModel.findOne({ chapterId }).lean()) as any;

  const inPublication = chapter.status === "READY_FOR_PUBLICATION" || chapter.status === "PUBLISHED";
  const actions = inPublication
    ? chapterPublicationActions(actor, context.series, publication)
    : chapterReviewActions(actor, context);

  return {
    chapter: {
      id: chapter.id,
      seriesId: chapter.seriesId,
      title: chapter.title ?? `Chapter ${chapter.number}`,
      number: chapter.number,
      status: chapter.status,
      version: typeof chapter.number === "number" ? chapter.number : null,
    },
    series: {
      id: context.series?.id ?? chapter.seriesId,
      title: context.series?.title ?? "",
      editorId: context.series?.editorId ?? null,
    },
    pages: (chapter.pages ?? []).map((page: any) => ({
      id: page.id,
      pageNumber: page.pageNumber ?? page.number ?? null,
      status: page.status ?? "UNKNOWN",
      thumbnailFileKey: page.thumbnailFileKey ?? page.fileKey ?? undefined,
    })),
    readiness: context.readiness,
    blockers: context.blockingComments.map((comment: any) => ({
      id: comment.id,
      status: comment.status,
      body: comment.body ?? "",
      targetType: comment.targetType ?? "CHAPTER",
      targetId: comment.targetId ?? comment.chapterId ?? chapter.id,
    })),
    evidence: {
      taskCount: context.tasks.length,
      currentSubmissionCount: context.submissions.filter(
        (submission: any) => submission.status === "MANGAKA_APPROVED",
      ).length,
    },
    publication: publication
      ? { status: publication.status, scheduledAt: publication.scheduledAt ?? null }
      : null,
    actions,
  };
}

// Proposal action descriptors mirror the Editor inbox capability rules.
export function proposalActions(
  actor: RequestActor,
  proposal: any,
): MobileWorkflowActionDescriptor[] {
  const claimedByOther =
    proposal.claimedByEditorId != null && proposal.claimedByEditorId !== actor.id;
  const claimedByMe = proposal.claimedByEditorId === actor.id;
  const claimReason = claimedByOther
    ? `Claimed by ${proposal.claimedByEditorName ?? "another editor"}.`
    : "Claim this proposal first.";
  return [
    describeAction({
      action: "CLAIM",
      enabled: !claimedByMe && !claimedByOther,
      disabledReason: claimedByMe ? "You already claimed this proposal." : claimReason,
      requiresConfirmation: true,
      requiresReason: false,
    }),
    describeAction({
      action: "REQUEST_CHANGES",
      enabled: claimedByMe,
      disabledReason: claimReason,
      requiresConfirmation: true,
      requiresReason: true,
    }),
    describeAction({
      action: "REJECT",
      enabled: claimedByMe,
      disabledReason: claimReason,
      requiresConfirmation: true,
      requiresReason: true,
    }),
    describeAction({
      action: "FORWARD",
      enabled: claimedByMe,
      disabledReason: claimReason,
      requiresConfirmation: true,
      requiresReason: false,
    }),
  ];
}

export async function getEditorProposalDetail(actor: RequestActor, proposalId: string) {
  if (actor.role !== "EDITOR") {
    throw new AppError(403, "Editor permission is required.", "FORBIDDEN");
  }
  const proposal = await ProposalModel.findOne({ id: proposalId }).lean();
  if (!proposal) throw new AppError(404, "Proposal not found.", "PROPOSAL_NOT_FOUND");
  const value = proposal as any;
  const manuscripts = value.manuscripts ?? [];
  const currentManuscript = manuscripts[manuscripts.length - 1] ?? null;

  return {
    proposal: {
      id: value.id,
      title: value.title,
      status: value.status,
      synopsis: value.synopsis ?? "",
      logline: value.logline ?? "",
      targetAudience: value.targetAudience ?? null,
      genres: value.genres ?? [],
      requestedPublicationType: value.requestedPublicationType ?? "MONTHLY",
    },
    claim: {
      claimedByEditorId: value.claimedByEditorId ?? null,
      claimedByEditorName: value.claimedByEditorName ?? null,
      claimedByMe: value.claimedByEditorId === actor.id,
    },
    currentManuscript: currentManuscript
      ? {
          id: currentManuscript.id ?? `${value.id}-manuscript`,
          version: currentManuscript.version ?? manuscripts.length,
          status: currentManuscript.status ?? "SUBMITTED",
        }
      : null,
    version: currentManuscript?.version ?? (manuscripts.length || null),
    editorialChecklist: value.editorialChecklist ?? null,
    history: (value.history ?? []).map((event: any) => ({
      id: event.id,
      type: event.type,
      fromStatus: event.fromStatus ?? null,
      toStatus: event.toStatus ?? null,
      actorName: event.actorName ?? null,
      comment: event.comment ?? null,
      createdAt: event.createdAt ?? null,
    })),
    actions: proposalActions(actor, {
      claimedByEditorId: value.claimedByEditorId,
      claimedByEditorName: value.claimedByEditorName,
    }),
  };
}
