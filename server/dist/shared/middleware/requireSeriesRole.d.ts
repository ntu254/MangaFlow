import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../../modules/auth/auth.types.js";
interface SeriesRoleCheck {
    seriesId: string;
    userId: string;
    allowedRoles: UserRole[];
    requireActive?: boolean;
}
export declare function checkSeriesRole({ seriesId, userId, allowedRoles, requireActive }: SeriesRoleCheck): Promise<boolean>;
export declare function requireSeriesRole(...allowedRoles: UserRole[]): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function requireAssistantSeriesMember(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function requireMangakaOrEditorSeriesMember(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function requireAnySeriesMember(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=requireSeriesRole.d.ts.map