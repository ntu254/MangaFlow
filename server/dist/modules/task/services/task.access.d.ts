import type { UserRole } from "../../auth/auth.types.js";
export interface TaskActor {
    userId: string;
    role: UserRole;
}
export declare function assertSeriesManager(seriesId: string, actor: TaskActor): Promise<void>;
export declare function assertSeriesTaskAccess(seriesId: string, actor: TaskActor, assignedTo?: unknown): Promise<void>;
//# sourceMappingURL=task.access.d.ts.map