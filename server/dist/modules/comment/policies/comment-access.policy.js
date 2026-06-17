import { AppError } from "../../../shared/errors/AppError.js";
import { findActiveSeriesMember } from "../../../shared/policies/seriesMember.policy.js";
export async function assertCommentSeriesMember(seriesId, actor, allowedRoles) {
    if (!allowedRoles.includes(actor.role)) {
        throw new AppError("Comment access denied", 403);
    }
    const member = await findActiveSeriesMember(seriesId, actor.userId);
    if (!member || !allowedRoles.includes(member.role)) {
        throw new AppError("Comment access denied", 403);
    }
    return member;
}
//# sourceMappingURL=comment-access.policy.js.map