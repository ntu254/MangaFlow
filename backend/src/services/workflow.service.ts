import {
  ChapterReviewModel,
  ChapterModel,
  MaterialModel,
  ProposalModel,
  ProposalVoteModel,
  SeriesModel,
  StudioCommentModel,
  StudioRegionModel,
  StudioTaskModel,
  SubmissionModel,
  VotingSessionModel,
  RankingModel,
  UserModel,
} from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { apiToWebRole } from "../domain/roles.js";
import { AppError } from "../lib/http.js";
import { audit, notifyMany } from "./audit.service.js";
import { assertAssignedSeriesEditor } from "./authorization.service.js";
import type {
  AuthedRequest,
  ChapterAction,
  ChapterStatus,
  ProposalAction,
  ProposalStatus,
  RequestActor,
  VoteDecision,
} from "../types.js";
import {
  BOARD_QUORUM,
  DEFAULT_BOARD_ELIGIBLE_VOTER_IDS,
  evaluateBoardTally,
  normalizeBoardVote,
} from "./board-governance.service.js";
import {
  ensureProductionSeriesForApprovedProposal,
  normalizePublicationType,
} from "./proposal-lifecycle.service.js";
import {
  chapterReviewVersion,
  pageHasUploadedAsset,
  pageReviewVersion,
} from "./chapter-readiness.service.js";
import {
  findChapterBlockingComments,
  sendChapterToEditorReview as sendChapterToEditorReviewCommand,
} from "./chapter-review.service.js";
import {
  postponeChapterPublication,
  publishChapter,
  scheduleChapterPublication,
} from "./publication.service.js";
import {
  assertSessionVersionMatches,
  createAuditEntry,
  createOutboxEvent,
  expectedVersionFilter,
  runWorkflowTransaction,
  toObject,
} from "./workflow-support.service.js";

function proposalCurrentVersion(proposal: any) {
  return String(
    proposal?.currentVersionId ??
      proposal?.currentVersion ??
      proposal?.version ??
      proposal?.manuscripts?.[proposal.manuscripts.length - 1]?.version ??
      "1",
  );
}

function proposalHasBoardReviewLock(proposal: any) {
  return Boolean(
    proposal?.status === "BOARD_REVIEW" ||
    proposal?.activeVotingSessionId ||
    proposal?.activeProposalVersionId,
  );
}

function chapterReviewDecisionStatus(action: string) {
  if (action === "EDITOR_APPROVE") return "APPROVED";
  if (action === "REQUEST_REVISION") return "REVISION_REQUESTED";
  if (action === "REJECT") return "REJECTED";
  return null;
}

function lowerRole(actor: RequestActor) {
  return apiToWebRole[actor.role];
}

function ensureActor(req: AuthedRequest) {
  if (!req.actor) throw new AppError(401, "Missing authenticated user.", "MISSING_AUTH");
  return req.actor;
}

function requireExactRole(actor: RequestActor, roles: RequestActor["role"][]) {
  if (!roles.includes(actor.role)) {
    throw new AppError(403, "You do not have permission for this action.", "FORBIDDEN");
  }
}

const EDITORIAL_CHECKLIST_KEYS = [
  "hook",
  "characterMotivation",
  "audienceFit",
  "storyboardFlow",
  "manuscriptQuality",
  "serializePotential",
] as const;

function normalizeEditorialChecklist(payload: any) {
  const source = payload?.editorialChecklist;
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    throw new AppError(400, "All six editorial checklist values are required.", "VALIDATION_ERROR");
  }
  const checklist = Object.fromEntries(
    EDITORIAL_CHECKLIST_KEYS.map((key) => {
      if (typeof source[key] !== "boolean") {
        throw new AppError(
          400,
          "All six editorial checklist values must be boolean.",
          "VALIDATION_ERROR",
        );
      }
      return [key, source[key]];
    }),
  );
  const extraKey = Object.keys(source).find(
    (key) => !EDITORIAL_CHECKLIST_KEYS.includes(key as (typeof EDITORIAL_CHECKLIST_KEYS)[number]),
  );
  if (extraKey) {
    throw new AppError(400, `Unexpected checklist field: ${extraKey}`, "VALIDATION_ERROR");
  }
  return checklist as Record<(typeof EDITORIAL_CHECKLIST_KEYS)[number], boolean>;
}

function editorialChecklistComplete(checklist: any) {
  return EDITORIAL_CHECKLIST_KEYS.every((key) => checklist?.[key] === true);
}

function assertTaskReadable(actor: RequestActor, task: any) {
  if (actor.role === "ASSISTANT" && task.assigneeId !== actor.id) {
    throw new AppError(403, "Task is not assigned to the current assistant.", "TASK_NOT_ASSIGNED");
  }
}

function assertProposalAction(
  action: ProposalAction,
  actor: RequestActor,
  proposal: any,
  payload: any = {},
) {
  switch (action) {
    case "SUBMIT":
    case "WITHDRAW":
    case "EDIT":
    case "RESUBMIT":
      if (!(actor.role === "MANGAKA" && proposal.authorId === actor.id)) {
        throw new AppError(403, "Only the proposal author can change this proposal.", "FORBIDDEN");
      }
      if (action === "EDIT") {
        if (proposalHasBoardReviewLock(proposal)) {
          throw new AppError(
            409,
            "Proposal content is locked while a Board review snapshot is active.",
            "PROPOSAL_VERSION_LOCKED",
          );
        }
        if (!["DRAFT", "CHANGES_REQUESTED"].includes(proposal.status)) {
          throw new AppError(
            409,
            "Only draft or changes-requested proposals can be edited.",
            "INVALID_TRANSITION",
          );
        }
      }
      return;
    case "CLAIM":
      requireExactRole(actor, ["EDITOR"]);
      return;
    case "RELEASE_CLAIM":
    case "REASSIGN_CLAIM":
      if (!(actor.role === "EDITOR" && actor.isEditorInChief)) {
        throw new AppError(403, "You do not have permission for this action.", "FORBIDDEN");
      }
      return;
    case "REQUEST_CHANGES":
    case "FORWARD":
    case "REJECT":
    case "UPDATE_EDITORIAL_CHECKLIST":
      requireExactRole(actor, ["EDITOR"]);
      if (!proposal.claimedByEditorId) {
        throw new AppError(
          409,
          "Claim this review before updating the checklist or making a decision.",
          "REVIEW_CLAIM_REQUIRED",
        );
      }
      if (proposal.claimedByEditorId !== actor.id) {
        throw new AppError(
          403,
          "Only the Editor who claimed this review can update it or make a decision.",
          "FORBIDDEN",
        );
      }
      return;
    case "RECALL":
      requireExactRole(actor, ["EDITOR"]);
      return;
    case "VOTE":
      if (actor.role === "BOARD") return;
      if (actor.role === "EDITOR") return;
      throw new AppError(403, "Only Board members can vote.", "FORBIDDEN");
    case "FORCE_STATUS":
      throw new AppError(
        410,
        "Direct proposal status forcing is removed. Finalize Board decisions through VotingSession commands or use the audited Admin override workflow.",
        "WORKFLOW_REMOVED",
      );
    case "ARCHIVE": {
      const isOwningMangaka = actor.role === "MANGAKA" && proposal.authorId === actor.id;
      const isEic = actor.role === "EDITOR" && actor.isEditorInChief;
      if (!isOwningMangaka && !isEic) {
        throw new AppError(403, "You do not have permission for this action.", "FORBIDDEN");
      }
      const reason =
        (typeof payload?.reason === "string" && payload.reason.trim()) ||
        (typeof payload?.archiveReason === "string" && payload.archiveReason.trim()) ||
        "";
      if (!reason) {
        throw new AppError(
          400,
          "A non-empty reason is required to archive a proposal.",
          "REASON_REQUIRED",
        );
      }
      return;
    }
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
  assertProposalAction(action, actor, proposal, payload);

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
      if (!["SUBMITTED", "PENDING_EDITOR"].includes(proposal.status))
        throw new AppError(
          400,
          "The current status does not allow this action.",
          "INVALID_TRANSITION",
        );
      if (proposal.claimedByEditorId) {
        throw new AppError(
          409,
          "This item was just claimed for review by another Editor.",
          "CONFLICT",
        );
      }

      const updatedDoc = await ProposalModel.findOneAndUpdate(
        {
          id: proposalId,
          status: { $in: ["SUBMITTED", "PENDING_EDITOR"] },
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
        throw new AppError(
          409,
          "This item was just claimed for review by another Editor.",
          "CONFLICT",
        );
      }

      await audit(req, "PROPOSAL_CLAIMED", "proposal", proposalId, {
        fromStatus,
        toStatus: "EDITOR_REVIEWING",
      });
      await notifyMany([
        {
          userId: proposal.authorId,
          kind: "proposal.claimed",
          message: `${actor.name} claimed proposal "${proposal.title}" for review.`,
        },
      ]);

      return toObject(updatedDoc.toObject());
    }

    case "RELEASE_CLAIM":
      if (
        !["SUBMITTED", "TANTOU_REVIEW", "PENDING_EDITOR", "EDITOR_REVIEWING"].includes(
          proposal.status,
        )
      ) {
        throw new AppError(
          400,
          "The current status does not allow this action.",
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
        message: `The claim on ${proposal.title} has been released.`,
      });
      break;

    case "REASSIGN_CLAIM":
      if (
        !["SUBMITTED", "TANTOU_REVIEW", "PENDING_EDITOR", "EDITOR_REVIEWING"].includes(
          proposal.status,
        )
      ) {
        throw new AppError(
          400,
          "The current status does not allow this action.",
          "INVALID_TRANSITION",
        );
      }
      if (!payload.editorId || !payload.editorName) {
        throw new AppError(400, "editorId and editorName are required.", "VALIDATION_ERROR");
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
        message: `${proposal.title} review was reassigned to ${payload.editorName}.`,
      });
      break;

    case "UPDATE_EDITORIAL_CHECKLIST": {
      if (!["EDITOR_REVIEWING", "RESUBMITTED"].includes(proposal.status)) {
        throw new AppError(
          409,
          "The checklist can only be updated during an active editor review.",
          "INVALID_TRANSITION",
        );
      }
      patch.editorialChecklist = {
        ...normalizeEditorialChecklist(payload),
        completedById: actor.id,
        completedByName: actor.name,
        updatedAt: new Date(),
      };
      break;
    }

    case "REQUEST_CHANGES": {
      if (
        ![
          "SUBMITTED",
          "TANTOU_REVIEW",
          "PENDING_EDITOR",
          "EDITOR_REVIEWING",
          "RESUBMITTED",
        ].includes(proposal.status)
      )
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
      if (
        ![
          "SUBMITTED",
          "TANTOU_REVIEW",
          "PENDING_EDITOR",
          "EDITOR_REVIEWING",
          "RESUBMITTED",
        ].includes(proposal.status)
      )
        throw new AppError(
          409,
          "Only editor-review proposals can be forwarded.",
          "INVALID_TRANSITION",
        );
      if (!editorialChecklistComplete(proposal.editorialChecklist)) {
        throw new AppError(
          409,
          "Complete all six editorial criteria before sending this proposal to the Board.",
          "EDITORIAL_CHECKLIST_INCOMPLETE",
        );
      }
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
      if (
        ![
          "SUBMITTED",
          "TANTOU_REVIEW",
          "PENDING_EDITOR",
          "EDITOR_REVIEWING",
          "RESUBMITTED",
        ].includes(proposal.status)
      )
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
      if (
        !["READY_FOR_BOARD", "PENDING_BOARD", "BOARD_REVIEW", "BOARD_VOTING"].includes(
          proposal.status,
        )
      )
        throw new AppError(409, "Only board proposals can be recalled.", "INVALID_TRANSITION");
      patch.status = "PENDING_EDITOR";
      patch.votes = [];
      break;

    case "VOTE": {
      if (actor.role === "EDITOR" && actor.isEditorInChief) {
        throw new AppError(
          410,
          "Editor-in-chief tie-break voting has been retired; tied sessions now open a re-vote.",
          "TIE_BREAK_RETIRED",
        );
      }
      if (proposal.status !== "BOARD_REVIEW")
        throw new AppError(409, "Proposal is not open for voting.", "INVALID_TRANSITION");
      const decision = normalizeVote(payload.voteDecision ?? payload.value ?? payload.decision);
      const sessionId = payload.sessionId ?? proposal.activeVotingSessionId ?? null;
      if (!sessionId) {
        throw new AppError(
          400,
          "sessionId is required for Board review votes.",
          "SESSION_ID_REQUIRED",
        );
      }
      const session = await VotingSessionModel.findOne({
        id: sessionId,
        targetType: "PROPOSAL",
        proposalId: proposal.id,
        status: "OPEN",
      }).lean();
      if (!session) {
        throw new AppError(
          409,
          "Active voting session not found for this proposal.",
          "SESSION_NOT_ACTIVE",
        );
      }
      assertSessionVersionMatches(session, payload);
      if (actor.role !== "BOARD") {
        throw new AppError(
          403,
          "Only Board members can vote in an open VotingSession.",
          "FORBIDDEN",
        );
      }
      const eligibleVoterIds =
        Array.isArray((session as any).eligibleVoterIds) &&
        (session as any).eligibleVoterIds.length > 0
          ? (session as any).eligibleVoterIds
          : DEFAULT_BOARD_ELIGIBLE_VOTER_IDS;
      if (!eligibleVoterIds.includes(actor.id)) {
        throw new AppError(403, "You are not eligible to vote in this VotingSession.", "FORBIDDEN");
      }
      const sessionVersion = String((session as any).proposalVersionId ?? "");
      const proposalVersion = proposalCurrentVersion(proposal);
      if (sessionVersion && sessionVersion !== proposalVersion) {
        throw new AppError(
          409,
          "Voting session snapshot is stale. Create a new Board review session.",
          "REVIEW_SNAPSHOT_STALE",
        );
      }
      const vote = {
        memberId: actor.id,
        memberName: actor.name,
        voterId: actor.id,
        voterName: actor.name,
        decision,
        comment: payload.comment ?? payload.note,
        createdAt: nowIso(),
        votedAt: new Date(),
        weight: 1,
        isChair: actor.isChair,
        isEditorInChief: actor.isEditorInChief,
      };
      const votes = [
        ...(proposal.votes ?? []).filter(
          (item: any) => normalizeBoardVote(item).memberId !== actor.id,
        ),
        vote,
      ];
      const tally = evaluateBoardTally(votes);

      // Keep a denormalized read cache only; VotingSession remains the source of truth.
      patch.votes = votes;

      // Write to source-of-truth collection
      await runWorkflowTransaction(async (tx) => {
        const updatedSession = await VotingSessionModel.findOneAndUpdate(
          { id: sessionId, status: "OPEN", ...expectedVersionFilter(payload) },
          { $inc: { version: 1 }, $set: { updatedAt: nowIso() } },
          { returnDocument: "after", session: tx },
        ).lean();
        if (!updatedSession) {
          throw new AppError(409, "Voting session changed while casting vote.", "VERSION_CONFLICT");
        }
        await ProposalVoteModel.findOneAndUpdate(
          { sessionId, proposalId: proposal.id, voterId: actor.id },
          {
            $set: {
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
            $setOnInsert: { id: id("pv") },
          },
          { upsert: true, session: tx },
        );
      });

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

    case "WITHDRAW":
      if (
        ![
          "DRAFT",
          "SUBMITTED",
          "TANTOU_REVIEW",
          "PENDING_EDITOR",
          "EDITOR_REVIEWING",
          "CHANGES_REQUESTED",
        ].includes(proposal.status)
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
      patch.status =
        proposal.assignedEditorId || proposal.claimedByEditorId
          ? "EDITOR_REVIEWING"
          : "PENDING_EDITOR";
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
      if (proposalHasBoardReviewLock(proposal)) {
        throw new AppError(
          409,
          "Proposal content is locked while a Board review snapshot is active.",
          "PROPOSAL_VERSION_LOCKED",
        );
      }
      {
        const activeSession = await VotingSessionModel.findOne({
          targetType: "PROPOSAL",
          proposalId: proposal.id,
          status: { $in: ["DRAFT", "OPEN", "CLOSED", "TIE_BREAK_REQUIRED"] },
        }).lean();
        if (activeSession) {
          throw new AppError(
            409,
            "Proposal content is locked while a Board review snapshot is active.",
            "PROPOSAL_VERSION_LOCKED",
          );
        }
      }
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

export {
  findChapterBlockingComments,
  sendChapterToEditorReview,
} from "./chapter-review.service.js";

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

  const isChapterAssignee =
    (actor.role === "MANGAKA" &&
      (chapter.assigneeId === actor.id || (series as any).authorId === actor.id)) ||
    (actor.role === "ASSISTANT" && chapter.assigneeId === actor.id);
  const isOwningMangaka = actor.role === "MANGAKA" && (series as any).authorId === actor.id;
  const isEditor = actor.role === "EDITOR";
  const isMangakaOrEditor = actor.role === "EDITOR" || actor.role === "MANGAKA";
  const fromStatus = chapter.status as ChapterStatus;

  // SUBMIT_REVIEW (first review) and RESUBMIT (after a requested revision) share
  // the same domain function so both freeze a fresh review snapshot and land in
  // TANTOU_REVIEW — a resubmit is reviewed by the Editor, never self-reviewed.
  // Each keeps its own from-status guard and audit action.
  if (action === "SUBMIT_REVIEW" || action === "RESUBMIT") {
    if (!isOwningMangaka) {
      throw new AppError(
        403,
        "Only the owning Mangaka can submit this chapter for review.",
        actor.role === "MANGAKA" ? "MANGAKA_OWNER_REQUIRED" : "FORBIDDEN",
      );
    }
    const result = await sendChapterToEditorReviewCommand(req, chapterId, action);
    return result.chapter;
  }

  // Chapter status state machine. SUBMIT_REVIEW/RESUBMIT are handled above.
  const transition: Partial<
    Record<
      ChapterAction,
      {
        from?: string[];
        to?: ChapterStatus;
        owner?: boolean;
        editor?: boolean;
        mangakaOrEditor?: boolean;
      }
    >
  > = {
    // SUBMIT_REVIEW and RESUBMIT are handled earlier via sendChapterToEditorReview.
    START_DRAFT: { from: ["PLANNED"], to: "IN_PRODUCTION", owner: true },
    START_ASSISTANT_WORK: { from: ["IN_PRODUCTION"], to: "IN_PRODUCTION", mangakaOrEditor: true },
    REQUEST_REVISION: { from: ["TANTOU_REVIEW"], to: "REVISION_REQUIRED", editor: true },
    REJECT: { from: ["TANTOU_REVIEW"], to: "REVISION_REQUIRED", editor: true },
    EDITOR_APPROVE: {
      from: ["TANTOU_REVIEW"],
      to: "READY_FOR_PUBLICATION",
      editor: true,
    },
    // Scheduling lives on Publication.status, not on the chapter. The chapter
    // stays READY_FOR_PUBLICATION while a Publication is SCHEDULED, and only
    // moves to PUBLISHED when it actually publishes.
    SCHEDULE: { from: ["READY_FOR_PUBLICATION"], editor: true },
    POSTPONE: { from: ["READY_FOR_PUBLICATION"], editor: true },
    PUBLISH: { from: ["READY_FOR_PUBLICATION"], to: "PUBLISHED", editor: true },
    PUBLISH_EARLY: { from: ["READY_FOR_PUBLICATION"], to: "PUBLISHED", editor: true },
    REASSIGN: { editor: true },
    ARCHIVE: { editor: true },
  };

  const rule = transition[action];
  if (!rule) throw new AppError(400, `Unknown chapter action: ${action}`, "INVALID_ACTION");
  if (rule.owner && !isChapterAssignee) {
    throw new AppError(
      403,
      "Only the owning Mangaka can perform this chapter action.",
      actor.role === "MANGAKA" ? "MANGAKA_OWNER_REQUIRED" : "FORBIDDEN",
    );
  }
  if (rule.editor && !isEditor)
    throw new AppError(403, "Editor permission is required.", "FORBIDDEN");
  if (rule.editor) {
    await assertAssignedSeriesEditor(actor, series);
  }
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
    throw new AppError(
      409,
      `Chapter transition is not valid from status "${fromStatus}".`,
      "INVALID_TRANSITION",
    );
  }

  if (action === "SCHEDULE" && fromStatus !== "READY_FOR_PUBLICATION") {
    throw new AppError(
      409,
      "Chapter must be READY_FOR_PUBLICATION before scheduling.",
      "NOT_READY_FOR_PUBLICATION",
    );
  }

  if (action === "EDITOR_APPROVE") {
    const [tasks, submissions] = await Promise.all([
      StudioTaskModel.find({ chapterId }).lean(),
      SubmissionModel.find({ chapterId }).lean(),
    ]);
    const unverifiedBlockingComments = await findChapterBlockingComments(
      chapter,
      tasks,
      submissions,
      ["RESOLVED"],
    );
    if (unverifiedBlockingComments.length > 0) {
      throw new AppError(
        409,
        "Every blocking comment must be verified as resolved before approval.",
        "BLOCKING_COMMENTS_UNVERIFIED",
      );
    }
  }

  // POSTPONE/PUBLISH require an existing SCHEDULED Publication; that is enforced
  // in each action body below (chapter status stays READY_FOR_PUBLICATION until
  // it actually publishes).

  const patch: Record<string, unknown> = { updatedAt: nowIso() };
  if (rule.to) patch.status = rule.to;

  if (["EDITOR_APPROVE", "REQUEST_REVISION", "REJECT"].includes(action)) {
    const snapshot = chapter.reviewSnapshot;
    if (!snapshot) {
      throw new AppError(
        409,
        "Review snapshot is required before Tantou review.",
        "REVIEW_SNAPSHOT_REQUIRED",
      );
    }
    const currentChapterVersion = chapterReviewVersion(chapter);
    if (
      snapshot.chapterVersionId &&
      currentChapterVersion &&
      String(snapshot.chapterVersionId) !== currentChapterVersion
    ) {
      throw new AppError(
        409,
        "Review snapshot is stale. Create a new review snapshot.",
        "REVIEW_SNAPSHOT_STALE",
      );
    }
    const snapshotPageVersions = new Map(
      ((snapshot.pageVersionIds ?? []) as any[]).map((item) => [
        String(item.pageId),
        String(item.pageVersionId),
      ]),
    );
    const stalePage = ((chapter.pages ?? []) as any[]).find((page) => {
      const expected = snapshotPageVersions.get(String(page.id));
      if (!expected) return false;
      const current = pageReviewVersion(page);
      return current && expected !== current;
    });
    if (stalePage) {
      throw new AppError(
        409,
        "Review snapshot is stale. Create a new review snapshot.",
        "REVIEW_SNAPSHOT_STALE",
      );
    }
  }

  if (action === "SCHEDULE") {
    await scheduleChapterPublication(req, chapter, series, chapterId, payload);
  }
  if (action === "POSTPONE") {
    await postponeChapterPublication(req, chapterId, fromStatus);
  }
  if (action === "PUBLISH" || action === "PUBLISH_EARLY") {
    const publishedAt = await publishChapter(
      req,
      chapter,
      series,
      chapterId,
      fromStatus,
      action === "PUBLISH_EARLY",
    );
    patch.publishedAt = publishedAt;
    patch.publishedById = actor.id;
  }
  if (action === "EDITOR_APPROVE") {
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
    await StudioCommentModel.create({
      id: id("cmt"),
      seriesId: chapter.seriesId,
      chapterId,
      pageId: String(payload.targetType).toUpperCase() === "PAGE" ? payload.targetId : undefined,
      targetType: String(payload.targetType).toUpperCase(),
      targetId: payload.targetId,
      targetVersionId: payload.targetVersionId,
      authorId: actor.id,
      authorName: actor.name,
      authorRole: actor.role,
      body: note,
      text: note,
      isBlocking: true,
      status: "OPEN",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  }
  if (action === "REASSIGN") {
    if (!payload.newAssigneeId)
      throw new AppError(400, "New assignee is required.", "VALIDATION_ERROR");
    const newAssignee = await UserModel.findOne({ id: payload.newAssigneeId }).lean();
    if (!newAssignee) throw new AppError(404, "Assignee not found.", "ASSIGNEE_NOT_FOUND");
    patch.assigneeId = payload.newAssigneeId;
    patch.assigneeName = (newAssignee as any).name;
  }
  if (action === "ARCHIVE") {
    if (fromStatus === "ARCHIVED") {
      throw new AppError(409, "Chapter is already archived.", "INVALID_TRANSITION");
    }
    patch.status = "ARCHIVED";
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
  const reviewDecisionStatus = chapterReviewDecisionStatus(action);
  if (reviewDecisionStatus) {
    await ChapterReviewModel.findOneAndUpdate(
      { chapterId, status: "OPEN" },
      {
        $set: {
          status: reviewDecisionStatus,
          decidedById: actor.id,
          decidedAt: new Date(),
          decisionAction: action,
          updatedAt: nowIso(),
        },
      },
      { returnDocument: "after" },
    );
  }
  if (action === "EDITOR_APPROVE") {
    const pages = (chapter.pages ?? []).map((page: any) => ({
      ...page,
      status: "FINALIZED",
      updatedAt: nowIso(),
    }));
    await ChapterModel.updateOne({ id: chapterId }, { $set: { pages } });
    await audit(req, "CHAPTER_TANTOU_APPROVED", "chapter", chapterId, {
      pageIds: pages.map((page: any) => page.id),
    });
    await StudioRegionModel.updateMany(
      { chapterId, status: "APPROVED" },
      { $set: { status: "DONE", updatedAt: nowIso() } },
    );
  }
  if (action === "REQUEST_REVISION" || action === "REJECT") {
    const pages = (chapter.pages ?? []).map((page: any) => ({
      ...page,
      status: "REVISION_REQUIRED",
      updatedAt: nowIso(),
    }));
    await ChapterModel.updateOne({ id: chapterId }, { $set: { pages } });
    await audit(
      req,
      action === "REJECT" ? "CHAPTER_TANTOU_REJECTED" : "CHAPTER_TANTOU_REVISION_REQUESTED",
      "chapter",
      chapterId,
      { targetType: payload.targetType, targetId: payload.targetId },
    );
  }
  await audit(req, `chapter.${action.toLowerCase()}`, "chapter", chapterId, {
    fromStatus,
    toStatus: event.toStatus,
  });
  return toObject(await ChapterModel.findOne({ id: chapterId }).lean());
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
      chaptersInReview: chapters.filter((c: any) => c.status === "TANTOU_REVIEW").length,
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
    status: {
      $in: ["READY_FOR_BOARD", "BOARD_REVIEW", "PENDING_BOARD", "BOARD_VOTING", "TIE_BREAK"],
    },
  })
    .sort({ updatedAt: -1 })
    .lean();
  const proposalIds = proposals.map((proposal: any) => proposal.id);
  const [sessions, sessionVotes] = await Promise.all([
    VotingSessionModel.find({
      targetType: "PROPOSAL",
      proposalId: { $in: proposalIds },
      status: { $in: ["OPEN", "TIE_BREAK_REQUIRED"] },
    }).lean(),
    ProposalVoteModel.find({ proposalId: { $in: proposalIds } }).lean(),
  ]);
  const sessionByProposal = new Map(
    sessions.map((session: any) => [String(session.proposalId), session]),
  );
  const proposalItems = proposals.map((proposal: any) => {
    const session = sessionByProposal.get(String(proposal.id));
    const eligibleVoterIds =
      Array.isArray((session as any)?.eligibleVoterIds) &&
      (session as any).eligibleVoterIds.length > 0
        ? (session as any).eligibleVoterIds
        : DEFAULT_BOARD_ELIGIBLE_VOTER_IDS;
    const votes = (
      session
        ? sessionVotes.filter((vote: any) => vote.sessionId === session.id)
        : (proposal.votes ?? [])
    ).filter((vote: any) => eligibleVoterIds.includes(String(vote.voterId ?? vote.memberId)));
    const quorum = Number((session as any)?.quorum ?? BOARD_QUORUM);
    const tally = evaluateBoardTally(votes, quorum, eligibleVoterIds.length);
    const canFinalize =
      Boolean(session) &&
      (tally.approve >= quorum || tally.reject >= quorum || tally.total >= eligibleVoterIds.length);
    const sessionStatus = String((session as any)?.status ?? "");
    const isTieBreak = sessionStatus === "TIE_BREAK_REQUIRED" || proposal.status === "TIE_BREAK";
    return {
      id: proposal.id,
      seriesId: proposal.id,
      seriesTitle: proposal.title,
      title: proposal.title,
      seriesStatus: "BOARD_REVIEW",
      decisionStatus: isTieBreak ? "TIE_BREAK_REQUIRED" : "PENDING",
      votingSessionId: (session as any)?.id ?? proposal.activeVotingSessionId ?? null,
      proposalVersionId:
        (session as any)?.proposalVersionId ?? proposal.activeProposalVersionId ?? null,
      expectedVersion: (session as any)?.version ?? null,
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
        pending: Math.max(eligibleVoterIds.length - tally.total, 0),
        eligible: eligibleVoterIds.length,
        quorum,
        canFinalize,
      },
      eligibleBoardCount: eligibleVoterIds.length,
      quorum,
      voteCount: tally.total,
      canFinalize,
      activeVotingSessionId: proposal.activeVotingSessionId ?? null,
      sessionId: proposal.activeVotingSessionId ?? null,
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
      status: [
        "READY_FOR_BOARD",
        "BOARD_REVIEW",
        "PENDING_BOARD",
        "BOARD_VOTING",
        "TIE_BREAK",
      ].includes(value.status)
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

export { closeVotingSession, cancelVotingSession } from "./proposal-governance.service.js";
export {
  applyTaskAction,
  assertTaskAssigneeEligible,
  reopenTaskForRevision,
  submissionDecision,
  submitTaskWork,
  taskDetail,
} from "./task-submission.service.js";
