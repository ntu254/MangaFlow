import { AppError } from "../../../shared/errors/AppError.js";
import { SeriesMember } from "../../series/series.model.js";
export async function assertSeriesMangakaOrAdmin(seriesId, actor) {
    if (actor.role === "ADMIN")
        return;
    if (actor.role !== "MANGAKA") {
        throw new AppError("Payroll access denied", 403);
    }
    const member = await SeriesMember.findOne({ seriesId, userId: actor.userId });
    if (!member || !member.isActive || member.role !== "MANGAKA") {
        throw new AppError("Payroll access denied", 403);
    }
}
export async function assertEarningMangakaOrAdmin(earning, actor) {
    await assertSeriesMangakaOrAdmin(String(earning.seriesId), actor);
}
//# sourceMappingURL=payroll-access.policy.js.map