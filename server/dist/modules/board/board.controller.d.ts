import type { Request, Response } from "express";
export declare function listQueue(_req: Request, res: Response): Promise<void>;
export declare function castVote(req: Request, res: Response): Promise<void>;
export declare function finalizeDecision(req: Request, res: Response): Promise<void>;
export declare function tieBreakDecision(req: Request, res: Response): Promise<void>;
export declare function createAtRiskDecision(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=board.controller.d.ts.map