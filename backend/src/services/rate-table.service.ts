import { RateTableModel } from "../db/models.js";
import { id } from "../domain/ids.js";
import { AppError } from "../lib/http.js";
import type { AuthedRequest, RequestActor } from "../types.js";
import { audit } from "./audit.service.js";
import { runWorkflowTransaction } from "./workflow-support.service.js";
import type { ClientSession } from "mongoose";

export const RATE_TABLE_CAPABILITY = "MANAGE_RATE_TABLE" as const;

type RateInput = {
  code: string;
  label: string;
  workUnitType: string;
  amount: number;
  currency?: string;
  effectiveFrom?: string;
  effectiveTo?: string | null;
};

type RatePatch = {
  label?: string;
  status?: "ACTIVE" | "INACTIVE";
  effectiveTo?: string | null;
};

type RateRevisionInput = {
  label: string;
  amount: number;
  currency?: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
};

function assertRateTableManager(actor: RequestActor) {
  if (actor.role !== "ADMIN") {
    throw new AppError(403, "Rate-table administration requires MANAGE_RATE_TABLE.", "RATE_TABLE_ACCESS_REQUIRED");
  }
}

function parseDate(value: string | undefined, field: string, fallback: Date) {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(400, `${field} must be a valid ISO date.`, "VALIDATION_ERROR");
  }
  return parsed;
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function normalizeCurrency(currency = "VND") {
  return currency.trim().toUpperCase();
}

async function assertNoActiveOverlap(
  code: string,
  effectiveFrom: Date,
  effectiveTo: Date | undefined,
  excludeId?: string,
  session?: ClientSession,
) {
  const end = effectiveTo ?? new Date("9999-12-31T23:59:59.999Z");
  const filter: Record<string, unknown> = {
    code,
    status: "ACTIVE",
    effectiveFrom: { $lt: end },
    $or: [
      { effectiveTo: { $exists: false } },
      { effectiveTo: null },
      { effectiveTo: { $gt: effectiveFrom } },
    ],
  };
  if (excludeId) filter.id = { $ne: excludeId };
  if (await RateTableModel.exists(filter).session(session ?? null)) {
    throw new AppError(
      409,
      "An active rate already covers part of this effective window.",
      "RATE_WINDOW_OVERLAP",
    );
  }
}

export async function listRateTable(req: AuthedRequest) {
  assertRateTableManager(req.actor!);
  return RateTableModel.find({}).sort({ code: 1, version: -1 }).lean();
}

export async function listActiveRates() {
  const now = new Date();
  return RateTableModel.find({
    status: "ACTIVE",
    effectiveFrom: { $lte: now },
    $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: null }, { effectiveTo: { $gt: now } }],
  })
    .sort({ code: 1, version: -1 })
    .lean();
}

export async function resolveActiveRate(code: string, at = new Date()) {
  const normalizedCode = normalizeCode(code);
  const rate = (await RateTableModel.findOne({
    code: normalizedCode,
    status: "ACTIVE",
    effectiveFrom: { $lte: at },
    $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: null }, { effectiveTo: { $gt: at } }],
  })
    .sort({ version: -1 })
    .lean()) as any;
  if (!rate) {
    throw new AppError(
      409,
      `No active rate is configured for ${normalizedCode}.`,
      "RATE_CONFIGURATION_REQUIRED",
    );
  }
  return rate;
}

export async function createRateTableEntry(req: AuthedRequest, input: RateInput) {
  assertRateTableManager(req.actor!);
  const code = normalizeCode(input.code);
  const currency = normalizeCurrency(input.currency);
  const effectiveFrom = parseDate(input.effectiveFrom, "effectiveFrom", new Date());
  const effectiveTo = input.effectiveTo ? parseDate(input.effectiveTo, "effectiveTo", effectiveFrom) : undefined;
  if (effectiveTo && effectiveTo <= effectiveFrom) {
    throw new AppError(400, "effectiveTo must be after effectiveFrom.", "INVALID_RATE_WINDOW");
  }
  if (input.amount <= 0) {
    throw new AppError(400, "Rate amount must be greater than zero.", "INVALID_RATE_AMOUNT");
  }

  const latest = (await RateTableModel.findOne({ code }).sort({ version: -1 }).lean()) as any;
  const status = "ACTIVE" as const;
  await assertNoActiveOverlap(code, effectiveFrom, effectiveTo);
  const now = new Date();
  const created = await RateTableModel.create({
    id: id("rate"),
    code,
    label: input.label.trim(),
    workUnitType: input.workUnitType.trim(),
    amount: input.amount,
    currency,
    version: Number(latest?.version ?? 0) + 1,
    status,
    effectiveFrom,
    effectiveTo,
    createdById: req.actor!.id,
    updatedById: req.actor!.id,
    createdAt: now,
    updatedAt: now,
  });
  await audit(req, "rate_table.create", "rate_table", created.id, {
    code,
    version: created.version,
    amount: created.amount,
    currency,
  });
  return created;
}

export async function patchRateTableEntry(req: AuthedRequest, rateId: string, input: RatePatch) {
  assertRateTableManager(req.actor!);
  const existing = (await RateTableModel.findOne({ id: rateId }).lean()) as any;
  if (!existing) throw new AppError(404, "Rate-table entry not found.", "RATE_NOT_FOUND");
  const patch: Record<string, unknown> = { updatedAt: new Date(), updatedById: req.actor!.id };
  if (input.label !== undefined) patch.label = input.label.trim();
  if (input.status !== undefined) patch.status = input.status;
  if (input.effectiveTo !== undefined) {
    const effectiveTo = input.effectiveTo ? parseDate(input.effectiveTo, "effectiveTo", new Date()) : undefined;
    if (effectiveTo && effectiveTo <= new Date(existing.effectiveFrom)) {
      throw new AppError(400, "effectiveTo must be after effectiveFrom.", "INVALID_RATE_WINDOW");
    }
    patch.effectiveTo = effectiveTo;
  }
  const nextStatus = input.status ?? existing.status;
  if (nextStatus === "ACTIVE") {
    const nextEffectiveTo = Object.prototype.hasOwnProperty.call(input, "effectiveTo")
      ? (patch.effectiveTo as Date | undefined)
      : (existing.effectiveTo as Date | undefined);
    await assertNoActiveOverlap(
      existing.code,
      new Date(existing.effectiveFrom),
      nextEffectiveTo,
      existing.id,
    );
  }
  const updated = (await RateTableModel.findOneAndUpdate({ id: rateId }, { $set: patch }, { returnDocument: "after" }).lean()) as any;
  await audit(req, "rate_table.update", "rate_table", rateId, {
    changedFields: Object.keys(patch).filter((field) => !["updatedAt", "updatedById"].includes(field)),
  });
  return updated;
}

export async function scheduleRateTableRevision(
  req: AuthedRequest,
  rateId: string,
  input: RateRevisionInput,
) {
  assertRateTableManager(req.actor!);
  const effectiveFrom = parseDate(input.effectiveFrom, "effectiveFrom", new Date());
  const effectiveTo = input.effectiveTo
    ? parseDate(input.effectiveTo, "effectiveTo", effectiveFrom)
    : undefined;
  if (effectiveTo && effectiveTo <= effectiveFrom) {
    throw new AppError(400, "effectiveTo must be after effectiveFrom.", "INVALID_RATE_WINDOW");
  }
  if (input.amount <= 0) {
    throw new AppError(400, "Rate amount must be greater than zero.", "INVALID_RATE_AMOUNT");
  }

  return runWorkflowTransaction(async (session) => {
    const current = (await RateTableModel.findOne({ id: rateId }).session(session).lean()) as any;
    if (!current) throw new AppError(404, "Rate-table entry not found.", "RATE_NOT_FOUND");
    if (current.status !== "ACTIVE") {
      throw new AppError(409, "Only an active rate can be revised.", "RATE_REVISION_BASE_INACTIVE");
    }

    const currentFrom = new Date(current.effectiveFrom);
    const currentTo = current.effectiveTo ? new Date(current.effectiveTo) : undefined;
    if (effectiveFrom <= currentFrom || (currentTo && effectiveFrom > currentTo)) {
      throw new AppError(
        409,
        "A revision must start inside the active version's effective window.",
        "INVALID_RATE_REVISION_WINDOW",
      );
    }

    await assertNoActiveOverlap(current.code, effectiveFrom, effectiveTo, current.id, session);
    const latest = (await RateTableModel.findOne({ code: current.code })
      .sort({ version: -1 })
      .session(session)
      .lean()) as any;
    const now = new Date();
    const [revision] = await RateTableModel.create(
      [
        {
          id: id("rate"),
          code: current.code,
          label: input.label.trim(),
          workUnitType: current.workUnitType,
          amount: input.amount,
          currency: normalizeCurrency(input.currency ?? current.currency),
          version: Number(latest?.version ?? 0) + 1,
          status: "ACTIVE",
          effectiveFrom,
          effectiveTo,
          createdById: req.actor!.id,
          updatedById: req.actor!.id,
          createdAt: now,
          updatedAt: now,
        },
      ],
      { session },
    );
    await RateTableModel.updateOne(
      { id: current.id, status: "ACTIVE" },
      { $set: { effectiveTo: effectiveFrom, updatedAt: now, updatedById: req.actor!.id } },
      { session },
    );
    await audit(req, "rate_table.revision_schedule", "rate_table", revision.id, {
      previousRateId: current.id,
      code: current.code,
      previousVersion: current.version,
      version: revision.version,
      effectiveFrom,
    }, session);
    return revision.toObject();
  });
}
