import { asyncRoute, created, ok, AppError } from "../lib/http.js";
import {
  AuditEntryModel,
  ProposalModel,
  ProposalVersionModel,
  RankingModel,
  VotingSessionModel,
} from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { audit } from "../services/audit.service.js";
import {
  closeVotingSession,
  cancelVotingSession,
  resolveTiedVotingSession,
} from "../services/proposal-governance.service.js";
import {
  activeBoardElectorate,
  BOARD_QUORUM,
  evaluateBoardTally,
  normalizeTiePolicy,
} from "../services/board-governance.service.js";
import { requireActor } from "./helpers.js";
import { parseBody, rejectProtectedFields } from "../validators/common.js";
import { runWorkflowTransaction, toObject } from "../services/workflow-support.service.js";
import { z } from "zod";
import type { AuthedRequest } from "../types.js";

const createVotingSessionSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    mode: z.string().optional(),
    proposalId: z.string().optional(),
    proposalVersionId: z.string().optional(),
    proposalIds: z.array(z.string()).optional(),
    scheduledFor: z.string().optional(),
    closesAt: z.string().optional(),
    tiePolicy: z.enum(["CHAIR_DECIDES", "REJECT", "RETURN_TO_BOARD"]).optional(),
  })
  .strict();

const patchVotingSessionSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    mode: z.string().optional(),
    expectedVersion: z.number().int().positive().optional(),
    scheduledFor: z.string().nullable().optional(),
    closesAt: z.string().nullable().optional(),
  })
  .strict();

const sessionNoteSchema = z
  .object({
    text: z.string().min(1).max(5000),
  })
  .strict();

const resolveTieSchema = z
  .object({
    decision: z.enum(["APPROVED", "REJECTED"]),
    note: z.string().min(1).max(5000),
    expectedVersion: z.number().int().positive().optional(),
  })
  .strict();

export const listVotingSessions = asyncRoute(async (_req: AuthedRequest, res) =>
  ok(res, await VotingSessionModel.find({}).sort({ openedAt: -1 }).lean()),
);

export const decisionHistory = asyncRoute(async (_req: AuthedRequest, res) => {
  const [proposals, sessions, riskDecisions, riskSignals] = await Promise.all([
    ProposalModel.find({ status: { $in: ["APPROVED", "REJECTED"] } })
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean(),
    VotingSessionModel.find({ status: { $ne: "OPEN" } })
      .sort({ closedAt: -1, openedAt: -1 })
      .limit(100)
      .lean(),
    AuditEntryModel.find({ action: "ranking.at_risk_decision" })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
    RankingModel.find({ $or: [{ atRisk: true }, { status: "AT_RISK" }] })
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean(),
  ]);

  const rows = [
    ...proposals.map((proposal: any) => ({
      id: proposal.id,
      type: "Proposal",
      title: proposal.title,
      status: proposal.status,
      date: proposal.updatedAt ?? proposal.createdAt,
      href: `/app/board/proposals/${proposal.id}`,
      entityId: proposal.id,
      entityType: "proposal",
    })),
    ...sessions.map((session: any) => ({
      id: session.id,
      type: "Session",
      title: session.title,
      status: session.status,
      date: session.closedAt ?? session.openedAt,
      href: `/app/board/sessions/${session.id}`,
      entityId: session.id,
      entityType: "voting_session",
      metadata: {
        proposalIds: session.proposalIds ?? [],
        outcomes: session.outcomes ?? [],
      },
    })),
    ...riskDecisions.map((entry: any) => ({
      id: entry.id,
      type: "At-risk",
      title: String(entry.entityId ?? "At-risk decision"),
      status: String(entry.metadata?.decision ?? "DECIDED"),
      date: entry.createdAt,
      href: "/app/board/at-risk",
      entityId: entry.entityId,
      entityType: "at_risk_decision",
      metadata: entry.metadata ?? {},
    })),
    ...riskSignals.map((ranking: any) => ({
      id: ranking.id,
      type: "At-risk",
      title: ranking.seriesTitle,
      status: ranking.status ?? "AT_RISK_SIGNAL",
      date: ranking.updatedAt ?? ranking.createdAt,
      href: "/app/board/at-risk",
      entityId: ranking.seriesId,
      entityType: "ranking_signal",
      metadata: {
        period: ranking.period,
        finalScore: ranking.finalScore,
        voteCount: ranking.voteCount,
      },
    })),
  ].sort((a: any, b: any) => {
    const left = a.date ? new Date(a.date).getTime() : 0;
    const right = b.date ? new Date(b.date).getTime() : 0;
    return right - left;
  });

  ok(res, rows);
});

export const getVotingSession = asyncRoute(async (req: AuthedRequest, res) => {
  const session = await VotingSessionModel.findOne({ id: String(req.params.id) }).lean();
  if (!session) throw new AppError(404, "Voting session not found.", "SESSION_NOT_FOUND");
  ok(res, session);
});

export const createVotingSession = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  if (!(actor.role === "BOARD" && actor.isChair)) {
    throw new AppError(403, "Board chair permission is required.", "BOARD_CHAIR_REQUIRED");
  }
  const body = parseBody(createVotingSessionSchema, req);
  rejectProtectedFields(body as Record<string, unknown>);
  if (Array.isArray(body.proposalIds) && body.proposalIds.length > 1) {
    throw new AppError(
      400,
      "VotingSession supports exactly one Proposal in P0.",
      "MULTI_PROPOSAL_SESSION_UNSUPPORTED",
    );
  }
  const proposalId = body.proposalId ?? body.proposalIds?.[0];
  if (!proposalId) {
    throw new AppError(400, "proposalId is required.", "VALIDATION_ERROR");
  }
  const eligibleVoterIds = await activeBoardElectorate();
  const now = nowIso();
  const session = await runWorkflowTransaction(async (tx) => {
    const proposal = (await ProposalModel.findOne({ id: proposalId }).session(tx).lean()) as any;
    if (!proposal) throw new AppError(404, "Proposal not found.", "PROPOSAL_NOT_FOUND");
    const active = await VotingSessionModel.findOne({
      targetType: "PROPOSAL",
      proposalId,
      status: "OPEN",
    })
      .session(tx)
      .lean();
    if (active) {
      throw new AppError(
        409,
        "An active voting session already exists for this proposal.",
        "ACTIVE_VOTING_SESSION_EXISTS",
      );
    }
    if (String(proposal.status) !== "PENDING_BOARD") {
      throw new AppError(
        409,
        "Proposal must be ready for Board review before opening a voting session.",
        "PROPOSAL_NOT_READY_FOR_BOARD",
      );
    }
    const proposalVersionId = String(
      proposal.currentVersionId ??
        proposal.currentVersion ??
        proposal.version ??
        proposal.manuscripts?.[proposal.manuscripts.length - 1]?.version ??
        "1",
    );
    if (body.proposalVersionId && body.proposalVersionId !== proposalVersionId) {
      throw new AppError(
        409,
        "Proposal version does not match the current Proposal version.",
        "PROPOSAL_VERSION_MISMATCH",
      );
    }
    await ProposalVersionModel.findOneAndUpdate(
      { proposalId, proposalVersionId },
      {
        $setOnInsert: {
          id: id("pv"),
          proposalId,
          proposalVersionId,
          versionNumber: Number.isFinite(Number(proposalVersionId))
            ? Number(proposalVersionId)
            : undefined,
          status: "FROZEN",
          source: "VOTING_SESSION",
          snapshot: {
            id: proposal.id,
            title: proposal.title,
            synopsis: proposal.synopsis,
            authorId: proposal.authorId,
            authorName: proposal.authorName,
            manuscripts: proposal.manuscripts ?? [],
            materials: proposal.materials ?? [],
            requestedPublicationType: proposal.requestedPublicationType,
            frozenFromStatus: proposal.status,
          },
          frozenById: actor.id,
          frozenAt: now,
        },
      },
      { upsert: true, returnDocument: "after", session: tx },
    );
    const [createdSession] = await VotingSessionModel.create(
      [{
        id: id("vs"),
        title: body.title ?? "Board voting session",
        mode: body.mode ?? "AD_HOC",
        targetType: "PROPOSAL",
        proposalId,
        proposalVersionId,
        status: "OPEN",
        version: 1,
        votingRound: 1,
        tiePolicy: normalizeTiePolicy(body.tiePolicy),
        tieResolution: "PENDING",
        proposalIds: [proposalId],
        eligibleVoterIds,
        quorum: BOARD_QUORUM,
        chairId: actor.id,
        createdById: actor.id,
        createdByName: actor.name,
        openedAt: now,
        scheduledFor: body.scheduledFor,
        closesAt: body.closesAt,
        outcomes: [],
        notes: [],
      }],
      { session: tx },
    );
    const transition = await ProposalModel.updateOne(
      { id: proposalId, status: "PENDING_BOARD" },
      {
        $set: {
          status: "BOARD_REVIEW",
          activeVotingSessionId: (createdSession as any).id,
          activeProposalVersionId: proposalVersionId,
          updatedAt: now,
        },
      },
      { session: tx },
    );
    if (transition.matchedCount !== 1) {
      throw new AppError(409, "Proposal changed while opening a voting session.", "PROPOSAL_STATE_CHANGED");
    }
    await audit(req, "voting_session.create", "voting_session", (createdSession as any).id, {}, tx);
    return toObject(createdSession);
  });
  created(res, session);
});

export const patchVotingSession = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  if (!(actor.role === "BOARD" && actor.isChair)) {
    throw new AppError(403, "Board chair permission is required.", "BOARD_CHAIR_REQUIRED");
  }
  const body = parseBody(patchVotingSessionSchema, req);
  rejectProtectedFields(body as Record<string, unknown>);
  const existing = await VotingSessionModel.findOne({ id: String(req.params.id) }).lean();
  if (!existing) throw new AppError(404, "Voting session not found.", "SESSION_NOT_FOUND");
  if (
    ["FINALIZED", "NO_QUORUM", "CANCELLED", "TIED"].includes(
      String((existing as any).status),
    )
  ) {
    throw new AppError(409, "Terminal voting sessions cannot be updated.", "SESSION_NOT_ACTIVE");
  }
  const patch = {
    ...body,
    expectedVersion: undefined,
    updatedAt: nowIso(),
  };
  delete (patch as any).expectedVersion;
  const filter: Record<string, unknown> = { id: String(req.params.id), status: (existing as any).status };
  if (body.expectedVersion != null) filter.version = body.expectedVersion;
  const session = await VotingSessionModel.findOneAndUpdate(
    filter,
    { $set: patch, $inc: { version: 1 } },
    { returnDocument: "after" },
  ).lean();
  if (!session && body.expectedVersion != null) {
    throw new AppError(409, "Voting session changed while updating.", "VERSION_CONFLICT");
  }
  if (!session) throw new AppError(404, "Voting session not found.", "SESSION_NOT_FOUND");
  await audit(req, "voting_session.update", "voting_session", String(req.params.id));
  ok(res, session);
});

export const closeSession = asyncRoute(async (req: AuthedRequest, res) =>
  ok(
    res,
    await closeVotingSession(req, String(req.params.id), req.body?.note, req.body?.publicationType),
  ),
);
export const resolveTie = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(resolveTieSchema, req);
  ok(
    res,
    await resolveTiedVotingSession(req, String(req.params.id), body.decision, body.note),
  );
});
export const cancelSession = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await cancelVotingSession(req, String(req.params.id))),
);

export const addSessionNote = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const body = parseBody(sessionNoteSchema, req);
  const note = {
    id: id("vsn"),
    authorId: actor.id,
    authorName: actor.name,
    text: body.text.trim(),
    createdAt: nowIso(),
  };
  const session = await VotingSessionModel.findOneAndUpdate(
    { id: String(req.params.id), status: "OPEN" },
    { $push: { notes: note }, $set: { updatedAt: nowIso() } },
    { returnDocument: "after" },
  ).lean();
  if (!session) throw new AppError(404, "Open voting session not found.", "SESSION_NOT_FOUND");
  await audit(req, "voting_session.note_create", "voting_session", String(req.params.id), {
    noteId: note.id,
  });
  created(res, note);
});

async function throwNoteMutationFailure(
  sessionId: string,
  noteId: string,
  actorId: string,
  action: "edit" | "delete",
): Promise<never> {
  const session = await VotingSessionModel.findOne({ id: sessionId }).lean();
  if (!session) throw new AppError(404, "Voting session not found.", "SESSION_NOT_FOUND");
  if (String((session as any).status) !== "OPEN") {
    throw new AppError(409, "Voting session is closed; its notes are immutable.", "SESSION_CLOSED");
  }
  const note = ((session as any).notes ?? []).find((item: any) => item.id === noteId);
  if (!note) throw new AppError(404, "Session note not found.", "NOTE_NOT_FOUND");
  if (note.authorId !== actorId) {
    throw new AppError(403, `Only the note author can ${action} this note.`, "FORBIDDEN");
  }
  throw new AppError(409, "Voting session changed while updating this note.", "SESSION_CHANGED");
}

export const patchSessionNote = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const body = parseBody(sessionNoteSchema, req);
  const sessionId = String(req.params.id);
  const noteId = String(req.params.noteId);
  const updatedAt = nowIso();
  const session = await VotingSessionModel.findOneAndUpdate(
    {
      id: sessionId,
      status: "OPEN",
      notes: { $elemMatch: { id: noteId, authorId: actor.id } },
    },
    {
      $set: {
        "notes.$.text": body.text.trim(),
        "notes.$.updatedAt": updatedAt,
        updatedAt,
      },
    },
    { returnDocument: "after" },
  ).lean();
  if (!session) await throwNoteMutationFailure(sessionId, noteId, actor.id, "edit");
  await audit(req, "voting_session.note_update", "voting_session", String(req.params.id), {
    noteId,
  });
  ok(res, (session as any).notes.find((item: any) => item.id === noteId));
});

export const deleteSessionNote = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const sessionId = String(req.params.id);
  const noteId = String(req.params.noteId);
  const session = await VotingSessionModel.findOneAndUpdate(
    {
      id: sessionId,
      status: "OPEN",
      notes: { $elemMatch: { id: noteId, authorId: actor.id } },
    },
    {
      $pull: { notes: { id: noteId, authorId: actor.id } },
      $set: { updatedAt: nowIso() },
    },
    { returnDocument: "after" },
  ).lean();
  if (!session) await throwNoteMutationFailure(sessionId, noteId, actor.id, "delete");
  await audit(req, "voting_session.note_delete", "voting_session", String(req.params.id), {
    noteId,
  });
  ok(res, { id: noteId });
});
