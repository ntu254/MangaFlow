import { AppError } from "../../../shared/errors/AppError.js";
import { findActiveSeriesMember } from "../../../shared/policies/seriesMember.policy.js";
export async function assertSeriesMangakaOrAdmin(seriesId, actor) {
    if (actor.role === "ADMIN")
        return;
    if (actor.role !== "MANGAKA") {
        throw new AppError("Payroll access denied", 403);
    }
    const member = await findActiveSeriesMember(seriesId, actor.userId);
    if (!member || member.role !== "MANGAKA") {
        throw new AppError("Payroll access denied", 403);
    }
}
export async function assertEarningMangakaOrAdmin(earning, actor) {
    await assertSeriesMangakaOrAdmin(String(earning.seriesId), actor);
}
//# sourceMappingURL=payroll-access.policy.js.map