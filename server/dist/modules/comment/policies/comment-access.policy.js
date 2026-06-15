import { AppError } from "../../../shared/errors/AppError.js";
import { SeriesMember } from "../../series/series.model.js";
export async function assertCommentSeriesMember(seriesId, actor, allowedRoles) {
    if (!allowedRoles.includes(actor.role)) {
        throw new AppError("Comment access denied", 403);
    }
    const member = await SeriesMember.findOne({ seriesId, userId: actor.userId });
    if (!member || !member.isActive || !allowedRoles.includes(member.role)) {
        throw new AppError("Comment access denied", 403);
    }
    return member;
}
//# sourceMappingURL=comment-access.policy.js.map