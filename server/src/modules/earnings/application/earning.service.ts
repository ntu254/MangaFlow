import { EarningModel, EarningItemModel } from "../../../db/models.js";
import { nowIso } from "../../../domain/ids.js";

const DEFAULT_TASK_RATES: Record<string, number> = {
  cleaning: 30000,
  clean: 30000,
  redraw: 50000,
  lettering: 25000,
  typesetting: 25000,
  typeset: 25000,
  toning: 40000,
  tone: 40000,
  coloring: 60000,
  color: 60000,
  character: 50000,
  background: 40000,
  effects: 35000,
  sfx: 35000,
  default: 30000,
};

function parseEnvRates(): Record<string, number> {
  const raw = process.env.TASK_RATES;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const rate = Number(value);
      if (Number.isFinite(rate) && rate >= 0) out[key.trim().toLowerCase()] = rate;
    }
    return out;
  } catch {
    return {};
  }
}

const ENV_TASK_RATES = parseEnvRates();

export const EARNING_CURRENCY = process.env.EARNING_CURRENCY ?? "VND";

export function resolveTaskRate(taskType: string | undefined | null): number {
  const key = String(taskType ?? "default").trim().toLowerCase() || "default";
  const fromEnv = ENV_TASK_RATES[key] ?? ENV_TASK_RATES.default;
  if (fromEnv !== undefined) return fromEnv;
  return DEFAULT_TASK_RATES[key] ?? DEFAULT_TASK_RATES.default;
}

export function earningPeriodOf(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function earningIdFor(assistantId: string, period: string): string {
  return `earn-${assistantId}-${period}`;
}

export async function recomputeAssistantEarning(assistantId: string, period: string) {
  const existing = (await EarningModel.findOne({ assistantId, period }).lean()) as any;
  if (existing && ["CONFIRMED", "PAID", "VOIDED"].includes(String(existing.status))) {
    return existing;
  }

  const items = await EarningItemModel.find({
    assistantId,
    period,
    status: { $ne: "VOIDED" },
  }).lean();

  const subtotal = items.reduce((sum, item: any) => sum + Number(item.amount ?? 0), 0);
  const bonus = Number(existing?.bonus ?? 0);
  const penalty = Number(existing?.penalty ?? 0);
  const amount = subtotal + bonus - penalty;
  const now = nowIso();

  await EarningModel.findOneAndUpdate(
    { assistantId, period },
    {
      $set: {
        subtotal,
        amount,
        tasksCount: items.length,
        currency: EARNING_CURRENCY,
        updatedAt: now,
      },
      $setOnInsert: {
        id: earningIdFor(assistantId, period),
        assistantId,
        period,
        bonus: 0,
        penalty: 0,
        status: "PENDING",
        createdAt: now,
      },
    },
    { upsert: true },
  );

  return EarningModel.findOne({ assistantId, period }).lean();
}
