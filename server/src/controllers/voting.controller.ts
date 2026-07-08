import { asyncRoute, created, ok, AppError } from "../lib/http.js";
import { AuditEntryModel, ProposalModel, RankingModel, VotingSessionModel } from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { audit } from "../services/audit.service.js";
import {
  closeVotingSession,
  cancelVotingSession,
  applyProposalAction,
  evaluateBoardTally,
} from "../services/workflow.service.js";
import { requireActor } from "./helpers.js";
import { parseBody, rejectProtectedFields } from "../validators/common.js";
import { z } from "zod";
import type { AuthedRequest } from "../types.js";

const createVotingSessionSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    mode: z.string().optional(),
    proposalIds: z.array(z.string()).optional(),
    scheduledFor: z.string().optional(),
    closesAt: z.string().optional(),
  })
  .strict();

const patchVotingSessionSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    mode: z.string().optional(),
    proposalIds: z.array(z.string()).optional(),
    scheduledFor: z.string().nullable().optional(),
    closesAt: z.string().nullable().optional(),
  })
  .strict();

const sessionNoteSchema = z
  .object({
    text: z.string().min(1).max(5000),
  })
  .strict();

export const listVotingSessions = asyncRoute(async (_req: AuthedRequest, res) =>
  ok(res, await VotingSessionModel.find({}).sort({ openedAt: -1 }).lean()),
);

export const decisionHistory = asyncRoute(async (_req: AuthedRequest, res) => {
  const [proposals, sessions, riskDecisions, riskSignals] = await Promise.all([
    ProposalModel.find({ status: { $in: ["APPROVED", "REJECTED", "TIE_BREAK"] } })
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
  const body = parseBody(createVotingSessionSchema, req);
  rejectProtectedFields(body as Record<string, unknown>);
  const now = nowIso();
  const session = await VotingSessionModel.create({
    id: id("vs"),
    title: body.title ?? "Board voting session",
    mode: body.mode ?? "AD_HOC",
    status: "OPEN",
    proposalIds: Array.isArray(body.proposalIds) ? body.proposalIds : [],
    createdById: actor.id,
    createdByName: actor.name,
    openedAt: now,
    scheduledFor: body.scheduledFor,
    closesAt: body.closesAt,
    outcomes: [],
    notes: [],
  });
  await audit(req, "voting_session.create", "voting_session", (session as any).id);
  created(res, session);
});

export const patchVotingSession = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(patchVotingSessionSchema, req);
  rejectProtectedFields(body as Record<string, unknown>);
  const patch = {
    ...body,
    updatedAt: nowIso(),
  };
  const session = await VotingSessionModel.findOneAndUpdate(
    { id: String(req.params.id) },
    { $set: patch },
    { returnDocument: "after" },
  ).lean();
  if (!session) throw new AppError(404, "Voting session not found.", "SESSION_NOT_FOUND");
  await audit(req, "voting_session.update", "voting_session", String(req.params.id));
  ok(res, session);
});

export const closeSession = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await closeVotingSession(req, String(req.params.id))),
);
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

export const patchSessionNote = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const body = parseBody(sessionNoteSchema, req);
  const session = await VotingSessionModel.findOne({ id: String(req.params.id) });
  if (!session) throw new AppError(404, "Voting session not found.", "SESSION_NOT_FOUND");
  const notes = ((session as any).notes ?? []) as any[];
  const note = notes.find((item) => item.id === String(req.params.noteId));
  if (!note) throw new AppError(404, "Session note not found.", "NOTE_NOT_FOUND");
  if (actor.role !== "ADMIN" && note.authorId !== actor.id) {
    throw new AppError(403, "Only the note author can edit this note.", "FORBIDDEN");
  }
  (session as any).notes = notes.map((item) =>
    item.id === String(req.params.noteId)
      ? { ...item, text: body.text.trim(), updatedAt: nowIso() }
      : item,
  );
  (session as any).updatedAt = nowIso();
  await session.save();
  await audit(req, "voting_session.note_update", "voting_session", String(req.params.id), {
    noteId: String(req.params.noteId),
  });
  ok(
    res,
    (session as any).notes.find((item: any) => item.id === String(req.params.noteId)),
  );
});

export const deleteSessionNote = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const session = await VotingSessionModel.findOne({ id: String(req.params.id) });
  if (!session) throw new AppError(404, "Voting session not found.", "SESSION_NOT_FOUND");
  const notes = ((session as any).notes ?? []) as any[];
  const note = notes.find((item) => item.id === String(req.params.noteId));
  if (!note) throw new AppError(404, "Session note not found.", "NOTE_NOT_FOUND");
  if (actor.role !== "ADMIN" && note.authorId !== actor.id) {
    throw new AppError(403, "Only the note author can delete this note.", "FORBIDDEN");
  }
  (session as any).notes = notes.filter((item) => item.id !== String(req.params.noteId));
  (session as any).updatedAt = nowIso();
  await session.save();
  await audit(req, "voting_session.note_delete", "voting_session", String(req.params.id), {
    noteId: String(req.params.noteId),
  });
  ok(res, { id: String(req.params.noteId) });
});

export const tieBreak = asyncRoute(async (req: AuthedRequest, res) => {
  const proposalId = String(req.body?.proposalId ?? "");
  if (!proposalId) throw new AppError(400, "proposalId is required.", "VALIDATION_ERROR");
  ok(
    res,
    await applyProposalAction(req, proposalId, "VOTE", {
      ...req.body,
      voteDecision: req.body?.value ?? req.body?.voteDecision,
    }),
  );
});
