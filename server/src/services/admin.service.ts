import { EarningItemModel, EarningModel } from "../db/models.js";

export async function listAssistantEarnings(assistantId: string) {
  const earnings = await EarningModel.find({ assistantId })
    .sort({ period: -1, updatedAt: -1 })
    .lean();
  const items = await EarningItemModel.find({ assistantId }).sort({ createdAt: -1 }).lean();
  // Attach each month's approved-task line items so the assistant can see what
  // makes up their monthly total (flowchart AD).
  return earnings.map((earning: any) => ({
    ...earning,
    items: items.filter((item: any) => item.earningId === earning.id),
  }));
}
