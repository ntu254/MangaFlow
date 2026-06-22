import { api, unwrap } from "./_client";
import { seriesApi, type PublicationType, type Series } from "./series";

export type BoardVoteValue = "APPROVE" | "REJECT" | "NEEDS_REVISION";
export type BoardDecisionValue = "APPROVED" | "REJECTED" | "NEEDS_REVISION";

export interface BoardVoteSummary {
  APPROVE: number;
  REJECT: number;
  NEEDS_REVISION: number;
}

export interface BoardQueueItem {
  id: string;
  seriesTitle: string;
  ownerId: string;
  seriesStatus: string;
  requestedPublicationType?: PublicationType;
  publicationType?: PublicationType;
  decisionStatus: string;
  voteSummary: BoardVoteSummary;
  voteCount: number;
  eligibleBoardCount: number;
  quorum: number;
  canFinalize: boolean;
  sessionId: string | null;
  updatedAt?: string;
}

export interface CastBoardVoteInput {
  value: BoardVoteValue;
  note?: string;
}

export interface FinalizeBoardDecisionInput {
  decision?: BoardDecisionValue;
  publicationType?: PublicationType;
  note?: string;
}

export interface TieBreakBoardDecisionInput {
  value: BoardVoteValue;
  publicationType?: PublicationType;
  note?: string;
}

export type AtRiskDecisionValue = "CONTINUE" | "WARNING" | "CANCEL" | "COMPLETE";

export interface AtRiskDecisionInput {
  decision: AtRiskDecisionValue;
  note?: string;
}

export interface BoardPublishingScheduleItem {
  seriesId: string;
  title: string;
  status: string;
  publicationType?: PublicationType;
  requestedPublicationType?: PublicationType;
  publishAt?: string;
  note?: string;
  approvedAt?: string;
  updatedAt?: string;
  decidedBy?: string;
  scheduleManagedBy?: string;
}

export interface BoardPublishingScheduleInput {
  publicationType: PublicationType;
  publishAt: string;
  note?: string;
}

export interface CancellationCaseItem {
  seriesId: string;
  title: string;
  status: string;
  synopsis?: string;
  cancellationRequestedAt?: string;
  updatedAt?: string;
  latestRanking?: {
    id: string;
    period: string;
    voteCount: number;
    readerScore: number;
    finalScore: number;
    status: string;
  } | null;
  latestDecision?: {
    id: string;
    decision: AtRiskDecisionValue;
    note?: string;
    decidedBy?: string;
    createdAt?: string;
  } | null;
}

export interface AtRiskDecisionRecord {
  id: string;
  seriesId: string;
  decision: AtRiskDecisionValue;
  note?: string;
  decidedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BoardDecisionHistoryItem {
  id: string;
  type: "Series Approval" | "Cancellation Review" | "Ranking" | string;
  target: string;
  seriesId?: string;
  result: string;
  detail?: string;
  actor?: string;
  date?: string;
  metadata?: Record<string, unknown>;
}

function normalizeStatus(status: string) {
  return status.toUpperCase().replaceAll("-", "_");
}

function itemFromSeries(series: Series): BoardQueueItem {
  return {
    id: series.id,
    seriesTitle: series.title,
    ownerId: series.ownerId,
    seriesStatus: series.status,
    requestedPublicationType: series.requestedPublicationType,
    publicationType: series.publicationType,
    decisionStatus: normalizeStatus(series.status) === "BOARD_REVIEW" ? "PENDING" : series.status,
    voteSummary: { APPROVE: 0, REJECT: 0, NEEDS_REVISION: 0 },
    voteCount: 0,
    eligibleBoardCount: 0,
    quorum: 1,
    canFinalize: false,
    sessionId: null,
    updatedAt: series.updatedAt,
  };
}

async function boardReviewSeriesFallback() {
  const series = await seriesApi.list();
  return series
    .filter((item) => normalizeStatus(item.status) === "BOARD_REVIEW")
    .map(itemFromSeries);
}

export const boardApi = {
  publishingSchedule: () =>
    api.get("/board/publishing-schedule").then(unwrap<BoardPublishingScheduleItem[]>),
  savePublishingSchedule: (seriesId: string, input: BoardPublishingScheduleInput) =>
    api.post(`/board/series/${seriesId}/publishing-schedule`, input).then(unwrap<unknown>),
  cancellationCases: () =>
    api.get("/board/cancellation-cases").then(unwrap<CancellationCaseItem[]>),
  atRiskDecisions: (seriesId: string) =>
    api.get(`/board/series/${seriesId}/at-risk-decisions`).then(unwrap<AtRiskDecisionRecord[]>),
  decisionHistory: (type?: string) =>
    api
      .get("/board/decision-history", { params: type && type !== "all" ? { type } : undefined })
      .then(unwrap<BoardDecisionHistoryItem[]>),
  queue: async () => {
    try {
      const queue = await api.get("/board/queue").then(unwrap<BoardQueueItem[]>);
      const activeQueue = queue.filter(
        (item) => normalizeStatus(item.seriesStatus) === "BOARD_REVIEW",
      );
      if (activeQueue.length > 0) return activeQueue;
      return boardReviewSeriesFallback();
    } catch {
      return boardReviewSeriesFallback();
    }
  },
  castVote: (seriesId: string, input: CastBoardVoteInput) =>
    api.post(`/board/series/${seriesId}/vote`, input).then(unwrap<unknown>),
  finalizeDecision: (seriesId: string, input: FinalizeBoardDecisionInput) =>
    api.post(`/board/series/${seriesId}/finalize-decision`, input).then(unwrap<unknown>),
  tieBreak: (seriesId: string, input: TieBreakBoardDecisionInput) =>
    api.post(`/board/series/${seriesId}/tie-break`, input).then(unwrap<unknown>),
  createAtRiskDecision: (seriesId: string, input: AtRiskDecisionInput) =>
    api.post(`/board/series/${seriesId}/at-risk-decisions`, input).then(unwrap<unknown>),
};
