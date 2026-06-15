import { calculateTaskEarningService, confirmTaskEarningService, listPayrollEarningsService, markEarningPaidService, } from "./payroll.service.js";
export async function calculateTaskEarning(req, res) {
    const earning = await calculateTaskEarningService(String(req.params.taskId), req.user);
    res.status(201).json({ success: true, message: "Task earning calculated", data: earning });
}
export async function confirmTaskEarning(req, res) {
    const earning = await confirmTaskEarningService(String(req.params.taskId), req.user);
    res.json({ success: true, message: "Task earning confirmed", data: earning });
}
export async function markEarningPaid(req, res) {
    const earning = await markEarningPaidService(String(req.params.earningId), req.user);
    res.json({ success: true, message: "Earning marked paid", data: earning });
}
export async function listPayrollEarnings(req, res) {
    const earnings = await listPayrollEarningsService(req.user);
    res.json({ success: true, message: "Payroll earnings retrieved", data: earnings });
}
//# sourceMappingURL=payroll.controller.js.map