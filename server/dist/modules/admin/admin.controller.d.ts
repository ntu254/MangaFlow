import type { NextFunction, Request, Response } from "express";
export declare function listAdminUsers(_req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function createAdminUser(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateAdminUserRole(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateAdminUser(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateAdminUserStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function deleteAdminUser(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function listAdminBoardMembers(_req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function createAdminBoardMember(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateAdminBoardMemberStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateAdminBoardChair(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function listAdminTaskTypes(_req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function createAdminTaskType(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateAdminTaskType(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateAdminTaskTypeStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function deleteAdminTaskType(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=admin.controller.d.ts.map