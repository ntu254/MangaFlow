import type { AtRiskDecision, BoardVoteValue } from "../../shared/workflow/status.js";
export declare function listBoardQueueService(): Promise<{
    id: any;
    seriesTitle: any;
    ownerId: string;
    seriesStatus: any;
    decisionStatus: any;
    voteSummary: Record<"APPROVE" | "REJECT" | "NEEDS_REVISION", number>;
    updatedAt: any;
}[]>;
export declare function castBoardVoteService(seriesId: string, userId: string, value: BoardVoteValue): Promise<{
    vote: any;
    summary: Record<"APPROVE" | "REJECT" | "NEEDS_REVISION", number>;
}>;
export declare function finalizeBoardDecisionService(seriesId: string, userId: string): Promise<any>;
export declare function tieBreakBoardDecisionService(seriesId: string, userId: string, value: BoardVoteValue): Promise<any>;
export declare function createAtRiskDecisionService(seriesId: string, userId: string, decision: AtRiskDecision, note?: string): Promise<any>;
//# sourceMappingURL=board.service.d.ts.map