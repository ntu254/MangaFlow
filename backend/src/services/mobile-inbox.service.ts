import { AppError } from "../lib/http.js";
import type { RequestActor } from "../types.js";
import {
  mobileInboxSchema,
  type MobileInbox,
  type MobileWorkItem,
  type MobileWorkflowActionDescriptor,
} from "../mobile/mobile-work-item.contract.js";
import { editorReviewQueue } from "./workflow.service.js";
import {
  ChapterModel,
  PublicationModel,
  RankingModel,
  SeriesModel,
  StudioCommentModel,
  StudioRegionModel,
  StudioTaskModel,
  SubmissionModel,
  VotingSessionModel,
} from "../db/models.js";
import { actorSeriesScopeFilter } from "./authorization.service.js";
import {
  chapterPublicationActions,
  chapterReviewActions,
  loadEditorChapterContext,
  readinessBlockers,
} from "./mobile-editor-detail.service.js";
import {
  boardChairActions,
  boardVoteActions,
  loadBoardSessionContext,
  type BoardSessionContext,
} from "./mobile-board-detail.service.js";

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
        action: "RELEASE_CLAIM",
        enabled: claimedByMe,
        disabledReason: claimedByMe
          ? null
          : claimedByOther
            ? "Only the Editor who owns the claim can release it."
            : "This proposal has no active claim.",
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
function boardVoteWorkItem(
  actor: RequestActor,
  session: any,
  ctx: BoardSessionContext,
): MobileWorkItem {
  const isReVote = Boolean(session.reVoteOfSessionId);
  return {
    id: `${isReVote ? "BOARD_REVOTE" : "BOARD_VOTE"}:${session.id}`,
    kind: isReVote ? "BOARD_REVOTE" : "BOARD_VOTE",
    entityType: "VOTING_SESSION",
    entityId: String(session.id),
    status: String(session.status),
    version: typeof session.version === "number" ? session.version : null,
    title: String(session.title ?? session.proposalId ?? session.id),
    subtitle: `Approve ${ctx.tally.approve} · Reject ${ctx.tally.reject} of ${ctx.eligibleVoterIds.length}`,
    priority: {
      level: isReVote ? "URGENT" : "HIGH",
      reason: isReVote ? "Fresh re-vote after a tie" : "Board vote pending",
      dueAt: null,
    },
    blockers: [],
    actions: boardVoteActions(actor, ctx),
    summary: { quorum: ctx.quorum, eligible: ctx.eligibleVoterIds.length, isReVote },
  };
}

function sessionFinalizeWorkItem(
  actor: RequestActor,
  session: any,
  ctx: BoardSessionContext,
): MobileWorkItem {
  return {
    id: `SESSION_FINALIZE:${session.id}`,
    kind: "SESSION_FINALIZE",
    entityType: "VOTING_SESSION",
    entityId: String(session.id),
    status: String(session.status),
    version: typeof session.version === "number" ? session.version : null,
    title: String(session.title ?? session.proposalId ?? session.id),
    subtitle: ctx.canFinalize ? "Ready to finalize" : "Awaiting quorum",
    priority: {
      level: ctx.canFinalize ? "HIGH" : "NORMAL",
      reason: ctx.canFinalize ? "Decision ready to finalize" : "Awaiting votes",
      dueAt: null,
    },
    blockers: [],
    actions: boardChairActions(actor, ctx),
    summary: { canFinalize: ctx.canFinalize },
  };
}

function atRiskWorkItem(_actor: RequestActor, ranking: any): MobileWorkItem {
  return {
    id: `AT_RISK:${ranking.id}`,
    kind: "AT_RISK",
    entityType: "RANKING",
    entityId: String(ranking.id),
    status: String(ranking.status ?? "AT_RISK"),
    version: null,
    title: String(ranking.seriesTitle ?? ranking.seriesId ?? ranking.id),
    subtitle: `Rank ${ranking.rank ?? "?"} · score ${ranking.finalScore ?? ranking.readerScore ?? "?"}`,
    priority: { level: "URGENT", reason: "At-risk series needs a Board decision", dueAt: null },
    blockers: [],
    actions: [
      action({
        action: "AT_RISK_DECIDE",
        enabled: true,
        requiresConfirmation: true,
        requiresReason: true,
      }),
    ],
    summary: { seriesId: ranking.seriesId ?? null },
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
    version: null,
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
    chapterContext: {
      seriesId: String(chapter.seriesId),
      seriesTitle: String((series as any).title),
      chapterId: String(chapter.id),
      chapterNumber: Number(chapter.number),
      chapterTitle: String(chapter.title),
    },
  };
}

// Resolves the chapter a blocking comment belongs to so mobile can route
// straight into that chapter's review screen instead of a dead end. Comments
// created without an explicit chapterId (page/region/task/submission targets)
// are resolved through their target's own chapterId.
async function resolveCommentChapterId(comment: any): Promise<string | null> {
  if (comment.chapterId) return String(comment.chapterId);
  if (comment.taskId) {
    const task = await StudioTaskModel.findOne({ id: comment.taskId })
      .select({ chapterId: 1 })
      .lean();
    if ((task as any)?.chapterId) return String((task as any).chapterId);
  }
  if (comment.regionId) {
    const region = await StudioRegionModel.findOne({ id: comment.regionId })
      .select({ chapterId: 1 })
      .lean();
    if ((region as any)?.chapterId) return String((region as any).chapterId);
  }
  if (comment.targetType === "SUBMISSION" && comment.targetId) {
    const submission = await SubmissionModel.findOne({ id: comment.targetId })
      .select({ chapterId: 1 })
      .lean();
    if ((submission as any)?.chapterId) return String((submission as any).chapterId);
  }
  if (comment.pageId) {
    const chapter = await ChapterModel.findOne({ "pages.id": comment.pageId })
      .select({ id: 1 })
      .lean();
    if ((chapter as any)?.id) return String((chapter as any).id);
  }
  return null;
}

async function commentReviewWorkItem(_actor: RequestActor, comment: any): Promise<MobileWorkItem> {
  const canResolve = comment.status === "ADDRESSED";
  const canReopen = comment.status === "RESOLVED";
  const chapterId = await resolveCommentChapterId(comment);
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
    summary: { targetType: comment.targetType ?? "CHAPTER", chapterId },
  };
}

export async function getEditorMobileInbox(actor: RequestActor): Promise<MobileInbox> {
  if (actor.role !== "EDITOR") {
    throw new AppError(403, "Editor permission is required.", "FORBIDDEN");
  }
  const proposals = await editorReviewQueue();

  // Chapters for series this Editor is the assigned Tantou on.
  const editorSeries = await SeriesModel.find(await actorSeriesScopeFilter(actor, "read"))
    .select({ id: 1 })
    .lean();
  const seriesIds = editorSeries.map((series: any) => series.id);
  const [chapters, scopedChapters, scopedTasks] = seriesIds.length
    ? await Promise.all([
        ChapterModel.find({
          seriesId: { $in: seriesIds },
          status: { $in: ["TANTOU_REVIEW", "READY_FOR_PUBLICATION"] },
        })
          .sort({ updatedAt: -1 })
          .lean(),
        ChapterModel.find({ seriesId: { $in: seriesIds } }).select({ id: 1, pages: 1 }).lean(),
        StudioTaskModel.find({ seriesId: { $in: seriesIds } }).select({ id: 1 }).lean(),
      ])
    : [[], [], []];
  const reviewChapters = chapters.filter((chapter: any) => chapter.status === "TANTOU_REVIEW");
  const publishChapters = chapters.filter(
    (chapter: any) => chapter.status === "READY_FOR_PUBLICATION",
  );

  const scopedChapterIds = scopedChapters.map((chapter: any) => chapter.id);
  const scopedPageIds = scopedChapters.flatMap((chapter: any) =>
    ((chapter.pages ?? []) as any[]).map((page) => page?.id).filter(Boolean),
  );
  const scopedTaskIds = scopedTasks.map((task: any) => task.id);

  // Unresolved blocking comments in the Editor's active Tantou scope that
  // await verification. The author is intentionally not filtered: after a
  // Tantou replacement, blockers created by the previous Editor remain part
  // of the current Series workload.
  const blockingComments = await StudioCommentModel.find({
    $and: [
      {
        $or: [
          { seriesId: { $in: seriesIds } },
          { chapterId: { $in: scopedChapterIds } },
          { pageId: { $in: scopedPageIds } },
          {
            targetType: "CHAPTER",
            targetId: { $in: scopedChapterIds },
          },
          { targetType: "PAGE", targetId: { $in: scopedPageIds } },
          { taskId: { $in: scopedTaskIds } },
          { targetType: "TASK", targetId: { $in: scopedTaskIds } },
        ],
      },
      { $or: [{ isBlocking: true }, { blocking: true }] },
    ],
    status: { $in: ["ADDRESSED", "RESOLVED"] },
  })
    .sort({ updatedAt: -1 })
    .lean();

  const [chapterItems, publicationItems, commentItems] = await Promise.all([
    Promise.all(reviewChapters.map((chapter: any) => chapterReviewWorkItem(actor, chapter))),
    Promise.all(publishChapters.map((chapter: any) => publicationWorkItem(actor, chapter))),
    Promise.all(blockingComments.map((comment: any) => commentReviewWorkItem(actor, comment))),
  ]);

  const items: MobileWorkItem[] = [
    ...proposals.map((proposal) => proposalWorkItem(actor, proposal)),
    ...chapterItems,
    ...commentItems,
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
  const chair = actor.isChair === true;

  // Active voting work comes from VotingSession (source of truth), not the
  // proposal projection: OPEN sessions accept votes; TIED sessions are a closed
  // round whose fresh re-vote is a separate OPEN session.
  const sessions = await VotingSessionModel.find({
    targetType: "PROPOSAL",
    status: "OPEN",
  })
    .sort({ updatedAt: -1 })
    .lean();

  const items: MobileWorkItem[] = [];
  for (const session of sessions) {
    const ctx = await loadBoardSessionContext(actor, session);
    items.push(boardVoteWorkItem(actor, session, ctx));
    // Chair also sees a finalization item for the same session.
    if (chair) items.push(sessionFinalizeWorkItem(actor, session, ctx));
  }

  // At-risk decisions are a manual Chair responsibility.
  if (chair) {
    const atRisk = await RankingModel.find({
      $or: [{ atRisk: true }, { status: "AT_RISK" }],
    })
      .sort({ updatedAt: -1 })
      .lean();
    for (const ranking of atRisk) items.push(atRiskWorkItem(actor, ranking));
  }

  return mobileInboxSchema.parse({
    role: "BOARD",
    generatedAt: new Date().toISOString(),
    items,
  });
}
