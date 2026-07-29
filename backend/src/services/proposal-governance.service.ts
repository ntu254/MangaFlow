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
  DEFAULT_BOARD_ELIGIBLE_VOTER_IDS,
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
    ["FINALIZED", "NO_QUORUM", "CANCELLED", "TIED", "TIE_BREAK_REQUIRED"].includes(
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
  const eligibleVoterIds =
    Array.isArray((session as any).eligibleVoterIds) && (session as any).eligibleVoterIds.length > 0
      ? (session as any).eligibleVoterIds
      : DEFAULT_BOARD_ELIGIBLE_VOTER_IDS;
  const quorum = Number((session as any).quorum ?? BOARD_QUORUM);
  const outcomes = proposalIds.map((proposalId: string) => {
    const proposalVotes = votes.filter(
      (vote: any) =>
        vote.proposalId === proposalId &&
        eligibleVoterIds.includes(String(vote.voterId ?? vote.memberId)),
    );
    const tally = evaluateBoardTally(proposalVotes, quorum, eligibleVoterIds.length);
    const approved = tally.approve >= quorum;
    const rejected = tally.reject >= quorum;
    const allEligibleVoted = proposalVotes.length >= eligibleVoterIds.length;
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
      abstainCount: tally.abstain,
      finalReason: decision === "NO_QUORUM" ? "Voting session closed without quorum." : undefined,
    };
  });
  const hasNoQuorum = outcomes.some((outcome) => outcome.decision === "NO_QUORUM");
  const hasTie = outcomes.some((outcome) => outcome.decision === "TIED");
  const approved =
    outcomes.length > 0 && outcomes.every((outcome) => outcome.decision === "APPROVED");
  const rejected =
    outcomes.length > 0 && outcomes.every((outcome) => outcome.decision === "REJECTED");

  const nextStatus = hasNoQuorum ? "NO_QUORUM" : hasTie ? "TIED" : "FINALIZED";
  const result = approved ? "APPROVED" : rejected ? "REJECTED" : null;
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
          result,
          outcomes,
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

    if (hasTie) {
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
          status: { $in: ["BOARD_REVIEW", "BOARD_VOTING", "PENDING_BOARD"] },
        },
        {
          $set: { status: "PENDING_BOARD", updatedAt: now },
          $unset: { activeVotingSessionId: 1, activeProposalVersionId: 1 },
        },
        { session: tx },
      );
    } else if (approved || rejected) {
      await ProposalModel.updateMany(
        {
          id: { $in: proposalIds },
          status: { $in: ["BOARD_REVIEW", "BOARD_VOTING", "PENDING_BOARD"] },
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
              result,
              eligibleVoterSnapshot: eligibleVoterIds,
              quorumSnapshot: quorum,
              tallySnapshot: tally,
              decidedBy: { id: actor.id, name: actor.name, role: actor.role },
              decidedAt: new Date(),
              publicationCadence: approvedPublicationType ?? (session as any).publicationCadence,
              reason: (tally as any).finalReason,
              createdAt: new Date(),
            },
          },
          { upsert: true, returnDocument: "after", session: tx },
        );
      }
    }

    await createAuditEntry(
      req,
      "BOARD_SESSION_FINALIZED",
      "voting_session",
      sessionId,
      {
        closedById: actor.id,
        status: nextStatus,
        result,
        ...(closingNote ? { note: closingNote } : {}),
      },
      tx,
    );
    await createOutboxEvent(
      "board.session.finalized",
      "voting_session",
      sessionId,
      {
        status: nextStatus,
        result,
        proposalIds,
      },
      tx,
    );
    return toObject(updatedSession);
  });
}

export async function cancelVotingSession(req: AuthedRequest, sessionId: string) {
  const actor = ensureActor(req);
  requireBoardChairActor(actor);
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
    (session as any).status = "CANCELLED";
    (session as any).cancelledAt = new Date();
    await session.save({ session: tx });
    await ProposalModel.updateMany(
      { id: { $in: proposalIds }, status: "BOARD_REVIEW" },
      {
        $set: { status: "PENDING_BOARD", updatedAt: new Date() },
        $unset: { activeVotingSessionId: 1, activeProposalVersionId: 1 },
      },
      { session: tx },
    );
    await audit(req, "voting_session.cancel", "voting_session", sessionId, { proposalIds }, tx);
    return toObject(session);
  });
}
