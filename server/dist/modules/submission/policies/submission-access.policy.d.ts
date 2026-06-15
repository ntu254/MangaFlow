import type { UserRole } from "../../auth/auth.types.js";
export interface SubmissionActor {
    userId: string;
    role: UserRole;
}
export declare function assertSubmissionSeriesMember(seriesId: string, actor: SubmissionActor, allowedRoles: Array<"MANGAKA" | "EDITOR" | "ASSISTANT">): Promise<import("mongoose").Document<unknown, {}, import("../../series/series.model.js").SeriesMemberDocument, {}, {}> & import("../../series/series.model.js").SeriesMemberDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
//# sourceMappingURL=submission-access.policy.d.ts.map