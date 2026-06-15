import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../../modules/auth/auth.types.js";
export declare function requireRole(...roles: UserRole[]): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=requireRole.d.ts.map