import { AppError } from "../lib/http.js";
import type { RequestActor } from "../types.js";
import {
  mobileInboxSchema,
  type MobileInbox,
  type MobileWorkItem,
  type MobileWorkflowActionDescriptor,
} from "../mobile/mobile-work-item.contract.js";
import { editorReviewQueue, boardQueue } from "./workflow.service.js";
import {
  ChapterModel,
  PublicationModel,
  SeriesModel,
  StudioCommentModel,
} from "../db/models.js";
import {
  chapterPublicationActions,
  chapterReviewActions,
  loadEditorChapterContext,
  readinessBlockers,
} from "./mobile-editor-detail.service.js";

// Foundation slice: Editor Today shows proposal review work; Board Today shows
// vote work. Later plans extend these projections with chapter/comment/publication
// and finalize/re-vote/at-risk items. Capabilities are derived here from the
// canonical queue data — mobile never recomputes eligibility.

type ActionInput = Omit<MobileWorkflowActionDescriptor, "disabledReason"> & {
  disabledReason?: string | null;
};

function action(input: ActionInput): MobileWorkflowActionDescriptor {
  return {
    action: input.action,
    enabled: input.enabled,
    // Contract invariant: enabled => null reason; disabled => non-empty reason.
    disabledReason: input.enabled ? null : (input.disabledReason ?? "Not available."),
    requiresConfirmation: input.requiresConfirmation,
    requiresReason: input.requiresReason,
  };
}

function proposalWorkItem(actor: RequestActor, proposal: any): MobileWorkItem {
  const claimedByOther =
    proposal.claimedByEditorId != null && proposal.claimedByEditorId !== actor.id;
  const claimedByMe = proposal.claimedByEditorId === actor.id;
  const claimedReason = claimedByOther
    ? `Claimed by ${proposal.claimedByEditorName ?? "another editor"}.`
    : "Claim this proposal first.";
  const seriesStatus = String(proposal.series?.status ?? "");
  const isRevision = seriesStatus === "REVISION_REQUESTED";

  return {
    id: `PROPOSAL_REVIEW:${proposal.id}`,
    kind: "PROPOSAL_REVIEW",
    entityType: "PROPOSAL",
    entityId: String(proposal.id),
    status: seriesStatus || "EDITOR_REVIEW",
    version: proposal.manuscript?.version ?? null,
    title: String(proposal.series?.title ?? proposal.id),
    subtitle: `Manuscript v${proposal.manuscript?.version ?? 1}`,
    priority: {
      level: proposal.priority === "high" ? "HIGH" : "NORMAL",
      reason: isRevision
        ? "Revision received"
        : proposal.claimStatus === "AVAILABLE"
          ? "Awaiting editor claim"
          : "In your review",
      dueAt: null,
    },
    blockers: [],
    actions: [
      action({
        action: "CLAIM",
        enabled: !claimedByMe && !claimedByOther,
        disabledReason: claimedByMe ? "You already claimed this proposal." : claimedReason,
        requiresConfirmation: true,
        requiresReason: false,
      }),
      action({
        action: "REQUEST_CHANGES",
        enabled: claimedByMe,
        disabledReason: claimedReason,
        requiresConfirmation: true,
        requiresReason: true,
      }),
      action({
        action: "REJECT",
        enabled: claimedByMe,
        disabledReason: claimedReason,
        requiresConfirmation: true,
        requiresReason: true,
      }),
      action({
        action: "FORWARD",
        enabled: claimedByMe,
        disabledReason: claimedReason,
        requiresConfirmation: true,
        requiresReason: false,
      }),
    ],
    summary: {
      claimStatus: proposal.claimStatus,
      requestedPublicationType: proposal.series?.requestedPublicationType ?? null,
    },
  };
}

// A vote item is votable only when an active voting session backs it. Board
// proposals with no open session (or a tie-break awaiting a fresh re-vote) are
// not surfaced as votable work here, so every emitted item carries the session
// version used for optimistic concurrency.
function isProposalVoteItem(item: any): boolean {
  return (
    item.seriesStatus !== "AT_RISK" &&
    item.voteSummary != null &&
    item.votingSessionId != null &&
    typeof item.expectedVersion === "number" &&
    item.decisionStatus !== "TIE_BREAK_REQUIRED"
  );
}

function boardVoteWorkItem(_actor: RequestActor, item: any): MobileWorkItem {
  const summary = item.voteSummary ?? {};
  return {
    id: `BOARD_VOTE:${item.id}`,
    kind: "BOARD_VOTE",
    entityType: "VOTING_SESSION",
    entityId: String(item.votingSessionId),
    status: String(item.decisionStatus ?? "PENDING"),
    version: item.expectedVersion,
    title: String(item.seriesTitle ?? item.title ?? item.id),
    subtitle: `Approve ${summary.approve ?? 0} · Reject ${summary.reject ?? 0} of ${summary.eligible ?? item.eligibleBoardCount ?? 0}`,
    priority: {
      level: "HIGH",
      reason: "Board vote pending",
      dueAt: null,
    },
    blockers: [],
    actions: [
      action({
        action: "VOTE",
        enabled: true,
        requiresConfirmation: true,
        requiresReason: false,
      }),
    ],
    summary: {
      quorum: summary.quorum ?? item.quorum ?? null,
      eligible: summary.eligible ?? item.eligibleBoardCount ?? null,
    },
  };
}

async function chapterReviewWorkItem(actor: RequestActor, chapter: any): Promise<MobileWorkItem> {
  const context = await loadEditorChapterContext(chapter);
  return {
    id: `CHAPTER_REVIEW:${chapter.id}`,
    kind: "CHAPTER_REVIEW",
    entityType: "CHAPTER",
    entityId: String(chapter.id),
    status: String(chapter.status),
    version: typeof chapter.number === "number" ? chapter.number : null,
    title: chapter.title ? String(chapter.title) : `Chapter ${chapter.number}`,
    subtitle: context.readiness.ready ? "Ready to approve" : "Blocked",
    priority: {
      level: context.readiness.ready ? "HIGH" : "NORMAL",
      reason: context.readiness.ready ? "Ready for your approval" : "Awaiting readiness",
      dueAt: null,
    },
    blockers: readinessBlockers(context.readiness),
    actions: chapterReviewActions(actor, context),
    summary: { seriesId: chapter.seriesId, ready: context.readiness.ready },
  };
}

async function publicationWorkItem(actor: RequestActor, chapter: any): Promise<MobileWorkItem> {
  const [series, publication] = await Promise.all([
    SeriesModel.findOne({ id: chapter.seriesId }).lean(),
    PublicationModel.findOne({ chapterId: chapter.id }).lean(),
  ]);
  const status = (publication as any)?.status ?? "DRAFT";
  return {
    id: `PUBLICATION:${chapter.id}`,
    kind: "PUBLICATION",
    entityType: "CHAPTER",
    entityId: String(chapter.id),
    status: String(status),
    version: typeof chapter.number === "number" ? chapter.number : null,
    title: chapter.title ? String(chapter.title) : `Chapter ${chapter.number}`,
    subtitle: status === "SCHEDULED" ? "Scheduled" : "Ready to schedule",
    priority: { level: "NORMAL", reason: "Publication decision", dueAt: null },
    blockers: [],
    actions: chapterPublicationActions(actor, series, publication),
    summary: {
      scheduledAt: (publication as any)?.scheduledAt
        ? new Date((publication as any).scheduledAt).toISOString()
        : null,
    },
  };
}

function commentReviewWorkItem(_actor: RequestActor, comment: any): MobileWorkItem {
  const canResolve = comment.status === "ADDRESSED";
  const canReopen = comment.status === "RESOLVED";
  return {
    id: `COMMENT_REVIEW:${comment.id}`,
    kind: "COMMENT_REVIEW",
    entityType: "COMMENT",
    entityId: String(comment.id),
    status: String(comment.status),
    version: null,
    title: "Blocking comment",
    subtitle: (comment.body ?? "").slice(0, 80) || "Blocking comment",
    priority: { level: "HIGH", reason: "Blocking comment needs verification", dueAt: null },
    blockers: [],
    actions: [
      {
        action: "COMMENT_RESOLVE",
        enabled: canResolve,
        disabledReason: canResolve ? null : "Comment is not awaiting resolution.",
        requiresConfirmation: true,
        requiresReason: false,
      },
      {
        action: "COMMENT_REOPEN",
        enabled: canReopen,
        disabledReason: canReopen ? null : "Only a resolved comment can be reopened.",
        requiresConfirmation: true,
        requiresReason: false,
      },
    ],
    summary: { targetType: comment.targetType ?? "CHAPTER" },
  };
}

export async function getEditorMobileInbox(actor: RequestActor): Promise<MobileInbox> {
  if (actor.role !== "EDITOR") {
    throw new AppError(403, "Editor permission is required.", "FORBIDDEN");
  }
  const proposals = await editorReviewQueue();

  // Chapters for series this Editor is the assigned Tantou on.
  const editorSeries = await SeriesModel.find({ editorId: actor.id }).select({ id: 1 }).lean();
  const seriesIds = editorSeries.map((series: any) => series.id);
  const chapters = seriesIds.length
    ? await ChapterModel.find({
        seriesId: { $in: seriesIds },
        status: { $in: ["TANTOU_REVIEW", "READY_FOR_PUBLICATION"] },
      })
        .sort({ updatedAt: -1 })
        .lean()
    : [];
  const reviewChapters = chapters.filter((chapter: any) => chapter.status === "TANTOU_REVIEW");
  const publishChapters = chapters.filter(
    (chapter: any) => chapter.status === "READY_FOR_PUBLICATION",
  );

  // Unresolved blocking comments this Editor authored that await verification.
  const blockingComments = await StudioCommentModel.find({
    authorId: actor.id,
    $or: [{ isBlocking: true }, { blocking: true }],
    status: { $in: ["ADDRESSED", "RESOLVED"] },
  })
    .sort({ updatedAt: -1 })
    .lean();

  const [chapterItems, publicationItems] = await Promise.all([
    Promise.all(reviewChapters.map((chapter: any) => chapterReviewWorkItem(actor, chapter))),
    Promise.all(publishChapters.map((chapter: any) => publicationWorkItem(actor, chapter))),
  ]);

  const items: MobileWorkItem[] = [
    ...proposals.map((proposal) => proposalWorkItem(actor, proposal)),
    ...chapterItems,
    ...blockingComments.map((comment: any) => commentReviewWorkItem(actor, comment)),
    ...publicationItems,
  ];

  return mobileInboxSchema.parse({
    role: "EDITOR",
    generatedAt: new Date().toISOString(),
    items,
  });
}

export async function getBoardMobileInbox(actor: RequestActor): Promise<MobileInbox> {
  if (actor.role !== "BOARD") {
    throw new AppError(403, "Board permission is required.", "FORBIDDEN");
  }
  const items = await boardQueue();
  return mobileInboxSchema.parse({
    role: "BOARD",
    generatedAt: new Date().toISOString(),
    items: items.filter(isProposalVoteItem).map((item) => boardVoteWorkItem(actor, item)),
  });
}
