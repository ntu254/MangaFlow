import type { ClientSession } from "mongoose";
import type { AtRiskDecision, BoardDecisionStatus, BoardVoteValue, SeriesStatus } from "../../shared/workflow/status.js";
export declare function listBoardQueueSeries(): Promise<any[]>;
export declare function getDecisionBySeries(seriesId: string, session?: ClientSession): Promise<any | null>;
export declare function getBoardSeries(seriesId: string, session?: ClientSession): Promise<any | null>;
export declare function upsertBoardVote(seriesId: string, userId: string, value: BoardVoteValue, session?: ClientSession): Promise<any>;
export declare function listBoardVotes(seriesId: string, session?: ClientSession): Promise<any[]>;
export declare function listEligibleBoardUsers(): Promise<any[]>;
export declare function isBoardChair(userId: string): Promise<boolean>;
export declare function getOrCreateDecision(seriesId: string, session?: ClientSession): Promise<any>;
export declare function updateDecision(seriesId: string, status: BoardDecisionStatus, result?: BoardVoteValue, decidedBy?: string, session?: ClientSession): Promise<any>;
export declare function updateSeriesAfterDecision(seriesId: string, status: SeriesStatus, session?: ClientSession): Promise<any>;
export declare function createAtRiskDecision(seriesId: string, decision: AtRiskDecision, decidedBy: string, note?: string, session?: ClientSession): Promise<any>;
//# sourceMappingURL=board.repository.d.ts.map