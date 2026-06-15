import type { UserRole } from "../../auth/auth.types.js";
export interface CommentActor {
    userId: string;
    role: UserRole;
}
export declare function assertCommentSeriesMember(seriesId: string, actor: CommentActor, allowedRoles: Array<"MANGAKA" | "EDITOR" | "ASSISTANT">): Promise<import("mongoose").Document<unknown, {}, import("../../series/series.model.js").SeriesMemberDocument, {}, {}> & import("../../series/series.model.js").SeriesMemberDocument & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
//# sourceMappingURL=comment-access.policy.d.ts.map