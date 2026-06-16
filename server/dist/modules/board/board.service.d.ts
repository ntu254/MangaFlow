import type { AtRiskDecision, BoardVoteValue, PublicationType } from "../../shared/workflow/status.js";
export declare function listBoardQueueService(): Promise<{
    id: any;
    seriesTitle: any;
    ownerId: string;
    seriesStatus: any;
    requestedPublicationType: any;
    publicationType: any;
    decisionStatus: any;
    voteSummary: Record<"APPROVE" | "REJECT" | "NEEDS_REVISION", number>;
    voteCount: number;
    sessionId: any;
    updatedAt: any;
}[]>;
export declare function castBoardVoteService(seriesId: string, userId: string, value: BoardVoteValue, note?: string): Promise<{
    vote: any;
    summary: Record<"APPROVE" | "REJECT" | "NEEDS_REVISION", number>;
}>;
export interface FinalizeBoardDecisionInput {
    decision?: "APPROVED" | "REJECTED" | "NEEDS_REVISION";
    publicationType?: PublicationType;
    note?: string;
}
export declare function finalizeBoardDecisionService(seriesId: string, userId: string, input?: FinalizeBoardDecisionInput): Promise<any>;
export interface TieBreakBoardDecisionInput {
    value: BoardVoteValue;
    publicationType?: PublicationType;
    note?: string;
}
export declare function tieBreakBoardDecisionService(seriesId: string, userId: string, input: TieBreakBoardDecisionInput | BoardVoteValue): Promise<any>;
export declare function createAtRiskDecisionService(seriesId: string, userId: string, decision: AtRiskDecision, note?: string): Promise<any>;
//# sourceMappingURL=board.service.d.ts.map