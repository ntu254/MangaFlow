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
};
