import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "../../modules/auth/auth.types.js";
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
export declare function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=requireAuth.d.ts.map