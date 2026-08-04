import { mobileApi } from "@/services/mobile-api-client";
import type { AtRiskDecision } from "@/domain/workflow";
import { z } from "zod";

// Board detail reads and canonical vote command. Mobile sends expectedVersion
// for optimistic concurrency; it never computes tally/quorum/result.

const boardActionDescriptorSchema = z.object({
  action: z.string(),
  enabled: z.boolean(),
  disabledReason: z.string().nullable(),
  requiresConfirmation: z.boolean(),
  requiresReason: z.boolean(),
});
export type BoardActionDescriptor = z.infer<typeof boardActionDescriptorSchema>;

// The shape mobile actually trusts for optimistic concurrency (expectedVersion
// comes from session.version) and Chair finalize eligibility (tally). This is
// parsed, not just type-asserted, so a contract drift fails closed with a
// retryable error instead of handing a bad version/tally to a vote or close.
const boardSessionDetailSchema = z.object({
  session: z.object({
    id: z.string(),
    title: z.string(),
    status: z.string(),
    version: z.number().nullable(),
    proposalId: z.string().nullable(),
    proposalVersionId: z.string().nullable().optional(),
    reVoteOfSessionId: z.string().nullable(),
    isReVote: z.boolean(),
    votingRound: z.number(),
    tiePolicy: z.enum(["CHAIR_DECIDES", "REJECT", "RETURN_TO_BOARD"]),
    tieResolution: z.enum(["PENDING", "APPROVED", "REJECTED", "RETURNED_TO_BOARD"]),
    scheduledFor: z.string().nullable().optional(),
    closesAt: z.string().nullable().optional(),
  }),
  proposal: z
    .object({
      id: z.string(),
      title: z.string(),
      status: z.string(),
      version: z.union([z.string(), z.number()]).nullable().optional(),
      editorRecommendation: z.string().nullable().optional(),
      requestedPublicationType: z.string().nullable().optional(),
    })
    .nullable(),
  tally: z.object({
    approve: z.number(),
    reject: z.number(),
    total: z.number(),
    quorum: z.number(),
    eligible: z.number(),
    canFinalize: z.boolean(),
  }),
  myVote: z.object({ decision: z.string().nullable() }).nullable(),
  currentUserVote: z
    .object({ decision: z.string().nullable(), note: z.string().nullable().optional() })
    .nullable()
    .optional(),
  previousRound: z
    .object({
      id: z.string(),
      status: z.string(),
      proposalVersionId: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  notes: z
    .array(
      z.object({
        id: z.string(),
        authorName: z.string().optional(),
        text: z.string(),
        createdAt: z.string().optional(),
      }),
    )
    .optional(),
  actions: z.array(boardActionDescriptorSchema),
});
export type BoardSessionDetail = z.infer<typeof boardSessionDetailSchema>;

export type BoardVoteValue = "APPROVE" | "REJECT";

const rawBoardSessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  version: z.number().nullable().optional(),
  proposalId: z.string().nullable().optional(),
  proposalVersionId: z.string().nullable().optional(),
  reVoteOfSessionId: z.string().nullable().optional(),
  votingRound: z.number().int().positive().optional(),
  tiePolicy: z.enum(["CHAIR_DECIDES", "REJECT", "RETURN_TO_BOARD"]).optional(),
  tieResolution: z
    .enum(["PENDING", "APPROVED", "REJECTED", "RETURNED_TO_BOARD"])
    .optional(),
  scheduledFor: z.string().nullable().optional(),
  closesAt: z.string().nullable().optional(),
  openedAt: z.string().nullable().optional(),
  closedAt: z.string().nullable().optional(),
  result: z.string().nullable().optional(),
  notes: z
    .array(
      z.object({
        id: z.string(),
        authorName: z.string().optional(),
        text: z.string().optional(),
        body: z.string().optional(),
        createdAt: z.string().optional(),
      }),
    )
    .optional(),
});

export type BoardSessionSummary = z.infer<typeof rawBoardSessionSchema>;

export async function getBoardSessionDetail(
  sessionId: string,
): Promise<BoardSessionDetail> {
  const [detail, rawSession] = await Promise.all([
    mobileApi
      .request(`/board/sessions/${sessionId}/detail`)
      .then((value) => boardSessionDetailSchema.parse(value)),
    mobileApi
      .request(`/voting-sessions/${sessionId}`)
      .then((value) => rawBoardSessionSchema.parse(value)),
  ]);
  return {
    ...detail,
    session: {
      ...detail.session,
      proposalVersionId: rawSession.proposalVersionId ?? null,
      votingRound: rawSession.votingRound ?? detail.session.votingRound ?? 1,
      tiePolicy: rawSession.tiePolicy ?? detail.session.tiePolicy ?? "CHAIR_DECIDES",
      tieResolution: rawSession.tieResolution ?? detail.session.tieResolution ?? "PENDING",
      scheduledFor: rawSession.scheduledFor ?? null,
      closesAt: rawSession.closesAt ?? null,
    },
    notes: rawSession.notes?.flatMap((note) => {
      const text = note.text ?? note.body;
      return text
        ? [
            {
              id: note.id,
              authorName: note.authorName,
              text,
              createdAt: note.createdAt,
            },
          ]
        : [];
    }),
  };
}

export async function getBoardSessions(): Promise<BoardSessionSummary[]> {
  return z
    .array(rawBoardSessionSchema)
    .parse(await mobileApi.request(`/voting-sessions`));
}

export function castBoardVote(input: {
  proposalId: string;
  sessionId: string;
  value: BoardVoteValue;
  expectedVersion: number;
  note?: string;
}): Promise<void> {
  return mobileApi.request<void>(`/board/series/${input.proposalId}/votes`, {
    method: "POST",
    body: JSON.stringify({
      value: input.value,
      sessionId: input.sessionId,
      expectedVersion: input.expectedVersion,
      note: input.note,
    }),
  });
}

export function closeBoardSession(
  sessionId: string,
  input: {
    expectedVersion: number;
    note?: string;
    publicationType?: "WEEKLY" | "MONTHLY";
  },
): Promise<BoardSessionSummary> {
  return mobileApi
    .request<BoardSessionSummary>(`/voting-sessions/${sessionId}/close`, {
      method: "POST",
      body: JSON.stringify(input),
    })
    .then((value) => rawBoardSessionSchema.parse(value));
}

export function cancelBoardSession(
  sessionId: string,
  input: { expectedVersion: number; note?: string },
): Promise<unknown> {
  return mobileApi.request<void>(`/voting-sessions/${sessionId}/cancel`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function resolveBoardTie(
  sessionId: string,
  input: { decision: "APPROVED" | "REJECTED"; note: string; expectedVersion: number },
): Promise<BoardSessionSummary> {
  return mobileApi
    .request<BoardSessionSummary>(`/voting-sessions/${sessionId}/resolve-tie`, {
      method: "POST",
      body: JSON.stringify(input),
    })
    .then((value) => rawBoardSessionSchema.parse(value));
}

export function createBoardSession(input: {
  proposalId: string;
  title?: string;
  scheduledFor?: string;
  closesAt?: string;
}): Promise<{ id?: string }> {
  return mobileApi.request<{ id?: string }>(`/voting-sessions`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface BoardPendingProposal {
  id: string;
  title: string;
  authorName: string | null;
  requestedPublicationType: "WEEKLY" | "MONTHLY" | null;
  currentVersion: string | number | null;
}

const pendingProposalSchema = z.object({
  id: z.string(),
  title: z.string(),
  authorName: z.string().nullable().optional(),
  requestedPublicationType: z.enum(["WEEKLY", "MONTHLY"]).nullable().optional(),
  currentVersionId: z.union([z.string(), z.number()]).nullable().optional(),
  currentVersion: z.union([z.string(), z.number()]).nullable().optional(),
  version: z.union([z.string(), z.number()]).nullable().optional(),
});

export async function getBoardPendingProposals(): Promise<
  BoardPendingProposal[]
> {
  const rows = z
    .array(pendingProposalSchema)
    .parse(
      await mobileApi.request(`/proposals?status=PENDING_BOARD&limit=100`),
    );
  return rows.map((proposal) => ({
    id: proposal.id,
    title: proposal.title,
    authorName: proposal.authorName ?? null,
    requestedPublicationType: proposal.requestedPublicationType ?? null,
    currentVersion:
      proposal.currentVersionId ??
      proposal.currentVersion ??
      proposal.version ??
      null,
  }));
}

export function updateBoardSession(
  sessionId: string,
  input: {
    expectedVersion: number;
    title?: string;
    scheduledFor?: string | null;
    closesAt?: string | null;
  },
): Promise<unknown> {
  return mobileApi.request<unknown>(`/voting-sessions/${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export type AtRiskDecisionValue = AtRiskDecision;

export function decideAtRisk(
  seriesId: string,
  input: {
    rankingId: string;
    decision: AtRiskDecisionValue;
    note?: string;
    publicationType?: "WEEKLY" | "MONTHLY";
  },
): Promise<void> {
  return mobileApi.request<void>(
    `/board/series/${seriesId}/at-risk-decisions`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export interface BoardRankingItem {
  id: string;
  seriesId: string;
  seriesTitle: string;
  rank: number | null;
  previousRank: number | null;
  finalScore: number | null;
  readerScore: number | null;
  status: string | null;
  atRisk: boolean;
  decision?: string | null;
  decisionStatus?: "PENDING" | "DECIDED";
}

const boardRankingResponseSchema = z.object({
  generatedAt: z.string(),
  items: z.array(
    z.object({
      id: z.string(),
      seriesId: z.string(),
      seriesTitle: z.string(),
      rank: z.number().nullable(),
      previousRank: z.number().nullable(),
      finalScore: z.number().nullable(),
      readerScore: z.number().nullable(),
      status: z.string().nullable(),
      atRisk: z.boolean(),
      decision: z.string().nullable().optional(),
      decisionStatus: z.enum(["PENDING", "DECIDED"]).optional(),
    }),
  ),
});

export async function getBoardRankings(): Promise<{
  generatedAt: string;
  items: BoardRankingItem[];
}> {
  return boardRankingResponseSchema.parse(
    await mobileApi.request(`/board/rankings`),
  );
}

export interface BoardDecisionHistoryRow {
  id: string;
  type: string;
  title: string;
  status: string;
  date: string | null;
  entityId: string | null;
  entityType: string | null;
  metadata?: Record<string, unknown>;
}

const boardDecisionHistorySchema = z.array(
  z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    status: z.string(),
    date: z
      .union([z.string(), z.date()])
      .nullable()
      .optional()
      .transform((value) => {
        if (!value) return null;
        return value instanceof Date ? value.toISOString() : value;
      }),
    entityId: z
      .string()
      .nullable()
      .optional()
      .transform((value) => value ?? null),
    entityType: z
      .string()
      .nullable()
      .optional()
      .transform((value) => value ?? null),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
);

export async function getBoardDecisionHistory(): Promise<
  BoardDecisionHistoryRow[]
> {
  const [history, sessions] = await Promise.all([
    mobileApi
      .request(`/board/decisions/history`)
      .then((value) => boardDecisionHistorySchema.parse(value)),
    getBoardSessions(),
  ]);
  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  return history.map((row) => {
    if (row.entityType !== "voting_session" || !row.entityId) return row;
    const session = sessionById.get(row.entityId);
    if (!session?.reVoteOfSessionId) return row;
    return {
      ...row,
      metadata: {
        ...row.metadata,
        reVoteOfSessionId: session.reVoteOfSessionId,
      },
    };
  });
}
