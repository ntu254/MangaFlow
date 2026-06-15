import { AppError } from "../../../shared/errors/AppError.js";
import { getEarningByTaskId, updateEarningStatus } from "../payroll.repository.js";
import { assertEarningMangakaOrAdmin } from "../policies/payroll-access.policy.js";
export async function confirmTaskEarningService(taskId, actor) {
    const earning = await getEarningByTaskId(taskId);
    if (!earning) {
        throw new AppError("Earning not found", 404);
    }
    await assertEarningMangakaOrAdmin(earning, actor);
    if (earning.status !== "PENDING") {
        throw new AppError("Only pending earnings can be confirmed", 409);
    }
    return updateEarningStatus(String(earning._id), "CONFIRMED", "confirmedBy", actor.userId);
}
export async function markEarningPaidService(earningId, actor) {
    if (actor.role !== "ADMIN") {
        throw new AppError("Only Admin can mark earnings paid", 403);
    }
    const earning = await import("../payroll.repository.js").then((m) => m.getEarningById(earningId));
    if (!earning) {
        throw new AppError("Earning not found", 404);
    }
    if (earning.status !== "CONFIRMED") {
        throw new AppError("Only confirmed earnings can be marked paid", 409);
    }
    return updateEarningStatus(earningId, "PAID", "paidBy", actor.userId);
}
//# sourceMappingURL=payroll-command.service.js.map