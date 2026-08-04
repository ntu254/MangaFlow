import {
  BoardDecisionModel,
  ProposalModel,
  ProposalVoteModel,
  VotingSessionModel,
} from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { AppError } from "../lib/http.js";
import { audit } from "./audit.service.js";
import {
  BOARD_QUORUM,
  BOARD_MAX_VOTING_ROUND,
  normalizeTiePolicy,
  evaluateBoardTally,
} from "./board-governance.service.js";
import {
  ensureProductionSeriesForApprovedProposal,
  normalizePublicationType,
} from "./proposal-lifecycle.service.js";
import {
  assertSessionVersionMatches,
  createAuditEntry,
  createOutboxEvent,
  expectedVersionFilter,
  runWorkflowTransaction,
  toObject,
} from "./workflow-support.service.js";
import type { AuthedRequest, RequestActor } from "../types.js";

type TieResolutionDecision = "APPROVED" | "REJECTED";

function ensureActor(req: AuthedRequest) {
  if (!req.actor) throw new AppError(401, "Missing authenticated user.", "MISSING_AUTH");
  return req.actor;
}

function requireBoardChairActor(actor: RequestActor) {
  if (!(actor.role === "BOARD" && actor.isChair)) {
    throw new AppError(403, "Board chair permission is required.", "BOARD_CHAIR_REQUIRED");
  }
}

function proposalCurrentVersion(proposal: any) {
  return String(
    proposal?.currentVersionId ??
      proposal?.currentVersion ??
      proposal?.version ??
      proposal?.manuscripts?.[proposal.manuscripts.length - 1]?.version ??
      "1",
  );
}

export async function closeVotingSession(
  req: AuthedRequest,
  sessionId: string,
  note?: string,
  publicationType?: unknown,
) {
  const actor = ensureActor(req);
  requireBoardChairActor(actor);
  const closingNote = typeof note === "string" && note.trim() ? note.trim() : undefined;
  const session = await VotingSessionModel.findOne({ id: sessionId });
  if (!session) throw new AppError(404, "Voting session not found.", "SESSION_NOT_FOUND");
  if (
    ["FINALIZED", "NO_QUORUM", "CANCELLED", "TIED"].includes(
      String((session as any).status),
    )
  ) {
    return toObject(session);
  }
  if ((session as any).status !== "OPEN")
    throw new AppError(409, "Voting session is not open.", "INVALID_TRANSITION");
  assertSessionVersionMatches(session, req.body ?? {});
  const proposalIds = [
    ...new Set(
      [(session as any).proposalId, ...(((session as any).proposalIds ?? []) as string[])].filter(
        Boolean,
      ),
    ),
  ];
  const proposals = (await ProposalModel.find({ id: { $in: proposalIds } }).lean()) as any[];
  const staleProposal = proposals.find((proposal) => {
    const sessionVersion = String((session as any).proposalVersionId ?? "");
    return sessionVersion && sessionVersion !== proposalCurrentVersion(proposal);
  });
  if (staleProposal) {
    throw new AppError(
      409,
      "Voting session snapshot is stale. Create a new Board review session.",
      "REVIEW_SNAPSHOT_STALE",
    );
  }
  const votes = await ProposalVoteModel.find({ sessionId }).lean();
  const eligibleVoterIds = (session as any).eligibleVoterIds;
  if (!Array.isArray(eligibleVoterIds) || eligibleVoterIds.length === 0) {
    throw new AppError(409, "Voting session has no electorate snapshot.", "ELECTORATE_SNAPSHOT_REQUIRED");
  }
  const quorum = Number((session as any).quorum ?? BOARD_QUORUM);
  const outcomes = proposalIds.map((proposalId: string) => {
    const proposalVotes = votes.filter(
      (vote: any) =>
        vote.proposalId === proposalId &&
        eligibleVoterIds.includes(String(vote.voterId ?? vote.memberId)),
    );
    const tally = evaluateBoardTally(proposalVotes, quorum, eligibleVoterIds.length);
    const approved = tally.status === "APPROVED";
    const rejected = tally.status === "REJECTED";
    const allEligibleVoted = tally.total >= eligibleVoterIds.length;
    const tied = allEligibleVoted && tally.approve === tally.reject;
    const decision = approved
      ? "APPROVED"
      : rejected
        ? "REJECTED"
        : tied
          ? "TIED"
          : "NO_QUORUM";
    return {
      proposalId,
      decision,
      approveCount: tally.approve,
      rejectCount: tally.reject,
      finalReason: decision === "NO_QUORUM" ? "Voting session closed without quorum." : undefined,
    };
  });
  const hasNoQuorum = outcomes.some((outcome) => outcome.decision === "NO_QUORUM");
  const hasTie = outcomes.some((outcome) => outcome.decision === "TIED");
  const approved =
    outcomes.length > 0 && outcomes.every((outcome) => outcome.decision === "APPROVED");
  const rejected =
    outcomes.length > 0 && outcomes.every((outcome) => outcome.decision === "REJECTED");

  const votingRound = Math.min(
    Math.max(Number((session as any).votingRound ?? ((session as any).reVoteOfSessionId ? 2 : 1)), 1),
    BOARD_MAX_VOTING_ROUND,
  );
  const tiePolicy = normalizeTiePolicy((session as any).tiePolicy);
  const opensReVote = hasTie && !hasNoQuorum && votingRound < BOARD_MAX_VOTING_ROUND;
  const finalTieResolution = hasTie && !opensReVote && !hasNoQuorum;
  const autoRejectTie = finalTieResolution && tiePolicy === "REJECT";
  const returnsToBoard = finalTieResolution && tiePolicy === "RETURN_TO_BOARD";
  const waitsForChair = finalTieResolution && tiePolicy === "CHAIR_DECIDES";
  const nextStatus = hasNoQuorum
    ? "NO_QUORUM"
    : opensReVote || waitsForChair || returnsToBoard
      ? "TIED"
      : "FINALIZED";
  const result = approved ? "APPROVED" : rejected ? "REJECTED" : null;
  const resolvedResult = autoRejectTie ? "REJECTED" : result;
  const sessionOutcomes = autoRejectTie
    ? outcomes.map((outcome) => ({
        ...outcome,
        decision: "REJECTED",
        finalReason: "The configured tie policy rejected the proposal after the re-vote.",
      }))
    : outcomes;
  const now = nowIso();
  const approvedPublicationType =
    normalizePublicationType(publicationType) ??
    normalizePublicationType((session as any).publicationCadence);

  return runWorkflowTransaction(async (tx) => {
    const updatedSession = await VotingSessionModel.findOneAndUpdate(
      {
        id: sessionId,
        status: (session as any).status,
        version: (session as any).version,
        ...expectedVersionFilter(req.body ?? {}),
      },
      {
        $set: {
          status: nextStatus,
          result: resolvedResult,
          outcomes: sessionOutcomes,
          votingRound,
          tiePolicy,
          tieResolution: opensReVote
            ? "PENDING"
            : autoRejectTie
              ? "REJECTED"
              : returnsToBoard
                ? "RETURNED_TO_BOARD"
                : waitsForChair
                  ? "PENDING"
                  : (session as any).tieResolution ?? "PENDING",
          closedAt: new Date(),
          finalizedById: actor.id,
          finalizedAt: new Date(),
          ...(approvedPublicationType ? { publicationCadence: approvedPublicationType } : {}),
          ...(closingNote ? { closingNote } : {}),
          updatedAt: now,
        },
        $inc: { version: 1 },
        ...(closingNote
          ? {
              $push: {
                notes: {
                  id: id("note"),
                  authorId: actor.id,
                  authorName: actor.name,
                  authorRole: actor.role,
                  body: closingNote,
                  createdAt: nowIso(),
                  kind: "FINALIZE",
                },
              },
            }
          : {}),
      },
      { returnDocument: "after", session: tx },
    ).lean();
    if (!updatedSession)
      throw new AppError(409, "Voting session changed while closing.", "VERSION_CONFLICT");

    if (opensReVote) {
      const [reVoteSession] = await VotingSessionModel.create(
        [
          {
            id: id("vs"),
            title: (session as any).title,
            mode: (session as any).mode,
            targetType: "PROPOSAL",
            proposalId: (session as any).proposalId,
            proposalVersionId: (session as any).proposalVersionId,
            reVoteOfSessionId: sessionId,
            votingRound: votingRound + 1,
            tiePolicy,
            tieResolution: "PENDING",
            status: "OPEN",
            version: 1,
            proposalIds: [...((session as any).proposalIds ?? proposalIds)],
            eligibleVoterIds: [...eligibleVoterIds],
            quorum,
            chairId: (session as any).chairId,
            rules: (session as any).rules,
            createdById: actor.id,
            createdByName: actor.name,
            openedAt: now,
            outcomes: [],
            notes: [],
          },
        ],
        { session: tx },
      );
      const proposalTransition = await ProposalModel.updateMany(
        {
          id: { $in: proposalIds },
          status: "BOARD_REVIEW",
          activeVotingSessionId: sessionId,
          activeProposalVersionId: (session as any).proposalVersionId,
        },
        {
          $set: {
            activeVotingSessionId: (reVoteSession as any).id,
            activeProposalVersionId: (session as any).proposalVersionId,
            updatedAt: now,
          },
        },
        { session: tx },
      );
      if (proposalTransition.matchedCount !== proposalIds.length) {
        throw new AppError(
          409,
          "Proposal changed while opening the re-vote session.",
          "PROPOSAL_STATE_CHANGED",
        );
      }
      await createAuditEntry(
        req,
        "BOARD_REVOTE_STARTED",
        "voting_session",
        (reVoteSession as any).id,
        { reVoteOfSessionId: sessionId, proposalIds },
        tx,
      );
      await createOutboxEvent(
        "board.session.revote_started",
        "voting_session",
        (reVoteSession as any).id,
        { reVoteOfSessionId: sessionId, proposalIds },
        tx,
      );
    } else if (hasNoQuorum) {
      await ProposalModel.updateMany(
        {
          id: { $in: proposalIds },
          status: { $in: ["BOARD_REVIEW", "PENDING_BOARD"] },
        },
        {
          $set: { status: "PENDING_BOARD", updatedAt: now },
          $unset: { activeVotingSessionId: 1, activeProposalVersionId: 1 },
        },
        { session: tx },
      );
    } else if (returnsToBoard) {
      await ProposalModel.updateMany(
        {
          id: { $in: proposalIds },
          status: "BOARD_REVIEW",
          activeVotingSessionId: sessionId,
        },
        {
          $set: { status: "PENDING_BOARD", updatedAt: now },
          $unset: { activeVotingSessionId: 1, activeProposalVersionId: 1 },
        },
        { session: tx },
      );
    } else if (approved || rejected || autoRejectTie) {
      await ProposalModel.updateMany(
        {
          id: { $in: proposalIds },
          status: { $in: ["BOARD_REVIEW", "PENDING_BOARD"] },
        },
        {
          $set: {
            status: approved ? "APPROVED" : "REJECTED",
            ...(approved
              ? {
                  approvedAt: new Date(),
                  approvedById: actor.id,
                  ...(approvedPublicationType
                    ? { boardApprovedPublicationType: approvedPublicationType }
                    : {}),
                }
              : { rejectedAt: new Date(), rejectedById: actor.id }),
            updatedAt: now,
          },
          $unset: { activeVotingSessionId: 1, activeProposalVersionId: 1 },
        },
        { session: tx },
      );

      if (approved) {
        const approvedProposals = await ProposalModel.find({
          id: { $in: proposalIds },
          status: "APPROVED",
        })
          .session(tx)
          .lean();
        for (const proposal of approvedProposals) {
          await ensureProductionSeriesForApprovedProposal(proposal, tx);
        }
      }

      for (const proposalId of proposalIds) {
        const proposalVersionId = String((session as any).proposalVersionId ?? "1");
        const tally = outcomes.find((outcome) => outcome.proposalId === proposalId) ?? {};
        await BoardDecisionModel.findOneAndUpdate(
          { votingSessionId: sessionId },
          {
            $setOnInsert: {
              id: id("bd"),
              votingSessionId: sessionId,
              proposalId,
              proposalVersionId,
              result: resolvedResult,
              eligibleVoterSnapshot: eligibleVoterIds,
              quorumSnapshot: quorum,
              tallySnapshot: tally,
              decidedBy: { id: actor.id, name: actor.name, role: actor.role },
              decidedAt: new Date(),
              publicationCadence: approvedPublicationType ?? (session as any).publicationCadence,
              reason:
                (tally as any).finalReason ??
                (autoRejectTie
                  ? "The configured tie policy rejected the proposal after the re-vote."
                  : undefined),
              createdAt: new Date(),
            },
          },
          { upsert: true, returnDocument: "after", session: tx },
        );
      }
    }

    await createAuditEntry(
      req,
      waitsForChair
        ? "BOARD_TIE_RESOLUTION_REQUIRED"
        : hasTie && !opensReVote
          ? "BOARD_TIE_RESOLVED"
          : "BOARD_SESSION_FINALIZED",
      "voting_session",
      sessionId,
      {
        closedById: actor.id,
        status: nextStatus,
        result: resolvedResult,
        votingRound,
        tiePolicy,
        ...(hasTie
          ? {
              tieResolution: autoRejectTie
                ? "REJECTED"
                : returnsToBoard
                  ? "RETURNED_TO_BOARD"
                  : waitsForChair
                    ? "PENDING"
                    : opensReVote
                      ? "PENDING"
                      : undefined,
            }
          : {}),
        ...(closingNote ? { note: closingNote } : {}),
      },
      tx,
    );
    await createOutboxEvent(
      waitsForChair
        ? "board.session.tie_resolution_required"
        : hasTie && !opensReVote
          ? "board.session.tie_resolved"
          : "board.session.finalized",
      "voting_session",
      sessionId,
      {
        status: nextStatus,
        result: resolvedResult,
        proposalIds,
        votingRound,
        tiePolicy,
      },
      tx,
    );
    return toObject(updatedSession);
  });
}

export async function resolveTiedVotingSession(
  req: AuthedRequest,
  sessionId: string,
  decision: TieResolutionDecision,
  note?: string,
) {
  const actor = ensureActor(req);
  requireBoardChairActor(actor);
  if (decision !== "APPROVED" && decision !== "REJECTED") {
    throw new AppError(400, "Tie resolution must be APPROVED or REJECTED.", "VALIDATION_ERROR");
  }
  const resolutionNote = typeof note === "string" ? note.trim() : "";
  if (!resolutionNote) {
    throw new AppError(400, "A reason is required to resolve a tied vote.", "VALIDATION_ERROR");
  }

  const session = (await VotingSessionModel.findOne({ id: sessionId }).lean()) as any;
  if (!session) throw new AppError(404, "Voting session not found.", "SESSION_NOT_FOUND");
  const votingRound = Number(
    session.votingRound ?? (session.reVoteOfSessionId ? BOARD_MAX_VOTING_ROUND : 1),
  );
  const tiePolicy = normalizeTiePolicy(session.tiePolicy);
  if (session.tieResolution && session.tieResolution !== "PENDING") {
    return toObject(session);
  }
  if (session.status !== "TIED" || votingRound < BOARD_MAX_VOTING_ROUND) {
    throw new AppError(
      409,
      "Only the final tied re-vote can be resolved by the Chair.",
      "TIE_RESOLUTION_NOT_READY",
    );
  }
  if (tiePolicy !== "CHAIR_DECIDES") {
    throw new AppError(
      409,
      "This tied session is resolved by its configured policy.",
      "TIE_POLICY_AUTOMATIC",
    );
  }
  const proposalIds = [
    ...new Set(
      [session.proposalId, ...(session.proposalIds ?? [])].filter(Boolean) as string[],
    ),
  ];
  const eligibleVoterIds = Array.isArray(session.eligibleVoterIds)
    ? session.eligibleVoterIds.map(String)
    : [];
  const quorum = Number(session.quorum ?? BOARD_QUORUM);
  const now = nowIso();
  const outcomes = Array.isArray(session.outcomes) ? session.outcomes : [];
  const finalOutcomes = outcomes.map((outcome: any) => ({
    ...outcome,
    decision,
    finalReason: resolutionNote,
  }));

  return runWorkflowTransaction(async (tx) => {
    const updatedSession = await VotingSessionModel.findOneAndUpdate(
      {
        id: sessionId,
        status: "TIED",
        version: session.version,
        tiePolicy: "CHAIR_DECIDES",
        tieResolution: { $in: ["PENDING", null] },
        ...expectedVersionFilter(req.body ?? {}),
      },
      {
        $set: {
          status: "FINALIZED",
          result: decision,
          outcomes: finalOutcomes,
          tieResolution: decision,
          tieResolutionNote: resolutionNote,
          tieResolvedById: actor.id,
          tieResolvedAt: new Date(),
          finalizedById: actor.id,
          finalizedAt: new Date(),
          updatedAt: now,
        },
        $inc: { version: 1 },
      },
      { returnDocument: "after", session: tx },
    ).lean();
    if (!updatedSession) {
      throw new AppError(409, "Voting session changed while resolving the tie.", "VERSION_CONFLICT");
    }

    const proposalTransition = await ProposalModel.updateMany(
      {
        id: { $in: proposalIds },
        status: "BOARD_REVIEW",
        activeVotingSessionId: sessionId,
      },
      {
        $set: {
          status: decision,
          ...(decision === "APPROVED"
            ? { approvedAt: new Date(), approvedById: actor.id }
            : { rejectedAt: new Date(), rejectedById: actor.id }),
          updatedAt: now,
        },
        $unset: { activeVotingSessionId: 1, activeProposalVersionId: 1 },
      },
      { session: tx },
    );
    if (proposalTransition.matchedCount !== proposalIds.length) {
      throw new AppError(
        409,
        "Proposal changed while resolving the tied vote.",
        "PROPOSAL_STATE_CHANGED",
      );
    }

    if (decision === "APPROVED") {
      const approvedProposals = await ProposalModel.find({
        id: { $in: proposalIds },
        status: "APPROVED",
      })
        .session(tx)
        .lean();
      for (const proposal of approvedProposals) {
        await ensureProductionSeriesForApprovedProposal(proposal, tx);
      }
    }

    for (const proposalId of proposalIds) {
      const tally = outcomes.find((outcome: any) => outcome.proposalId === proposalId) ?? {};
      await BoardDecisionModel.findOneAndUpdate(
        { votingSessionId: sessionId },
        {
          $setOnInsert: {
            id: id("bd"),
            votingSessionId: sessionId,
            proposalId,
            proposalVersionId: String(session.proposalVersionId ?? "1"),
            result: decision,
            eligibleVoterSnapshot: eligibleVoterIds,
            quorumSnapshot: quorum,
            tallySnapshot: { ...tally, decision },
            decidedBy: { id: actor.id, name: actor.name, role: actor.role },
            decidedAt: new Date(),
            reason: resolutionNote,
            createdAt: new Date(),
          },
        },
        { upsert: true, returnDocument: "after", session: tx },
      );
    }

    await createAuditEntry(
      req,
      "BOARD_TIE_RESOLVED",
      "voting_session",
      sessionId,
      { decision, note: resolutionNote, votingRound, tiePolicy, proposalIds },
      tx,
    );
    await createOutboxEvent(
      "board.session.tie_resolved",
      "voting_session",
      sessionId,
      { decision, votingRound, tiePolicy, proposalIds },
      tx,
    );

    return toObject(updatedSession);
  });
}

export async function cancelVotingSession(req: AuthedRequest, sessionId: string) {
  const actor = ensureActor(req);
  requireBoardChairActor(actor);
  const cancelNote =
    typeof (req.body as any)?.note === "string" && (req.body as any).note.trim()
      ? (req.body as any).note.trim()
      : undefined;
  const existing = await VotingSessionModel.findOne({ id: sessionId }).lean();
  if (!existing) throw new AppError(404, "Voting session not found.", "SESSION_NOT_FOUND");
  return runWorkflowTransaction(async (tx) => {
    const session = await VotingSessionModel.findOne({ id: sessionId }).session(tx);
    if (!session) throw new AppError(404, "Voting session not found.", "SESSION_NOT_FOUND");
    if (String((session as any).status) === "CANCELLED") {
      return toObject(session);
    }
    if (String((session as any).status) !== "OPEN") {
      throw new AppError(
        409,
        "Only an active voting session can be cancelled.",
        "INVALID_TRANSITION",
      );
    }
    // A Chair viewing a stale tally (e.g. a session that reached quorum
    // moments ago) must not be able to cancel it out from under a decisive
    // result -- the status check above only catches a status transition,
    // not a content change like a new vote landing.
    assertSessionVersionMatches(session, req.body ?? {});
    const proposalId = String((session as any).proposalId ?? "");
    const proposalIds = [
      ...new Set([proposalId, ...((session as any).proposalIds ?? [])].filter(Boolean)),
    ];
    const proposals = await ProposalModel.find({ id: { $in: proposalIds } }).session(tx);
    if (
      !proposals.length ||
      proposals.some((proposal) => String(proposal.status) !== "BOARD_REVIEW")
    ) {
      throw new AppError(
        409,
        "Proposal is not in a cancellable Board review state.",
        "INVALID_TRANSITION",
      );
    }
    const updatedSession = await VotingSessionModel.findOneAndUpdate(
      {
        id: sessionId,
        status: "OPEN",
        version: (session as any).version,
        ...expectedVersionFilter(req.body ?? {}),
      },
      {
        $set: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelNote: cancelNote ?? null,
          updatedAt: new Date(),
        },
        $inc: { version: 1 },
      },
      { returnDocument: "after", session: tx },
    ).lean();
    if (!updatedSession) {
      throw new AppError(
        409,
        "Voting session changed while applying this command.",
        "VERSION_CONFLICT",
      );
    }
    await ProposalModel.updateMany(
      { id: { $in: proposalIds }, status: "BOARD_REVIEW" },
      {
        $set: { status: "PENDING_BOARD", updatedAt: new Date() },
        $unset: { activeVotingSessionId: 1, activeProposalVersionId: 1 },
      },
      { session: tx },
    );
    await audit(
      req,
      "voting_session.cancel",
      "voting_session",
      sessionId,
      { proposalIds, note: cancelNote ?? null },
      tx,
    );
    return toObject(updatedSession);
  });
}
