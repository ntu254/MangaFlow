import { AppError } from "../../../shared/errors/AppError.js";
import { SeriesMember } from "../../series/series.model.js";
import { ACTIVE_MEMBER_QUERY } from "../../../shared/policies/seriesMember.policy.js";
import { listEarnings } from "../payroll.repository.js";
export async function listPayrollEarningsService(actor) {
    if (actor.role === "ADMIN") {
        return listEarnings({});
    }
    if (actor.role === "ASSISTANT") {
        return listEarnings({ assistantId: actor.userId });
    }
    if (actor.role === "MANGAKA") {
        const memberships = await SeriesMember.find({
            userId: actor.userId,
            role: "MANGAKA",
            ...ACTIVE_MEMBER_QUERY,
        }).lean();
        return listEarnings({ seriesId: { $in: memberships.map((member) => member.seriesId) } });
    }
    throw new AppError("Payroll access denied", 403);
}
//# sourceMappingURL=payroll-query.service.js.map