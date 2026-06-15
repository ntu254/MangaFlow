import type { NextFunction, Request, Response } from "express";
export declare function createTask(req: Request, res: Response, _next: NextFunction): Promise<void>;
export declare function getTask(req: Request, res: Response, _next: NextFunction): Promise<void>;
export declare function listTasksBySeries(req: Request, res: Response, _next: NextFunction): Promise<void>;
export declare function listTasksByChapter(req: Request, res: Response, _next: NextFunction): Promise<void>;
export declare function listTasksByAssignee(req: Request, res: Response, _next: NextFunction): Promise<void>;
export declare function updateTaskStatus(req: Request, res: Response, _next: NextFunction): Promise<void>;
export declare function updateTaskPriority(req: Request, res: Response, _next: NextFunction): Promise<void>;
export declare function updateTaskDueDate(req: Request, res: Response, _next: NextFunction): Promise<void>;
//# sourceMappingURL=task.controller.d.ts.map