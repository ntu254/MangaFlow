import {
  ChapterModel,
  EarningItemModel,
  MaterialModel,
  ProposalModel,
  ProposalVoteModel,
  PublicationModel,
  SeriesModel,
  StudioCommentModel,
  StudioRegionModel,
  StudioTaskModel,
  SubmissionModel,
  VotingSessionModel,
  RankingModel,
  stripMongo,
} from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { apiToWebRole, canMutate } from "../domain/roles.js";
import { AppError } from "../lib/http.js";
import { audit, notifyMany } from "./audit.service.js";
import {
  EARNING_CURRENCY,
  earningIdFor,
  earningPeriodOf,
  recomputeAssistantEarning,
  resolveTaskRate,
} from "./earning.service.js";
import type {
  AuthedRequest,
  ChapterAction,
  ChapterStatus,
  ProposalAction,
  ProposalStatus,
  RequestActor,
  VoteDecision,
} from "../types.js";

function configuredBoardQuorum() {
  const raw = Number(process.env.BOARD_QUORUM ?? 3);
  if (!Number.isFinite(raw) || raw < 2) return 3;
  return Math.min(Math.floor(raw), BOARD_TOTAL);
}

export const BOARD_TOTAL = 5;
export const BOARD_QUORUM = configuredBoardQuorum();
export const EIC_TIEBREAK_WEIGHT = 2;

function lowerRole(actor: RequestActor) {
  return apiToWebRole[actor.role];
}

function ensureActor(req: AuthedRequest) {
  if (!req.actor) throw new AppError(401, "Missing authenticated user.", "MISSING_AUTH");
  return req.actor;
}

function requireMutationRole(actor: RequestActor, roles: RequestActor["role"][]) {
  if (!canMutate(actor.role, roles)) {
    throw new AppError(403, "You do not have permission for this action.", "FORBIDDEN");
  }
}

function isAssignedAssistant(actor: RequestActor, task: any) {
  return actor.role === "ASSISTANT" && task.assigneeId === actor.id;
}

function assertTaskReadable(actor: RequestActor, task: any) {
  if (actor.role === "ASSISTANT" && task.assigneeId !== actor.id) {
    throw new AppError(403, "Task is not assigned to the current assistant.", "TASK_NOT_ASSIGNED");
  }
}

function assertTaskActionAllowed(actor: RequestActor, task: any, action: string) {
  const normalized = action.toUpperCase();
  const assistantActions = new Set([
    "START",
    "SUBMIT",
    "BLOCK",
    "MARK_BLOCKED",
    "UNBLOCK",
    "REOPEN",
  ]);
  const mangakaReviewActions = new Set([
    "REQUEST_REVISION",
    "APPROVE",
    "MANGAKA_APPROVE",
    "REJECT",
  ]);

  if (isAssignedAssistant(actor, task) && assistantActions.has(normalized)) return;
  if (normalized === "EDITOR_APPROVE") {
    requireMutationRole(actor, ["EDITOR"]);
    return;
  }
  if (normalized === "REASSIGN" || mangakaReviewActions.has(normalized)) {
    requireMutationRole(actor, ["MANGAKA", "EDITOR"]);
    return;
  }

  if (actor.role === "ASSISTANT" && task.assigneeId !== actor.id) {
    throw new AppError(403, "Task is not assigned to the current assistant.", "TASK_NOT_ASSIGNED");
  }
  if (actor.role === "ASSISTANT") {
    throw new AppError(403, "Assistants cannot perform this task action.", "FORBIDDEN");
  }
  requireMutationRole(actor, ["MANGAKA", "EDITOR"]);
}

function toObject<T>(doc: unknown) {
  return stripMongo(doc) as T;
}

function cadenceFromPublicationType(value: unknown) {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized === "WEEKLY") return "weekly";
  return "monthly";
}

function normalizePublicationType(value: unknown) {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized === "WEEKLY" || normalized === "MONTHLY") return normalized;
  return null;
}

function slugifySeries(input: string, fallback: string) {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug || fallback;
}

async function ensureProductionSeriesForApprovedProposal(proposal: any) {
  if (!proposal || proposal.status !== "APPROVED") return null;

  const existing: any = await SeriesModel.findOne({ proposalId: proposal.id }).lean();
  const seriesId = `s-${proposal.id}`;
  const seriesSlug = slugifySeries(String(proposal.slug || proposal.title || seriesId), seriesId);
  const pubSource = proposal.boardApprovedPublicationType ?? proposal.requestedPublicationType;
  const desiredPublicationType = normalizePublicationType(pubSource);
  const desiredCadence = cadenceFromPublicationType(pubSource);
  if (existing) {
    const patch: Record<string, unknown> = {};
    if (!existing.slug) patch.slug = seriesSlug;
    // The series may have been created earlier (e.g. on vote quorum) before the
    // Board picked a publication type at finalize — apply the chosen type/cadence.
    if (proposal.boardApprovedPublicationType) {
      patch.publicationType = desiredPublicationType;
      patch.cadence = desiredCadence;
    }
    if (Object.keys(patch).length > 0) {
      patch.updatedAt = nowIso();
      await SeriesModel.updateOne({ id: existing.id }, { $set: patch });
      return SeriesModel.findOne({ id: existing.id }).lean();
    }
    return existing;
  }

  const now = nowIso();
  const editorId = proposal.assignedEditorId ?? proposal.claimedByEditorId ?? "u-editor";
  const editorName = proposal.assignedEditorName ?? proposal.claimedByEditorName ?? "Tanaka Akira";

  const series = await SeriesModel.findOneAndUpdate(
    { proposalId: proposal.id },
    {
      $setOnInsert: {
        id: seriesId,
        slug: seriesSlug,
        title: proposal.title ?? "Untitled series",
        synopsis: proposal.synopsis ?? "",
        genres: Array.isArray(proposal.genres) ? proposal.genres : [],
        coverUrl: proposal.coverUrl ?? "",
        coverFileKey: proposal.coverFileKey,
        status: "ONGOING",
        visibility: "PRIVATE",
        publicationType: desiredPublicationType,
        cadence: desiredCadence,
        startDate: now,
        targetChapters: Number(proposal.chaptersPlanned ?? 12),
        authorId: proposal.authorId,
        authorName: proposal.authorName,
        editorId,
        editorName,
        assistantIds: [],
        proposalId: proposal.id,
        sourceProposalId: proposal.id,
      },
    },
    { upsert: true, returnDocument: "after" },
  ).lean();

  return series;
}

/** Lock a StudioRegion when a task becomes active. */
async function lockRegion(regionId: string | undefined, taskId: string) {
  if (!regionId) return;
  await StudioRegionModel.updateOne(
    { id: regionId },
    {
      $set: {
        activeTaskId: taskId,
        lockedByTaskId: taskId,
        lockedAt: new Date(),
        lockStatus: "LOCKED",
        updatedAt: nowIso(),
      },
    },
  );
}

/** Release lock on a StudioRegion when task finishes. */
async function releaseRegionLock(regionId: string | undefined, taskId: string) {
  if (!regionId) return;
  await StudioRegionModel.updateOne(
    { id: regionId, lockedByTaskId: taskId },
    {
      $set: {
        activeTaskId: null,
        lockStatus: "RELEASED",
        updatedAt: nowIso(),
      },
    },
  );
}

// ---------------------------------------------------------------------------
// Earning helpers
// ---------------------------------------------------------------------------

/**
 * Create an EarningItem after a task reaches EDITOR_APPROVED, priced from the
 * task-type rate table, then roll the assistant's monthly Earning up so their
 * income total reflects the new item. Uses upsert on taskId (unique sparse
 * index) for idempotency, so re-approving a task never double-pays.
 */
async function createEarningItemIfMissing(
  req: AuthedRequest,
  opts: {
    assistantId: string;
    taskId: string;
    submissionId?: string;
    seriesId?: string;
    chapterId?: string;
    taskType?: string;
  },
) {
  const now = new Date();
  const period = earningPeriodOf(now);
  const rate = resolveTaskRate(opts.taskType);

  const result = await EarningItemModel.findOneAndUpdate(
    { taskId: opts.taskId },
    {
      $setOnInsert: {
        id: id("eitem"),
        earningId: earningIdFor(opts.assistantId, period),
        assistantId: opts.assistantId,
        taskId: opts.taskId,
        submissionId: opts.submissionId,
        seriesId: opts.seriesId,
        chapterId: opts.chapterId,
        taskType: opts.taskType,
        period,
        rate,
        amount: rate,
        currency: EARNING_CURRENCY,
        status: "PENDING",
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: "after", includeResultMetadata: true },
  );

  // Only recompute + audit on an actual insert (not on match of existing doc),
  // so idempotent re-approval doesn't inflate the monthly total.
  if (result.lastErrorObject?.updatedExisting === false) {
    await recomputeAssistantEarning(opts.assistantId, period);
    await audit(req, "EARNING_ITEM_CREATED", "earning_item", result.value?.id ?? opts.taskId, {
      assistantId: opts.assistantId,
      taskId: opts.taskId,
      submissionId: opts.submissionId,
      seriesId: opts.seriesId,
      chapterId: opts.chapterId,
      period,
      rate,
      amount: rate,
      currency: EARNING_CURRENCY,
    });
  }
}

export function evaluateBoardTally(votes: any[]) {
  const approve = votes
    .filter((vote) => vote.decision === "APPROVE")
    .reduce((sum, vote) => sum + Number(vote.weight ?? 1), 0);
  const reject = votes
    .filter((vote) => vote.decision === "REJECT")
    .reduce((sum, vote) => sum + Number(vote.weight ?? 1), 0);
  const abstain = votes.filter((vote) => vote.decision === "ABSTAIN").length;
  const total = votes.length;

  if (approve >= BOARD_QUORUM)
    return {
      approve,
      reject,
      abstain,
      total,
      status: "APPROVED" as ProposalStatus,
      reason: `Quorum ${approve} APPROVE >= ${BOARD_QUORUM}.`,
    };
  if (reject >= BOARD_QUORUM)
    return {
      approve,
      reject,
      abstain,
      total,
      status: "REJECTED" as ProposalStatus,
      reason: `Quorum ${reject} REJECT >= ${BOARD_QUORUM}.`,
    };
  if (total >= BOARD_TOTAL) {
    if (approve > reject)
      return {
        approve,
        reject,
        abstain,
        total,
        status: "APPROVED" as ProposalStatus,
        reason: "All votes in: approve leads.",
      };
    if (reject > approve)
      return {
        approve,
        reject,
        abstain,
        total,
        status: "REJECTED" as ProposalStatus,
        reason: "All votes in: reject leads.",
      };
    return {
      approve,
      reject,
      abstain,
      total,
      status: "TIE_BREAK" as ProposalStatus,
      reason: "Split vote. Editor-in-chief tie-break required.",
    };
  }
  return {
    approve,
    reject,
    abstain,
    total,
    status: null,
    reason: `Waiting for more votes (${total}/${BOARD_TOTAL}).`,
  };
}

export function normalizeBoardVote(vote: any) {
  return {
    memberId: String(vote.memberId ?? vote.voterId ?? ""),
    memberName: String(vote.memberName ?? vote.voterName ?? ""),
    decision: vote.decision as VoteDecision,
    comment: vote.comment,
    createdAt: vote.createdAt ?? vote.votedAt ?? nowIso(),
    weight: Number(vote.weight ?? 1),
    isChair: Boolean(vote.isChair ?? false),
    isEditorInChief: Boolean(vote.isEditorInChief ?? false),
  };
}

function assertProposalAction(action: ProposalAction, actor: RequestActor, proposal: any) {
  switch (action) {
    case "SUBMIT":
    case "WITHDRAW":
    case "EDIT":
    case "RESUBMIT":
      if (actor.role !== "ADMIN" && !(actor.role === "MANGAKA" && proposal.authorId === actor.id)) {
        throw new AppError(
          403,
          "Only the proposal author or admin can change this proposal.",
          "FORBIDDEN",
        );
      }
      if (action === "EDIT" && !["DRAFT", "CHANGES_REQUESTED"].includes(proposal.status)) {
        throw new AppError(
          409,
          "Only draft or changes-requested proposals can be edited.",
          "INVALID_TRANSITION",
        );
      }
      return;
    case "CLAIM":
      requireMutationRole(actor, ["EDITOR"]);
      return;
    case "RELEASE_CLAIM":
    case "REASSIGN_CLAIM":
      if (actor.role !== "ADMIN" && !(actor.role === "EDITOR" && actor.isEditorInChief)) {
        throw new AppError(403, "Bạn không có quyền thực hiện thao tác này.", "FORBIDDEN");
      }
      return;
    case "REQUEST_CHANGES":
    case "FORWARD":
    case "REJECT":
      requireMutationRole(actor, ["EDITOR"]);
      if (proposal.claimedByEditorId && proposal.claimedByEditorId !== actor.id) {
        const isEic = actor.role === "EDITOR" && actor.isEditorInChief;
        const isAdmin = actor.role === "ADMIN";
        if (!isAdmin && !isEic) {
          throw new AppError(
            403,
            "Bạn không có quyền thực hiện thao tác này trên proposal đã được nhận bởi Editor khác.",
            "FORBIDDEN",
          );
        }
      }
      return;
    case "RECALL":
      requireMutationRole(actor, ["EDITOR"]);
      return;
    case "VOTE":
      if (proposal.status === "TIE_BREAK") {
        if (actor.role !== "ADMIN" && !(actor.role === "EDITOR" && actor.isEditorInChief)) {
          throw new AppError(
            403,
            "Editor-in-chief permission is required for tie-break votes.",
            "EIC_REQUIRED",
          );
        }
        return;
      }
      requireMutationRole(actor, ["BOARD"]);
      return;
    case "FORCE_STATUS":
      requireMutationRole(actor, ["BOARD", "ADMIN"]);
      return;
    case "ARCHIVE":
      requireMutationRole(actor, ["ADMIN"]);
      return;
    default:
      throw new AppError(400, `Invalid proposal action: ${action}`, "INVALID_ACTION");
  }
}

export async function applyProposalAction(
  req: AuthedRequest,
  proposalId: string,
  action: ProposalAction,
  payload: any = {},
) {
  const actor = ensureActor(req);
  const doc = await ProposalModel.findOne({ id: proposalId });
  if (!doc) throw new AppError(404, "Proposal not found.", "PROPOSAL_NOT_FOUND");

  const proposal = doc.toObject() as any;
  assertProposalAction(action, actor, proposal);

  const fromStatus = proposal.status as ProposalStatus;
  const event = {
    id: id("pe"),
    proposalId: proposal.id,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: lowerRole(actor),
    type: action,
    fromStatus,
    comment:
      payload.comment ?? payload.note ?? payload.feedbackSummary ?? payload.editorRecommendation,
    createdAt: nowIso(),
  };

  const notifications: { userId: string; kind: string; message: string }[] = [];
  const patch: Record<string, unknown> = { updatedAt: nowIso() };

  switch (action) {
    case "SUBMIT":
      if (proposal.status !== "DRAFT")
        throw new AppError(409, "Only draft proposals can be submitted.", "INVALID_TRANSITION");
      patch.status = "PENDING_EDITOR";
      patch.submittedAt = new Date();
      notifications.push({
        userId: "u-editor",
        kind: "proposal.submitted",
        message: `${proposal.title} is waiting for editor review.`,
      });
      await audit(req, "PROPOSAL_SUBMITTED", "proposal", proposalId, {
        fromStatus,
        toStatus: "PENDING_EDITOR",
      });
      break;

    case "CLAIM": {
      if (proposal.status !== "PENDING_EDITOR")
        throw new AppError(
          400,
          "Trạng thái hiện tại không cho phép thao tác này.",
          "INVALID_TRANSITION",
        );
      if (proposal.claimedByEditorId) {
        throw new AppError(409, "Item này vừa được Editor khác nhận review.", "CONFLICT");
      }

      const updatedDoc = await ProposalModel.findOneAndUpdate(
        {
          id: proposalId,
          status: "PENDING_EDITOR",
          $or: [{ claimedByEditorId: { $exists: false } }, { claimedByEditorId: null }],
        },
        {
          $set: {
            status: "EDITOR_REVIEWING",
            claimedByEditorId: actor.id,
            claimedByEditorName: actor.name,
            claimedAt: new Date(),
            reviewStartedAt: new Date(),
            assignedEditorId: actor.id,
            assignedEditorName: actor.name,
            updatedAt: nowIso(),
          },
          $push: {
            history: {
              ...event,
              toStatus: "EDITOR_REVIEWING",
            },
          },
        },
        { returnDocument: "after" },
      );

      if (!updatedDoc) {
        throw new AppError(409, "Item này vừa được Editor khác nhận review.", "CONFLICT");
      }

      await audit(req, "PROPOSAL_CLAIMED", "proposal", proposalId, {
        fromStatus,
        toStatus: "EDITOR_REVIEWING",
      });
      await notifyMany([
        {
          userId: proposal.authorId,
          kind: "proposal.claimed",
          message: `${actor.name} đã nhận review proposal "${proposal.title}".`,
        },
      ]);

      return toObject(updatedDoc.toObject());
    }

    case "RELEASE_CLAIM":
      if (!["PENDING_EDITOR", "EDITOR_REVIEWING"].includes(proposal.status)) {
        throw new AppError(
          400,
          "Trạng thái hiện tại không cho phép thao tác này.",
          "INVALID_TRANSITION",
        );
      }
      patch.status = "PENDING_EDITOR";
      patch.claimedByEditorId = null;
      patch.claimedByEditorName = null;
      patch.claimedAt = null;
      patch.reviewStartedAt = null;
      patch.assignedEditorId = null;
      patch.assignedEditorName = null;
      notifications.push({
        userId: proposal.authorId,
        kind: "proposal.claim_released",
        message: `Claim cho ${proposal.title} đã được giải phóng.`,
      });
      break;

    case "REASSIGN_CLAIM":
      if (!["PENDING_EDITOR", "EDITOR_REVIEWING"].includes(proposal.status)) {
        throw new AppError(
          400,
          "Trạng thái hiện tại không cho phép thao tác này.",
          "INVALID_TRANSITION",
        );
      }
      if (!payload.editorId || !payload.editorName) {
        throw new AppError(400, "editorId và editorName là bắt buộc.", "VALIDATION_ERROR");
      }
      patch.status = "EDITOR_REVIEWING";
      patch.claimedByEditorId = payload.editorId;
      patch.claimedByEditorName = payload.editorName;
      patch.claimedAt = new Date();
      patch.reviewStartedAt = new Date();
      patch.assignedEditorId = payload.editorId;
      patch.assignedEditorName = payload.editorName;
      notifications.push({
        userId: proposal.authorId,
        kind: "proposal.reassigned",
        message: `${proposal.title} đã được chuyển giao review cho ${payload.editorName}.`,
      });
      break;

    case "REQUEST_CHANGES": {
      if (!["PENDING_EDITOR", "EDITOR_REVIEWING", "RESUBMITTED"].includes(proposal.status))
        throw new AppError(
          409,
          "Changes can only be requested during editor review.",
          "INVALID_TRANSITION",
        );
      const comment = String(
        payload.comment ?? payload.revisionReason ?? payload.feedbackSummary ?? "",
      ).trim();
      if (!comment) throw new AppError(400, "Revision reason is required.", "VALIDATION_ERROR");
      const requestedChange = {
        id: id("rc"),
        editorId: actor.id,
        editorName: actor.name,
        comment,
        createdAt: nowIso(),
        items: comment
          .split(/\n+/)
          .map((text) => text.replace(/^[-*\d.)\s]+/, "").trim())
          .filter(Boolean)
          .map((text) => ({ id: id("rci"), text, resolved: false })),
      };
      patch.status = "CHANGES_REQUESTED";
      patch.claimedByEditorId = proposal.claimedByEditorId ?? actor.id;
      patch.claimedByEditorName = proposal.claimedByEditorName ?? actor.name;
      patch.assignedEditorId = proposal.claimedByEditorId ?? actor.id;
      patch.assignedEditorName = proposal.claimedByEditorName ?? actor.name;
      patch.requestedChanges = [...(proposal.requestedChanges ?? []), requestedChange];
      patch.revisionRound = Number(proposal.revisionRound ?? 0) + 1;
      notifications.push({
        userId: proposal.authorId,
        kind: "proposal.changes",
        message: `${proposal.title} needs revisions.`,
      });
      await audit(req, "PROPOSAL_CHANGES_REQUESTED", "proposal", proposalId, {
        fromStatus,
        toStatus: "CHANGES_REQUESTED",
      });
      break;
    }

    case "FORWARD":
      if (!["PENDING_EDITOR", "EDITOR_REVIEWING", "RESUBMITTED"].includes(proposal.status))
        throw new AppError(
          409,
          "Only editor-review proposals can be forwarded.",
          "INVALID_TRANSITION",
        );
      patch.status = "PENDING_BOARD";
      patch.claimedByEditorId = proposal.claimedByEditorId ?? actor.id;
      patch.claimedByEditorName = proposal.claimedByEditorName ?? actor.name;
      patch.assignedEditorId = proposal.claimedByEditorId ?? actor.id;
      patch.assignedEditorName = proposal.claimedByEditorName ?? actor.name;
      patch.editorForwardedAt = new Date();
      ["u-board", "u-board-2", "u-board-3", "u-board-4", "u-board-5"].forEach((userId) => {
        notifications.push({
          userId,
          kind: "proposal.board",
          message: `${proposal.title} is ready for Board vote.`,
        });
      });
      await audit(req, "PROPOSAL_FORWARDED_TO_BOARD", "proposal", proposalId, {
        fromStatus,
        toStatus: "PENDING_BOARD",
        editorId: actor.id,
      });
      break;

    case "REJECT":
      if (!["PENDING_EDITOR", "EDITOR_REVIEWING", "RESUBMITTED"].includes(proposal.status))
        throw new AppError(
          409,
          "Only editor-review proposals can be rejected.",
          "INVALID_TRANSITION",
        );
      if (!String(payload.comment ?? payload.rejectReason ?? "").trim())
        throw new AppError(400, "Reject reason is required.", "VALIDATION_ERROR");
      patch.status = "REJECTED";
      patch.rejectedAt = new Date();
      patch.rejectedById = actor.id;
      patch.claimedByEditorId = proposal.claimedByEditorId ?? actor.id;
      patch.claimedByEditorName = proposal.claimedByEditorName ?? actor.name;
      patch.assignedEditorId = proposal.claimedByEditorId ?? actor.id;
      patch.assignedEditorName = proposal.claimedByEditorName ?? actor.name;
      notifications.push({
        userId: proposal.authorId,
        kind: "proposal.rejected",
        message: `${proposal.title} was rejected during editor review.`,
      });
      break;

    case "RECALL":
      if (proposal.status !== "PENDING_BOARD")
        throw new AppError(409, "Only board proposals can be recalled.", "INVALID_TRANSITION");
      patch.status = "PENDING_EDITOR";
      patch.votes = [];
      break;

    case "VOTE": {
      if (!["PENDING_BOARD", "BOARD_VOTING", "TIE_BREAK"].includes(proposal.status))
        throw new AppError(409, "Proposal is not open for voting.", "INVALID_TRANSITION");
      if (
        (proposal.votes ?? []).some((vote: any) => normalizeBoardVote(vote).memberId === actor.id)
      ) {
        throw new AppError(409, "This user has already voted on the proposal.", "DUPLICATE_VOTE");
      }
      const decision = normalizeVote(payload.voteDecision ?? payload.value ?? payload.decision);
      const isTieBreak = proposal.status === "TIE_BREAK";
      const vote = {
        memberId: actor.id,
        memberName: actor.name,
        voterId: actor.id,
        voterName: actor.name,
        decision,
        comment: payload.comment ?? payload.note,
        createdAt: nowIso(),
        votedAt: new Date(),
        weight:
          isTieBreak && actor.role === "EDITOR" && actor.isEditorInChief && decision !== "ABSTAIN"
            ? EIC_TIEBREAK_WEIGHT
            : 1,
        isChair: actor.isChair,
        isEditorInChief: actor.isEditorInChief,
      };
      const votes = [...(proposal.votes ?? []), vote];
      const tally = evaluateBoardTally(votes);

      // Update cache in proposal (denormalized)
      patch.votes = votes;
      if (proposal.status === "PENDING_BOARD") patch.status = "BOARD_VOTING";
      if (tally.status) patch.status = tally.status;

      // Write to source-of-truth collection
      const sessionId = payload.sessionId ?? null;
      await ProposalVoteModel.findOneAndUpdate(
        { sessionId, proposalId: proposal.id, voterId: actor.id },
        {
          $setOnInsert: {
            id: id("pv"),
            sessionId,
            proposalId: proposal.id,
            voterId: actor.id,
            voterName: actor.name,
            voterRole: actor.role,
            decision,
            comment: payload.comment ?? payload.note,
            votedAt: new Date(),
            weight: vote.weight,
          },
        },
        { upsert: true },
      );

      notifications.push({
        userId: proposal.authorId,
        kind: "proposal.vote",
        message: `${actor.name} voted ${decision} on ${proposal.title}.`,
      });
      await audit(req, "BOARD_VOTE_CAST", "proposal", proposalId, {
        decision,
        tally: { approve: tally.approve, reject: tally.reject, abstain: tally.abstain },
      });
      break;
    }

    case "FORCE_STATUS": {
      if (!payload.forceStatus)
        throw new AppError(400, "forceStatus is required.", "VALIDATION_ERROR");
      patch.status = payload.forceStatus;
      // Board picks the publication cadence when finalizing an approval.
      if (payload.forceStatus === "APPROVED") {
        const pubType = normalizePublicationType(payload.publicationType);
        if (!pubType) {
          throw new AppError(400, "Invalid publicationType.", "VALIDATION_ERROR");
        }
        patch.boardApprovedPublicationType = pubType;
      }
      break;
    }

    case "WITHDRAW":
      if (
        !["DRAFT", "PENDING_EDITOR", "EDITOR_REVIEWING", "CHANGES_REQUESTED"].includes(
          proposal.status,
        )
      )
        throw new AppError(409, "Proposal can no longer be withdrawn.", "INVALID_TRANSITION");
      patch.status = "WITHDRAWN";
      patch.withdrawnAt = new Date();
      patch.withdrawnById = actor.id;
      break;

    case "RESUBMIT":
      if (proposal.status !== "CHANGES_REQUESTED")
        throw new AppError(
          409,
          "Only changes-requested proposals can be resubmitted.",
          "INVALID_TRANSITION",
        );
      {
        const openChange = [...(proposal.requestedChanges ?? [])]
          .reverse()
          .find((change: any) => !change.resolvedAt);
        const unresolvedItems = (openChange?.items ?? []).filter(
          (item: any) => !payload.resolvedItems?.[item.id]?.resolved,
        );
        if (!openChange || unresolvedItems.length > 0) {
          throw new AppError(
            400,
            "All requested changes must be resolved before resubmission.",
            "REVISION_CHECKLIST_INCOMPLETE",
          );
        }
      }
      patch.status = "RESUBMITTED";
      patch.title = payload.title ?? proposal.title;
      patch.synopsis = payload.synopsis ?? proposal.synopsis;
      patch.genres = payload.genres ?? proposal.genres;
      patch.logline = payload.logline ?? proposal.logline;
      patch.hook = payload.hook ?? proposal.hook;
      patch.mainCharacters = payload.mainCharacters ?? proposal.mainCharacters;
      patch.targetAudience = payload.targetAudience ?? proposal.targetAudience;
      patch.requestedPublicationType =
        payload.requestedPublicationType ?? proposal.requestedPublicationType;
      patch.chaptersPlanned =
        payload.chaptersPlanned !== undefined
          ? Number(payload.chaptersPlanned)
          : proposal.chaptersPlanned;
      patch.coverUrl = payload.coverUrl ?? proposal.coverUrl;
      patch.coverFileKey = payload.coverFileKey ?? proposal.coverFileKey;
      patch.sampleChapterUrl = payload.sampleChapterUrl ?? proposal.sampleChapterUrl;
      patch.materials = payload.materials ?? proposal.materials;
      patch.originalWorkConfirmed = payload.originalWorkConfirmed ?? proposal.originalWorkConfirmed;
      patch.submissionNote = payload.submissionNote ?? proposal.submissionNote;
      patch.advanced = payload.advanced ?? proposal.advanced;
      if (Array.isArray(payload.manuscripts)) {
        patch.manuscripts = payload.manuscripts;
      } else if (payload.manuscript) {
        patch.manuscripts = [
          ...(proposal.manuscripts ?? []),
          {
            ...payload.manuscript,
            id: id("mv"),
            version:
              Math.max(
                0,
                ...(proposal.manuscripts ?? []).map((item: any) => Number(item.version ?? 0)),
              ) + 1,
            uploadedById: actor.id,
            uploadedByName: actor.name,
            uploadedAt: nowIso(),
            note: payload.manuscript.note ?? payload.comment,
          },
        ];
      }
      patch.requestedChanges = (proposal.requestedChanges ?? []).map(
        (change: any, index: number, changes: any[]) => {
          if (change.resolvedAt || index !== changes.length - 1) return change;
          const items = (change.items ?? []).map((item: any) => ({
            ...item,
            resolved: Boolean(payload.resolvedItems?.[item.id]?.resolved),
            response: payload.resolvedItems?.[item.id]?.response,
          }));
          return {
            ...change,
            items,
            resolvedAt: items.every((item: any) => item.resolved) ? nowIso() : undefined,
            resolvedInVersion: Number(proposal.revisionRound ?? 0) + 1,
          };
        },
      );
      break;

    case "EDIT":
      patch.title = payload.title ?? proposal.title;
      patch.synopsis = payload.synopsis ?? proposal.synopsis;
      patch.genres = payload.genres ?? proposal.genres;
      patch.slug = payload.slug ?? proposal.slug;
      patch.logline = payload.logline ?? proposal.logline;
      patch.targetAudience = payload.targetAudience ?? proposal.targetAudience;
      patch.requestedPublicationType =
        payload.requestedPublicationType ?? proposal.requestedPublicationType;
      if (payload.chaptersPlanned !== undefined) {
        patch.chaptersPlanned = Number(payload.chaptersPlanned);
      }
      patch.coverUrl = payload.coverUrl ?? proposal.coverUrl;
      patch.coverFileKey = payload.coverFileKey ?? proposal.coverFileKey;
      patch.sampleChapterUrl = payload.sampleChapterUrl ?? proposal.sampleChapterUrl;
      patch.manuscripts = payload.manuscripts ?? proposal.manuscripts;
      patch.materials = payload.materials ?? proposal.materials;
      patch.hook = payload.hook ?? proposal.hook;
      patch.mainCharacters = payload.mainCharacters ?? proposal.mainCharacters;
      patch.originalWorkConfirmed = payload.originalWorkConfirmed ?? proposal.originalWorkConfirmed;
      patch.submissionNote = payload.submissionNote ?? proposal.submissionNote;
      patch.advanced = payload.advanced ?? proposal.advanced;
      break;

    case "ARCHIVE":
      if (["APPROVED"].includes(proposal.status)) {
        throw new AppError(409, "Approved proposals cannot be archived directly.", "FORBIDDEN");
      }
      patch.status = "ARCHIVED";
      patch.archivedAt = new Date();
      patch.archivedById = actor.id;
      patch.archiveReason = payload.reason ?? payload.archiveReason ?? "";
      break;
  }

  const nextStatus = (patch.status as ProposalStatus | undefined) ?? fromStatus;
  const fullEvent = { ...event, toStatus: nextStatus };
  await ProposalModel.updateOne({ id: proposalId }, { $set: patch, $push: { history: fullEvent } });

  if (!["SUBMIT", "CLAIM", "REQUEST_CHANGES", "FORWARD"].includes(action)) {
    // Generic audit for actions not already audited above
    await audit(req, `proposal.${action.toLowerCase()}`, "proposal", proposalId, {
      fromStatus,
      toStatus: nextStatus,
    });
  }
  await notifyMany(notifications);

  const updatedProposal = await ProposalModel.findOne({ id: proposalId }).lean();
  if (nextStatus === "APPROVED") {
    patch.approvedAt = new Date();
    patch.approvedById = actor.id;
    await ProposalModel.updateOne(
      { id: proposalId },
      { $set: { approvedAt: new Date(), approvedById: actor.id } },
    );
    await ensureProductionSeriesForApprovedProposal(updatedProposal);
    await notifyMany([
      {
        userId: (updatedProposal as any)?.authorId,
        kind: "BOARD_APPROVED_SERIES",
        title: "Series approved",
        message: `${(updatedProposal as any)?.title ?? "Series"} was approved by Board.`,
      },
    ]);
    await audit(req, "BOARD_DECISION_FINALIZED", "proposal", proposalId, {
      fromStatus,
      toStatus: nextStatus,
      publicationType: (updatedProposal as any)?.boardApprovedPublicationType,
    });
    await audit(req, "SERIES_APPROVED", "proposal", proposalId, {
      publicationType: (updatedProposal as any)?.boardApprovedPublicationType,
    });
    await audit(req, "SERIES_PUBLICATION_TYPE_SET", "proposal", proposalId, {
      publicationType: (updatedProposal as any)?.boardApprovedPublicationType,
    });
    await audit(req, "SERIES_CREATED", "series", `s-${proposalId}`, { proposalId });
  }

  return toObject(updatedProposal);
}

function normalizeVote(value: unknown): VoteDecision {
  if (value === "APPROVE" || value === "REJECT" || value === "ABSTAIN") return value;
  if (value === "NEEDS_REVISION") return "REJECT";
  throw new AppError(
    400,
    "Vote decision must be APPROVE, REJECT, ABSTAIN, or NEEDS_REVISION.",
    "VALIDATION_ERROR",
  );
}

const CHAPTER_REVIEW_SOURCE_STATUSES = [
  "IN_PRODUCTION",
  "PLANNED",
  "DRAFTING",
  "ASSISTANT_WORKING",
  "REVISION",
];
const APPROVED_TASK_STATUSES = ["MANGAKA_APPROVED", "EDITOR_APPROVED"];

function pageHasUploadedAsset(page: any) {
  const hasDurableFile = typeof page.fileKey === "string" && page.fileKey.trim().length > 0;
  const fallback = String(page.fileUrl ?? page.imageUrl ?? "");
  const hasLegacyFile =
    fallback.length > 0 &&
    !fallback.startsWith("metadata://signed-url-not-issued") &&
    !fallback.includes("placeholder-page");
  return (
    (hasDurableFile || hasLegacyFile) &&
    page.status !== "PENDING_UPLOAD" &&
    page.status !== "REVISION_REQUIRED"
  );
}

export async function findChapterBlockingComments(chapter: any, tasks: any[], submissions: any[]) {
  const pageIds = (chapter.pages ?? []).map((page: any) => page.id).filter(Boolean);
  const regions = await StudioRegionModel.find({ chapterId: chapter.id }).select({ id: 1 }).lean();
  const regionIds = regions.map((region: any) => region.id);
  const taskIds = tasks.map((task: any) => task.id);
  const submissionIds = submissions.map((submission: any) => submission.id);

  return StudioCommentModel.find({
    $and: [
      {
        $or: [
          { chapterId: chapter.id },
          { pageId: { $in: pageIds } },
          { regionId: { $in: regionIds } },
          { taskId: { $in: taskIds } },
          { targetType: "CHAPTER", targetId: chapter.id },
          { targetType: "PAGE", targetId: { $in: pageIds } },
          { targetType: "REGION", targetId: { $in: regionIds } },
          { targetType: "TASK", targetId: { $in: taskIds } },
          { targetType: "SUBMISSION", targetId: { $in: submissionIds } },
        ],
      },
      { $or: [{ isBlocking: true }, { blocking: true }] },
      { status: { $ne: "RESOLVED" } },
    ],
  }).lean();
}

export async function sendChapterToEditorReview(req: AuthedRequest, chapterId: string) {
  const actor = ensureActor(req);
  if (actor.role !== "MANGAKA") {
    throw new AppError(
      403,
      "Only the Mangaka owner can send this chapter to editor review.",
      "MANGAKA_OWNER_REQUIRED",
    );
  }

  const chapterDoc = await ChapterModel.findOne({ id: chapterId });
  if (!chapterDoc) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");
  const chapter = chapterDoc.toObject() as any;
  const series = (await SeriesModel.findOne({ id: chapter.seriesId }).lean()) as any;
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  if (series.authorId !== actor.id) {
    throw new AppError(
      403,
      "Only the Mangaka owner can send this chapter to editor review.",
      "MANGAKA_OWNER_REQUIRED",
    );
  }
  if (!["ONGOING", "COMPLETED"].includes(String(series.status))) {
    throw new AppError(
      409,
      "Series must be an active production series before editor review.",
      "SERIES_NOT_IN_PRODUCTION",
    );
  }

  const sourceProposalId = series.sourceProposalId ?? series.proposalId;
  const approvedProposal = sourceProposalId
    ? await ProposalModel.findOne({ id: sourceProposalId, status: "APPROVED" }).lean()
    : null;
  if (!approvedProposal) {
    throw new AppError(
      409,
      "The production series must originate from a Board-approved proposal.",
      "PROPOSAL_NOT_APPROVED",
    );
  }
  if (!CHAPTER_REVIEW_SOURCE_STATUSES.includes(chapter.status)) {
    throw new AppError(
      409,
      `Chapter cannot be sent to editor review from status "${chapter.status}".`,
      "INVALID_TRANSITION",
    );
  }
  if (
    !Array.isArray(chapter.pages) ||
    chapter.pages.length === 0 ||
    chapter.pages.some((page: any) => !pageHasUploadedAsset(page))
  ) {
    throw new AppError(
      409,
      "Page image is required before sending to editor review.",
      "PAGE_IMAGE_REQUIRED",
    );
  }

  const pageIds = chapter.pages.map((page: any) => page.id);
  const [tasks, submissions, reviewMaterials] = await Promise.all([
    StudioTaskModel.find({ chapterId }).lean(),
    SubmissionModel.find({ chapterId }).lean(),
    MaterialModel.find({
      $and: [
        { $or: [{ chapterId }, { pageId: { $in: pageIds } }] },
        {
          $or: [{ fileKey: { $exists: true, $ne: "" } }, { url: { $exists: true, $ne: "" } }],
        },
      ],
    }).lean(),
  ]);
  if (
    reviewMaterials.some(
      (material: any) => !["ACTIVE", "APPROVED"].includes(String(material.status)),
    )
  ) {
    throw new AppError(
      409,
      "Review materials must be ACTIVE before sending to editor review.",
      "REVIEW_MATERIAL_NOT_ACTIVE",
    );
  }
  const relevantTasks = tasks.filter((task: any) => task.status !== "CANCELLED");
  if (relevantTasks.some((task: any) => !APPROVED_TASK_STATUSES.includes(String(task.status)))) {
    throw new AppError(
      409,
      "All assistant tasks must be approved by Mangaka before editor review.",
      "TASKS_NOT_MANGAKA_APPROVED",
    );
  }

  const relevantTaskIds = new Set(relevantTasks.map((task: any) => task.id));
  const taskWithoutApprovedSubmission = relevantTasks.find(
    (task: any) =>
      !submissions.some(
        (submission: any) =>
          submission.taskId === task.id &&
          ["MANGAKA_APPROVED", "EDITOR_APPROVED"].includes(submission.status),
      ),
  );
  if (
    taskWithoutApprovedSubmission ||
    submissions.some(
      (submission: any) =>
        relevantTaskIds.has(submission.taskId) &&
        !["MANGAKA_APPROVED", "EDITOR_APPROVED", "SUPERSEDED"].includes(submission.status),
    )
  ) {
    throw new AppError(
      409,
      "All assistant submissions must be approved by Mangaka before editor review.",
      "SUBMISSIONS_NOT_MANGAKA_APPROVED",
    );
  }

  const blockingComments = await findChapterBlockingComments(chapter, tasks, submissions);
  if (blockingComments.length > 0) {
    throw new AppError(
      409,
      "Blocking comments must be resolved before editor review.",
      "BLOCKING_COMMENTS_UNRESOLVED",
    );
  }

  const now = nowIso();
  const pages = chapter.pages.map((page: any) => ({
    ...page,
    status: "READY_FOR_EDITOR_REVIEW",
    updatedAt: now,
  }));
  const event = {
    id: id("ce"),
    chapterId,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: lowerRole(actor),
    type: "SUBMIT_REVIEW",
    fromStatus: chapter.status,
    toStatus: "EDITOR_REVIEW",
    createdAt: now,
  };

  const chapterUpdate = await ChapterModel.updateOne(
    { id: chapterId, status: chapter.status },
    {
      $set: { status: "EDITOR_REVIEW", pages, updatedAt: now },
      $push: { history: event },
    },
  );
  if (chapterUpdate.modifiedCount !== 1) {
    throw new AppError(
      409,
      "Chapter status changed while sending to editor review. Please refresh and try again.",
      "CONFLICT",
    );
  }

  await Promise.all([
    StudioTaskModel.updateMany(
      { chapterId, status: "MANGAKA_APPROVED" },
      { $set: { status: "EDITOR_REVIEWING", updatedAt: now } },
    ),
    SubmissionModel.updateMany(
      { chapterId, status: "MANGAKA_APPROVED" },
      { $set: { reviewStage: "EDITOR_REVIEW", updatedAt: now } },
    ),
  ]);

  await audit(req, "CHAPTER_SENT_TO_EDITOR_REVIEW", "chapter", chapterId, {
    fromStatus: chapter.status,
    toStatus: "EDITOR_REVIEW",
    flow: relevantTasks.length > 0 ? "ASSISTANT_TASK" : "DIRECT",
    pageIds: pages.map((page: any) => page.id),
    taskIds: relevantTasks.map((task: any) => task.id),
  });

  const updatedChapter = toObject(await ChapterModel.findOne({ id: chapterId }).lean()) as any;
  return {
    chapter: updatedChapter,
    pages: updatedChapter.pages,
    nextStatus: "EDITOR_REVIEW",
    flow: relevantTasks.length > 0 ? "ASSISTANT_TASK" : "DIRECT",
    message: "Chapter sent to Editor Review.",
  };
}

export async function applyChapterAction(
  req: AuthedRequest,
  chapterId: string,
  action: ChapterAction,
  payload: any = {},
) {
  const actor = ensureActor(req);
  const doc = await ChapterModel.findOne({ id: chapterId });
  if (!doc) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");
  const chapter = doc.toObject() as any;
  const series = await SeriesModel.findOne({ id: chapter.seriesId }).lean();
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");

  const isOwner =
    actor.role === "ADMIN" ||
    (actor.role === "MANGAKA" &&
      (chapter.assigneeId === actor.id || (series as any).authorId === actor.id)) ||
    (actor.role === "ASSISTANT" && chapter.assigneeId === actor.id);
  const isEditor = actor.role === "ADMIN" || actor.role === "EDITOR";
  const isMangakaOrEditor =
    actor.role === "ADMIN" || actor.role === "EDITOR" || actor.role === "MANGAKA";
  const fromStatus = chapter.status as ChapterStatus;

  if (action === "SUBMIT_REVIEW") {
    const result = await sendChapterToEditorReview(req, chapterId);
    return result.chapter;
  }

  // Chapter status state machine
  const transition: Record<
    ChapterAction,
    {
      from?: string[];
      to?: ChapterStatus;
      owner?: boolean;
      editor?: boolean;
      mangakaOrEditor?: boolean;
    }
  > = {
    START_DRAFT: { from: ["PLANNED"], to: "DRAFTING", owner: true },
    START_ASSISTANT_WORK: { from: ["DRAFTING"], to: "ASSISTANT_WORKING", mangakaOrEditor: true },
    SUBMIT_REVIEW: {
      from: ["DRAFTING", "ASSISTANT_WORKING", "REVISION"],
      to: "EDITOR_REVIEW",
      owner: true,
    },
    REQUEST_REVISION: { from: ["EDITOR_REVIEW"], to: "IN_PRODUCTION", editor: true },
    REJECT: { from: ["EDITOR_REVIEW"], to: "IN_PRODUCTION", editor: true },
    RESUBMIT: { from: ["REVISION", "IN_PRODUCTION"], to: "MANGAKA_REVIEW", owner: true },
    EDITOR_APPROVE: {
      from: ["EDITOR_REVIEW"],
      to: "READY_FOR_PUBLICATION",
      editor: true,
    },
    MARK_READY: {
      from: ["EDITOR_APPROVED", "IN_PRODUCTION"],
      to: "READY_FOR_PUBLICATION",
      editor: true,
    },
    SCHEDULE: {
      from: ["READY_FOR_PUBLICATION"],
      editor: true,
    },
    POSTPONE: { from: ["READY_FOR_PUBLICATION"], editor: true },
    PUBLISH: { from: ["READY_FOR_PUBLICATION"], to: "PUBLISHED", editor: true },
    REASSIGN: { editor: true },
    ARCHIVE: { editor: true },
  };

  const rule = transition[action];
  if (!rule) throw new AppError(400, `Unknown chapter action: ${action}`, "INVALID_ACTION");
  if (rule.owner && !isOwner)
    throw new AppError(403, "Chapter assignee permission is required.", "FORBIDDEN");
  if (rule.editor && !isEditor)
    throw new AppError(403, "Editor permission is required.", "FORBIDDEN");
  if (
    (action === "EDITOR_APPROVE" || action === "REQUEST_REVISION" || action === "REJECT") &&
    (series as any).authorId === actor.id
  ) {
    throw new AppError(
      403,
      "An Editor cannot review their own production chapter.",
      "SELF_APPROVAL_BLOCKED",
    );
  }
  if (rule.mangakaOrEditor && !isMangakaOrEditor)
    throw new AppError(403, "Mangaka or Editor permission is required.", "FORBIDDEN");
  if (rule.from && !rule.from.includes(fromStatus)) {
    // Backward compat: also allow legacy status strings
    const legacyMap: Record<string, string> = {
      APPROVED: "EDITOR_APPROVED",
      IN_REVIEW: "MANGAKA_REVIEW",
    };
    const normalizedStatus = legacyMap[fromStatus] ?? fromStatus;
    if (!rule.from.includes(normalizedStatus)) {
      throw new AppError(
        409,
        `Chapter transition is not valid from status "${fromStatus}".`,
        "INVALID_TRANSITION",
      );
    }
  }

  if ((action === "SCHEDULE" || action === "POSTPONE" || action === "PUBLISH") && fromStatus !== "READY_FOR_PUBLICATION") {
    throw new AppError(
      409,
      "Chapter must be READY_FOR_PUBLICATION before scheduling or publishing.",
      "NOT_READY_FOR_PUBLICATION",
    );
  }

  const patch: Record<string, unknown> = { updatedAt: nowIso() };
  if (rule.to) patch.status = rule.to;

  if (action === "SCHEDULE") {
    if (!payload.scheduledAt)
      throw new AppError(400, "scheduledAt is required.", "VALIDATION_ERROR");
    const scheduledAt = new Date(payload.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      throw new AppError(400, "scheduledAt must be a valid future date/time.", "VALIDATION_ERROR");
    }
    const publicationType = normalizePublicationType((series as any).publicationType);
    if (!publicationType) {
      throw new AppError(
        409,
        "Series publicationType is required before scheduling.",
        "PUBLICATION_TYPE_REQUIRED",
      );
    }
    if (["CANCELLED", "COMPLETED"].includes(String((series as any).status))) {
      throw new AppError(409, "Series is not publishable.", "SERIES_NOT_PUBLISHABLE");
    }
    await PublicationModel.findOneAndUpdate(
      { chapterId },
      {
        $set: {
          seriesId: chapter.seriesId,
          chapterId,
          status: "SCHEDULED",
          scheduledAt,
          scheduledById: actor.id,
          updatedAt: nowIso(),
        },
        $setOnInsert: { id: id("pub"), createdAt: nowIso() },
      },
      { upsert: true, returnDocument: "after" },
    );
    await audit(req, "PUBLICATION_SCHEDULED", "publication", chapterId, {
      scheduledAt: scheduledAt.toISOString(),
      publicationType,
    });
    await notifyMany([
      {
        userId: (series as any).authorId,
        kind: "PUBLICATION_SCHEDULED",
        title: "Publication scheduled",
        message: `${chapter.title} is scheduled for publication.`,
      },
    ]);
  }
  if (action === "POSTPONE") {
    const publication = await PublicationModel.findOne({ chapterId, status: "SCHEDULED" }).lean();
    if (!publication) {
      throw new AppError(409, "No scheduled publication exists.", "PUBLICATION_NOT_SCHEDULED");
    }
    const publicationType = normalizePublicationType((series as any).publicationType) ?? "MONTHLY";
    const days = publicationType === "WEEKLY" ? 7 : 30;
    const base = new Date((publication as any).scheduledAt);
    base.setDate(base.getDate() + days);
    await PublicationModel.updateOne(
      { chapterId },
      { $set: { scheduledAt: base, scheduledById: actor.id, updatedAt: nowIso() } },
    );
    await audit(req, "CHAPTER_POSTPONED", "chapter", chapterId, {
      publicationType,
      days,
      scheduledAt: base.toISOString(),
    });
  }
  if (action === "PUBLISH") {
    const publication = await PublicationModel.findOne({ chapterId, status: "SCHEDULED" }).lean();
    if (!publication) {
      throw new AppError(409, "Publication must be scheduled before publishing.", "PUBLICATION_NOT_SCHEDULED");
    }
    const scheduledAt = new Date((publication as any).scheduledAt);
    if (scheduledAt.getTime() > Date.now()) {
      throw new AppError(409, "Publication scheduledAt has not arrived.", "PUBLICATION_NOT_DUE");
    }
    patch.publishedAt = new Date();
    patch.publishedById = actor.id;
    await PublicationModel.updateOne(
      { chapterId },
      {
        $set: {
          status: "PUBLISHED",
          publishedAt: patch.publishedAt,
          publishedById: actor.id,
          updatedAt: nowIso(),
        },
      },
    );
    await audit(req, "CHAPTER_PUBLISHED", "chapter", chapterId, {
      fromStatus,
      toStatus: "PUBLISHED",
    });
    await notifyMany([
      {
        userId: (series as any).authorId,
        kind: "CHAPTER_PUBLISHED",
        title: "Chapter published",
        message: `${chapter.title} has been published.`,
      },
    ]);
  }
  if (action === "MARK_READY" || action === "EDITOR_APPROVE") {
    const publicationType = normalizePublicationType((series as any).publicationType);
    if (!publicationType) {
      throw new AppError(
        409,
        "Series publicationType is required before chapter readiness.",
        "PUBLICATION_TYPE_REQUIRED",
      );
    }
    if (["CANCELLED", "COMPLETED"].includes(String((series as any).status))) {
      throw new AppError(409, "Series is not publishable.", "SERIES_NOT_PUBLISHABLE");
    }
    patch.readyForPublicationAt = new Date();
    patch.readyByEditorId = actor.id;
    await audit(req, "CHAPTER_MARKED_READY", "chapter", chapterId, {
      fromStatus,
      toStatus: "READY_FOR_PUBLICATION",
    });
    await notifyMany([
      {
        userId: (series as any).authorId,
        kind: "CHAPTER_READY_FOR_PUBLICATION",
        title: "Chapter ready for publication",
        message: `${chapter.title} is ready for publication scheduling.`,
      },
    ]);
  }
  if (action === "REQUEST_REVISION" || action === "REJECT") {
    const note = payload.feedback ?? payload.reason ?? payload.reviewNote ?? payload.comment;
    if (!payload.targetType || !payload.targetId) {
      throw new AppError(400, "targetType and targetId are required.", "VALIDATION_ERROR");
    }
    if (!note) {
      throw new AppError(
        400,
        action === "REJECT" ? "reason is required." : "feedback is required.",
        "VALIDATION_ERROR",
      );
    }
    patch.reviewNotes = [
      ...(chapter.reviewNotes ?? []),
      {
        id: id("rn"),
        authorId: actor.id,
        authorName: actor.name,
        authorRole: lowerRole(actor),
        text: note,
        resolved: false,
        targetType: payload.targetType,
        targetId: payload.targetId,
        createdAt: nowIso(),
      },
    ];
  }
  if (action === "REASSIGN") {
    if (!payload.newAssigneeId || !payload.newAssigneeName)
      throw new AppError(400, "New assignee is required.", "VALIDATION_ERROR");
    patch.assigneeId = payload.newAssigneeId;
    patch.assigneeName = payload.newAssigneeName;
  }
  if (action === "ARCHIVE") {
    if (!["PUBLISHED", "EDITOR_APPROVED"].includes(fromStatus)) {
      // Only allow archive on terminal/stable states
    }
    patch.archivedAt = new Date();
    patch.archivedById = actor.id;
    patch.archiveReason = payload.reason ?? "";
  }

  const event = {
    id: id("ce"),
    chapterId,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: lowerRole(actor),
    type: action,
    fromStatus,
    toStatus: (patch.status as ChapterStatus | undefined) ?? fromStatus,
    comment: payload.comment ?? payload.reviewNote,
    createdAt: nowIso(),
  };
  await ChapterModel.updateOne({ id: chapterId }, { $set: patch, $push: { history: event } });
  if (action === "EDITOR_APPROVE") {
    const pages = (chapter.pages ?? []).map((page: any) => ({
      ...page,
      status: "EDITOR_APPROVED",
      updatedAt: nowIso(),
    }));
    await Promise.all([
      ChapterModel.updateOne({ id: chapterId }, { $set: { pages } }),
      StudioTaskModel.updateMany(
        { chapterId, status: { $in: ["EDITOR_REVIEWING", "MANGAKA_APPROVED"] } },
        { $set: { status: "EDITOR_APPROVED", editorReviewedAt: new Date(), updatedAt: nowIso() } },
      ),
      SubmissionModel.updateMany(
        { chapterId, status: "MANGAKA_APPROVED" },
        {
          $set: {
            status: "EDITOR_APPROVED",
            reviewStage: "FINAL",
            editorReviewedAt: new Date(),
            updatedAt: nowIso(),
          },
        },
      ),
    ]);
    await audit(req, "TASK_EDITOR_APPROVED", "chapter", chapterId, { bulk: true });
  }
  if (action === "REQUEST_REVISION" || action === "REJECT") {
    const pages = (chapter.pages ?? []).map((page: any) => ({
      ...page,
      status: "REVISION_REQUIRED",
      updatedAt: nowIso(),
    }));
    const targetType = String(payload.targetType ?? "").toUpperCase();
    const targetId = String(payload.targetId ?? "");
    let targetTask: any = null;
    if (targetType === "TASK") {
      targetTask = await StudioTaskModel.findOne({ id: targetId, chapterId }).lean();
    } else if (targetType === "SUBMISSION") {
      const submission = await SubmissionModel.findOne({ id: targetId, chapterId }).lean();
      targetTask = submission
        ? await StudioTaskModel.findOne({ id: (submission as any).taskId, chapterId }).lean()
        : null;
    } else if (targetType === "REGION") {
      targetTask = await StudioTaskModel.findOne({ regionId: targetId, chapterId }).lean();
    } else if (targetType === "PAGE") {
      targetTask = await StudioTaskModel.findOne({
        pageId: targetId,
        chapterId,
        status: { $ne: "CANCELLED" },
      }).lean();
    }
    if (!targetTask) throw new AppError(404, "Selected task target was not found.", "TASK_NOT_FOUND");
    const targetStatus = action === "REJECT" ? "REJECTED" : "EDITOR_REVISION_REQUESTED";
    await Promise.all([
      ChapterModel.updateOne({ id: chapterId }, { $set: { pages } }),
      StudioTaskModel.updateOne(
        { id: targetTask.id },
        {
          $set: {
            status: targetStatus,
            revisionRequestedByRole: action === "REJECT" ? undefined : "EDITOR",
            revisionRequestedAt: action === "REJECT" ? undefined : new Date(),
            editorReviewedAt: new Date(),
            editorReviewedById: actor.id,
            updatedAt: nowIso(),
          },
        },
      ),
      SubmissionModel.updateOne(
        { taskId: targetTask.id, status: "MANGAKA_APPROVED" },
        {
          $set: {
            status: targetStatus,
            editorReviewedAt: new Date(),
            editorReviewedById: actor.id,
            updatedAt: nowIso(),
          },
        },
      ),
    ]);
    await audit(
      req,
      action === "REJECT" ? "EDITOR_REJECTED_TASK" : "EDITOR_REVISION_REQUESTED",
      "task",
      targetTask.id,
      { chapterId, targetType, targetId },
    );
    await notifyMany(
      [
        {
          userId: targetTask.assigneeId,
          kind: action === "REJECT" ? "EDITOR_REJECTED_TASK" : "EDITOR_REQUESTED_REVISION",
          title: action === "REJECT" ? "Task rejected by Editor" : "Revision requested by Editor",
          message: `${chapter.title} needs follow-up from Editor review.`,
        },
      ].filter((item) => Boolean(item.userId)),
    );
  }
  await audit(req, `chapter.${action.toLowerCase()}`, "chapter", chapterId, {
    fromStatus,
    toStatus: event.toStatus,
  });
  return toObject(await ChapterModel.findOne({ id: chapterId }).lean());
}

export async function applyTaskAction(
  req: AuthedRequest,
  taskId: string,
  action: string,
  payload: any = {},
) {
  const actor = ensureActor(req);
  const doc = await StudioTaskModel.findOne({ id: taskId });
  if (!doc) throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
  const task = doc.toObject() as any;
  const normalizedAction = action.toUpperCase();
  assertTaskActionAllowed(actor, task, action);

  const patch: Record<string, unknown> = { updatedAt: nowIso() };

  switch (normalizedAction) {
    case "START":
      patch.status = "IN_PROGRESS";
      patch.startedAt = new Date();
      // Lock region when task becomes active
      await lockRegion(task.regionId, taskId);
      break;

    case "SUBMIT":
      patch.status = "SUBMITTED";
      patch.submittedAt = new Date();
      await audit(req, "TASK_SUBMITTED", "task", taskId, { fromStatus: task.status });
      break;

    case "REQUEST_REVISION":
      // Determine which review stage we're in
      if (["SUBMITTED", "MANGAKA_REVIEWING"].includes(task.status)) {
        patch.status = "MANGAKA_REVISION_REQUESTED";
        patch.mangakaReviewedAt = new Date();
        patch.mangakaReviewedById = actor.id;
      } else {
        patch.status = "EDITOR_REVISION_REQUESTED";
        patch.editorReviewedAt = new Date();
        patch.editorReviewedById = actor.id;
      }
      break;

    case "APPROVE":
    case "MANGAKA_APPROVE":
      patch.status = "MANGAKA_APPROVED";
      patch.mangakaReviewedAt = new Date();
      patch.mangakaReviewedById = actor.id;
      await audit(req, "TASK_MANGAKA_APPROVED", "task", taskId, { fromStatus: task.status });
      break;

    case "EDITOR_APPROVE":
      // Two-round review: must have been MANGAKA_APPROVED first
      if (!["MANGAKA_APPROVED", "EDITOR_REVIEWING"].includes(task.status)) {
        throw new AppError(
          409,
          "Task must be Mangaka-approved before Editor can approve.",
          "INVALID_TRANSITION",
        );
      }
      patch.status = "EDITOR_APPROVED";
      patch.editorReviewedAt = new Date();
      patch.editorReviewedById = actor.id;
      if (task.regionId) await releaseRegionLock(task.regionId, taskId);
      await audit(req, "TASK_EDITOR_APPROVED", "task", taskId, { fromStatus: task.status });
      // Create earning item for assistant task
      if (task.assigneeId) {
        await createEarningItemIfMissing(req, {
          assistantId: task.assigneeId,
          taskId: task.id,
          seriesId: task.seriesId,
          chapterId: task.chapterId,
          taskType: task.type,
        });
      }
      break;

    case "REJECT":
      patch.status = "REJECTED";
      await releaseRegionLock(task.regionId, taskId);
      break;

    case "CANCEL":
      patch.status = "CANCELLED";
      patch.cancelledAt = new Date();
      patch.cancelledById = actor.id;
      patch.cancelReason = payload.cancelReason ?? payload.reason ?? "";
      await releaseRegionLock(task.regionId, taskId);
      break;

    case "BLOCK":
    case "MARK_BLOCKED":
      patch.blocked = true;
      patch.blockedReason = payload.blockedReason ?? payload.reason ?? "Blocked by workflow";
      patch.blockedBy = payload.blockedBy ?? actor.name;
      break;

    case "UNBLOCK":
      patch.blocked = false;
      patch.blockedReason = null;
      patch.blockedBy = null;
      break;

    case "REOPEN":
      patch.status = "TODO";
      patch.blocked = false;
      patch.blockedReason = null;
      patch.blockedBy = null;
      break;

    case "REASSIGN":
      if (!payload.newAssigneeId || !payload.newAssigneeName) {
        throw new AppError(
          400,
          "newAssigneeId and newAssigneeName are required.",
          "VALIDATION_ERROR",
        );
      }
      patch.assigneeId = payload.newAssigneeId;
      patch.assigneeName = payload.newAssigneeName;
      await audit(req, "TASK_ASSIGNED", "task", taskId, {
        fromAssignee: task.assigneeId,
        toAssignee: payload.newAssigneeId,
      });
      break;

    default:
      throw new AppError(400, `Unknown task action: ${action}`, "INVALID_ACTION");
  }

  await StudioTaskModel.updateOne({ id: taskId }, { $set: patch });
  await audit(req, `task.${action.toLowerCase()}`, "task", taskId, {
    fromStatus: task.status,
    toStatus: patch.status ?? task.status,
  });
  return toObject(await StudioTaskModel.findOne({ id: taskId }).lean());
}

export function chapterReadiness(
  chapter: any,
  comments: any[] = [],
  tasks: any[] = [],
  submissions: any[] = [],
  materials: any[] = [],
) {
  const items = [
    {
      key: "reviewMaterialActive",
      passed: materials.every((material: any) =>
        ["ACTIVE", "APPROVED"].includes(String(material.status)),
      ),
      reason: "Review materials must be ACTIVE before sending to editor review.",
    },
    {
      key: "allPagesUploaded",
      passed:
        Array.isArray(chapter.pages) &&
        chapter.pages.length > 0 &&
        chapter.pages.every(pageHasUploadedAsset),
      reason: "Every chapter page needs a valid uploaded image.",
    },
    {
      key: "allTasksApproved",
      passed: tasks.every((task) =>
        ["EDITOR_APPROVED", "CANCELLED"].includes(task.status),
      ),
      reason: "Every required assistant task must be approved by Editor.",
    },
    {
      key: "allSubmissionsApproved",
      passed: submissions.every((submission) =>
        ["EDITOR_APPROVED", "SUPERSEDED"].includes(submission.status),
      ),
      reason: "Every required assistant submission must be approved by Editor.",
    },
    {
      key: "allCommentsResolved",
      passed: comments.every(
        (comment) => comment.status === "RESOLVED" || (!comment.isBlocking && !comment.blocking),
      ),
      reason: "Blocking comments remain open.",
    },
    {
      key: "editorFinalApprovalExists",
      passed: ["READY_FOR_PUBLICATION", "PUBLISHED"].includes(
        chapter.status,
      ),
      reason: "Editor final approval is required.",
    },
  ];
  return {
    chapterId: chapter.id,
    chapterStatus: chapter.status,
    ready: items.every((item) => item.passed),
    items,
  };
}

export async function dashboardSummary(role: string) {
  const proposals = await ProposalModel.find({}).lean();
  const chapters = await ChapterModel.find({}).lean();
  const submissions = await SubmissionModel.find({}).lean();
  const comments = await StudioCommentModel.find({}).lean();
  const rankings = await RankingModel.find({}).lean();

  if (role === "editor") {
    return {
      reviewQueue: {
        manuscripts: proposals.filter((p: any) =>
          ["PENDING_EDITOR", "EDITOR_REVIEWING", "CHANGES_REQUESTED", "RESUBMITTED"].includes(
            p.status,
          ),
        ).length,
        productions: submissions.filter((s: any) => s.status === "MANGAKA_APPROVED").length,
      },
      openComments: comments.filter((c: any) => c.status !== "RESOLVED").length,
      chaptersInReview: chapters.filter((c: any) =>
        ["MANGAKA_REVIEW", "EDITOR_REVIEW", "IN_REVIEW"].includes(c.status),
      ).length,
      recentActivity: proposals
        .slice(0, 4)
        .map((p: any) => ({ id: p.id, label: `${p.title}: ${p.status}`, createdAt: p.updatedAt })),
    };
  }

  if (role === "board") {
    return {
      boardQueue: {
        pendingVotes: proposals.filter((p: any) =>
          ["PENDING_BOARD", "BOARD_VOTING"].includes(p.status),
        ).length,
        tieBreaks: proposals.filter((p: any) => p.status === "TIE_BREAK").length,
        atRiskReviews: rankings.filter((r: any) => r.atRisk || r.status === "AT_RISK").length,
      },
      recentActivity: proposals
        .filter((p: any) => ["PENDING_BOARD", "BOARD_VOTING", "TIE_BREAK"].includes(p.status))
        .map((p: any) => ({ id: p.id, label: `${p.title}: ${p.status}`, createdAt: p.updatedAt })),
    };
  }

  return {
    proposals: proposals.length,
    series: await SeriesModel.countDocuments(),
    chapters: chapters.length,
    submissions: submissions.length,
    comments: comments.length,
  };
}

export async function editorReviewQueue() {
  const proposals = await ProposalModel.find({
    status: { $in: ["PENDING_EDITOR", "EDITOR_REVIEWING", "CHANGES_REQUESTED", "RESUBMITTED"] },
  })
    .sort({ updatedAt: -1 })
    .lean();
  return proposals.map((proposal: any, index) => ({
    id: proposal.id,
    claimedByEditorId: proposal.claimedByEditorId ?? null,
    claimedByEditorName: proposal.claimedByEditorName ?? null,
    claimedAt: proposal.claimedAt ?? null,
    reviewStartedAt: proposal.reviewStartedAt ?? null,
    claimStatus: proposal.claimedByEditorId ? "IN_REVIEW" : "AVAILABLE",
    series: {
      id: proposal.id,
      title: proposal.title,
      status:
        proposal.status === "CHANGES_REQUESTED" || proposal.status === "RESUBMITTED"
          ? "REVISION_REQUESTED"
          : "EDITOR_REVIEW",
      synopsis: proposal.synopsis,
      logline: proposal.logline,
      genres: proposal.genres ?? [],
      tags: proposal.genres ?? [],
      targetAudience: proposal.targetAudience,
      requestedPublicationType: proposal.requestedPublicationType ?? "MONTHLY",
      publicationType: proposal.requestedPublicationType ?? "MONTHLY",
      updatedAt: proposal.updatedAt,
    },
    manuscript: (proposal.manuscripts ?? [])[proposal.manuscripts?.length - 1] ?? {
      id: `${proposal.id}-manuscript`,
      version: 1,
      status: "SUBMITTED",
    },
    priority: index === 0 ? "high" : "normal",
  }));
}

export async function boardQueue() {
  const proposals = await ProposalModel.find({
    status: { $in: ["PENDING_BOARD", "BOARD_VOTING", "TIE_BREAK"] },
  })
    .sort({ updatedAt: -1 })
    .lean();
  const proposalItems = proposals.map((proposal: any) => {
    const tally = evaluateBoardTally(proposal.votes ?? []);
    return {
      id: proposal.id,
      seriesId: proposal.id,
      seriesTitle: proposal.title,
      title: proposal.title,
      seriesStatus: "BOARD_REVIEW",
      decisionStatus: proposal.status === "TIE_BREAK" ? "TIE_BREAK_REQUIRED" : "PENDING",
      requestedPublicationType: proposal.requestedPublicationType ?? "MONTHLY",
      publicationType: proposal.requestedPublicationType ?? "MONTHLY",
      genres: proposal.genres ?? [],
      tags: proposal.genres ?? [],
      voteSummary: {
        APPROVE: tally.approve,
        REJECT: tally.reject,
        NEEDS_REVISION: 0,
        approve: tally.approve,
        reject: tally.reject,
        needsRevision: 0,
        pending: Math.max(BOARD_TOTAL - tally.total, 0),
        eligible: BOARD_TOTAL,
        quorum: BOARD_QUORUM,
        canFinalize: tally.status === "APPROVED" || tally.status === "REJECTED",
      },
      eligibleBoardCount: BOARD_TOTAL,
      quorum: BOARD_QUORUM,
      voteCount: tally.total,
      canFinalize: tally.status === "APPROVED" || tally.status === "REJECTED",
      updatedAt: proposal.updatedAt,
    };
  });

  const atRisk = await RankingModel.find({ $or: [{ atRisk: true }, { status: "AT_RISK" }] }).lean();
  return [
    ...proposalItems,
    ...atRisk.map((rank: any) => ({
      id: rank.seriesId,
      seriesId: rank.seriesId,
      seriesTitle: rank.seriesTitle,
      seriesStatus: "AT_RISK",
      decisionStatus: "PENDING",
      updatedAt: rank.updatedAt,
    })),
  ];
}

export async function seriesProposalSummary(seriesId: string) {
  const proposal = await ProposalModel.findOne({ id: seriesId }).lean();
  const series = proposal ?? (await SeriesModel.findOne({ id: seriesId }).lean());
  if (!series) throw new AppError(404, "Series or proposal not found.", "SERIES_NOT_FOUND");
  const value = series as any;
  return {
    series: {
      id: value.id,
      title: value.title,
      status: ["PENDING_BOARD", "BOARD_VOTING", "TIE_BREAK"].includes(value.status)
        ? "BOARD_REVIEW"
        : value.status === "CHANGES_REQUESTED" || value.status === "RESUBMITTED"
          ? "REVISION_REQUESTED"
          : (value.status ?? "EDITOR_REVIEW"),
      synopsis: value.synopsis,
      logline: value.logline,
      targetAudience: value.targetAudience,
      requestedPublicationType: value.requestedPublicationType ?? "MONTHLY",
      publicationType: value.requestedPublicationType ?? "MONTHLY",
      genres: value.genres ?? [],
      tags: value.genres ?? [],
    },
    currentManuscript: (value.manuscripts ?? [])[value.manuscripts?.length - 1],
    manuscripts: value.manuscripts ?? [],
    boardReview: value.votes
      ? {
          status: value.status === "TIE_BREAK" ? "TIE_BREAK_REQUIRED" : value.status,
          result: value.status,
          voteCount: value.votes.length,
        }
      : undefined,
  };
}

export async function closeVotingSession(req: AuthedRequest, sessionId: string) {
  const actor = ensureActor(req);
  requireMutationRole(actor, ["EDITOR", "BOARD"]);
  const session = await VotingSessionModel.findOne({ id: sessionId });
  if (!session) throw new AppError(404, "Voting session not found.", "SESSION_NOT_FOUND");
  if (!["OPEN", "BOARD_VOTING"].includes((session as any).status))
    throw new AppError(409, "Voting session is not open.", "INVALID_TRANSITION");
  (session as any).status = "CLOSED";
  (session as any).closedAt = new Date();
  (session as any).finalizedById = actor.id;
  (session as any).finalizedAt = new Date();
  await session.save();
  await audit(req, "BOARD_SESSION_FINALIZED", "voting_session", sessionId, {
    closedById: actor.id,
  });
  return toObject(session);
}

export async function cancelVotingSession(req: AuthedRequest, sessionId: string) {
  const actor = ensureActor(req);
  requireMutationRole(actor, ["EDITOR", "BOARD"]);
  const session = await VotingSessionModel.findOne({ id: sessionId });
  if (!session) throw new AppError(404, "Voting session not found.", "SESSION_NOT_FOUND");
  (session as any).status = "CANCELLED";
  (session as any).cancelledAt = new Date();
  await session.save();
  await audit(req, "voting_session.cancel", "voting_session", sessionId);
  return toObject(session);
}

export async function submissionDecision(
  req: AuthedRequest,
  submissionId: string,
  action: "approve" | "reject" | "request-revision" | "editor-approve",
  note?: string,
) {
  const actor = ensureActor(req);

  const existingDoc = await SubmissionModel.findOne({ id: submissionId }).lean();
  if (!existingDoc) throw new AppError(404, "Submission not found.", "SUBMISSION_NOT_FOUND");
  const submission = existingDoc as any;

  // Self-approval check
  if (
    (action === "approve" || action === "editor-approve") &&
    submission.assistantId === actor.id
  ) {
    throw new AppError(
      403,
      "Bạn không thể duyệt submission do chính mình nộp.",
      "SELF_APPROVAL_BLOCKED",
    );
  }

  if (action === "editor-approve") {
    requireMutationRole(actor, ["EDITOR"]);
  } else {
    requireMutationRole(actor, ["MANGAKA", "EDITOR"]);
  }

  let status: string = "PENDING";
  const reviewPatch: Record<string, unknown> = {};

  if (action === "approve") {
    status = "MANGAKA_APPROVED";
    reviewPatch.mangakaDecision = "APPROVED";
    reviewPatch.mangakaNote = note;
    reviewPatch.mangakaReviewedById = actor.id;
    reviewPatch.mangakaReviewedAt = new Date();
    reviewPatch.reviewStage = "EDITOR_REVIEW";
  } else if (action === "editor-approve") {
    status = "EDITOR_APPROVED";
    reviewPatch.editorDecision = "APPROVED";
    reviewPatch.editorNote = note;
    reviewPatch.editorReviewedById = actor.id;
    reviewPatch.editorReviewedAt = new Date();
    reviewPatch.reviewStage = "FINAL";
  } else if (action === "reject") {
    status = "REJECTED";
    reviewPatch.editorNote = note;
    reviewPatch.editorReviewedById = actor.id;
    reviewPatch.editorReviewedAt = new Date();
  } else if (action === "request-revision") {
    // Which stage is active?
    if (["PENDING", "MANGAKA_REVISION_REQUESTED"].includes(submission.status)) {
      status = "MANGAKA_REVISION_REQUESTED";
      reviewPatch.mangakaNote = note;
      reviewPatch.mangakaReviewedById = actor.id;
      reviewPatch.mangakaReviewedAt = new Date();
    } else {
      status = "EDITOR_REVISION_REQUESTED";
      reviewPatch.editorNote = note;
      reviewPatch.editorReviewedById = actor.id;
      reviewPatch.editorReviewedAt = new Date();
    }
  }

  const updated = await SubmissionModel.findOneAndUpdate(
    { id: submissionId },
    {
      $set: {
        status,
        // Keep legacy fields for backward compat
        reviewerNote: note,
        reviewedById: actor.id,
        reviewedByName: actor.name,
        reviewedAt: new Date(),
        ...reviewPatch,
      },
    },
    { returnDocument: "after" },
  ).lean();

  // Sync task status based on submission decision
  if (status === "MANGAKA_APPROVED") {
    await StudioTaskModel.updateOne(
      { id: submission.taskId },
      {
        $set: {
          status: "MANGAKA_APPROVED",
          mangakaReviewedAt: new Date(),
          mangakaReviewedById: actor.id,
          updatedAt: nowIso(),
        },
      },
    );
    await audit(req, "TASK_MANGAKA_APPROVED", "task", submission.taskId, { submissionId });
  } else if (status === "EDITOR_APPROVED") {
    await StudioTaskModel.updateOne(
      { id: submission.taskId },
      {
        $set: {
          status: "EDITOR_APPROVED",
          editorReviewedAt: new Date(),
          editorReviewedById: actor.id,
          updatedAt: nowIso(),
        },
      },
    );
    // Release region lock when editor approves
    const task = (await StudioTaskModel.findOne({ id: submission.taskId }).lean()) as any;
    await releaseRegionLock(task?.regionId, submission.taskId);
    await audit(req, "TASK_EDITOR_APPROVED", "task", submission.taskId, { submissionId });
    // Create earning item for assistant submission
    if (submission.assistantId) {
      await createEarningItemIfMissing(req, {
        assistantId: submission.assistantId,
        taskId: submission.taskId,
        submissionId: submission.id,
        seriesId: task?.seriesId,
        chapterId: task?.chapterId,
        taskType: task?.type,
      });
    }
  } else if (status === "MANGAKA_REVISION_REQUESTED") {
    await StudioTaskModel.updateOne(
      { id: submission.taskId },
      { $set: { status: "MANGAKA_REVISION_REQUESTED", updatedAt: nowIso() } },
    );
  } else if (status === "EDITOR_REVISION_REQUESTED") {
    await StudioTaskModel.updateOne(
      { id: submission.taskId },
      { $set: { status: "EDITOR_REVISION_REQUESTED", updatedAt: nowIso() } },
    );
  } else if (status === "REJECTED") {
    await StudioTaskModel.updateOne(
      { id: submission.taskId },
      { $set: { status: "REJECTED", updatedAt: nowIso() } },
    );
    const task = (await StudioTaskModel.findOne({ id: submission.taskId }).lean()) as any;
    await releaseRegionLock(task?.regionId, submission.taskId);
  }

  await audit(req, `submission.${action}`, "submission", submissionId, { status });
  return updated;
}

export async function taskDetail(req: AuthedRequest, taskId: string) {
  const actor = ensureActor(req);
  const task = await StudioTaskModel.findOne({ id: taskId }).lean();
  if (!task) throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
  assertTaskReadable(actor, task);
  return task;
}
