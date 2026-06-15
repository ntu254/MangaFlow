import type { Request, Response } from "express";
export declare function createComment(req: Request, res: Response): Promise<void>;
export declare function markCommentFixed(req: Request, res: Response): Promise<void>;
export declare function verifyCommentFixed(req: Request, res: Response): Promise<void>;
export declare function resolveComment(req: Request, res: Response): Promise<void>;
export declare function reopenComment(req: Request, res: Response): Promise<void>;
export declare function listTaskComments(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=comment.controller.d.ts.map