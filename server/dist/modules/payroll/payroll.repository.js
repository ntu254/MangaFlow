import { Task } from "../task/task.model.js";
import { AssistantEarning } from "./payroll.model.js";
export async function getTaskForPayroll(taskId) {
    return Task.findById(taskId);
}
export async function getEarningByTaskId(taskId) {
    return AssistantEarning.findOne({ taskId });
}
export async function createEarningRecord(input) {
    return AssistantEarning.create({
        taskId: input.taskId,
        seriesId: input.seriesId,
        chapterId: input.chapterId,
        assistantId: input.assistantId,
        baseRate: input.baseRate,
        deadlineMultiplier: input.deadlineMultiplier,
        finalPayment: input.finalPayment,
        isLate: input.isLate,
        status: "PENDING",
        calculatedAt: input.calculatedAt,
    });
}
export async function getEarningById(earningId) {
    return AssistantEarning.findById(earningId);
}
export async function updateEarningStatus(earningId, status, actorField, actorId) {
    const timestampField = actorField === "confirmedBy" ? "confirmedAt" : "paidAt";
    return AssistantEarning.findByIdAndUpdate(earningId, { status, [actorField]: actorId, [timestampField]: new Date() }, { new: true });
}
export async function listEarnings(query) {
    return AssistantEarning.find(query).sort({ createdAt: -1 }).lean();
}
//# sourceMappingURL=payroll.repository.js.map