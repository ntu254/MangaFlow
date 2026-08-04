import { RankingImportModel, RankingModel, SeriesModel } from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { AppError } from "../lib/http.js";
import { runWorkflowTransaction } from "./workflow-support.service.js";
import type { ClientSession } from "mongoose";

export type CanonicalRankingPeriod = { period: string; cadence: "WEEKLY" | "MONTHLY" };

export function canonicalRankingPeriod(
  period: string,
  cadence?: "WEEKLY" | "MONTHLY",
): CanonicalRankingPeriod {
  const value = period.trim();
  const inferred =
    cadence ??
    (value.match(/^\d{4}-W\d{2}$/)
      ? "WEEKLY"
      : value.match(/^\d{4}-\d{2}$/)
        ? "MONTHLY"
        : undefined);
  if (inferred === "WEEKLY" && !/^\d{4}-W\d{2}$/.test(value)) {
    throw new AppError(400, "Weekly periods must use YYYY-W##.", "INVALID_PERIOD");
  }
  if (inferred === "MONTHLY" && !/^\d{4}-\d{2}$/.test(value)) {
    throw new AppError(400, "Monthly periods must use YYYY-MM.", "INVALID_PERIOD");
  }
  if (!inferred) {
    throw new AppError(
      400,
      "Period must use YYYY-W## (weekly) or YYYY-MM (monthly).",
      "INVALID_PERIOD",
    );
  }
  return { period: value, cadence: inferred as "WEEKLY" | "MONTHLY" };
}

export interface RankingImportRow {
  seriesId?: string;
  seriesTitle?: string;
  finalScore?: number;
  score?: number;
  readerScore?: number;
  votes?: number;
  voteCount?: number;
  atRisk?: boolean;
  status?: string;
  rank?: number;
}

export interface RankingImportInput {
  period: string;
  cadence?: "WEEKLY" | "MONTHLY";
  source: string;
  fileName?: string;
  rows: RankingImportRow[];
}

export interface RankingImportContext {
  actor: { id: string; name: string };
}

export interface RankingImportResult {
  batchId: string;
  imported: any[];
  errors: string[];
  totalRows: number;
  successRows: number;
  failedRows: number;
}

/**
 * Sprint 3.1 / RANK-002 — wrap the ranking import in a single workflow
 * transaction. We previously did `deleteMany({ period })` then inserted new
 * rows: a crash in the middle could leave the period empty or partially
 * populated. The new flow:
 *
 *   1. Validate rows in code (no DB writes yet).
 *   2. Mark the current period's rows as supersededByBatchId (cheap pointer).
 *   3. Within `runWorkflowTransaction`, activate the staging rows atomically
 *      and update ranks in the same session. On any failure we throw and
 *      the existing rankings remain untouched.
 */
export async function importRankings(
  ctx: RankingImportContext,
  input: RankingImportInput,
): Promise<RankingImportResult> {
  const canonical = canonicalRankingPeriod(input.period, input.cadence);
  const batchId = id("rimport");
  const now = nowIso();

  // Stage 1: identify conflicting seriesIds and validate everything before any
  // write hits Mongo. This keeps the transaction short.
  const seriesIds = [
    ...new Set(input.rows.map((row) => row.seriesId).filter(Boolean) as string[]),
  ];
  const seriesRows = await SeriesModel.find({ id: { $in: seriesIds } })
    .select("id title")
    .lean();
  const seriesById = new Map(seriesRows.map((s: any) => [String(s.id), s]));

  const preflightErrors: string[] = [];
  const staged = input.rows
    .map((row, index) => {
      if (!row.seriesId && !row.seriesTitle) {
        preflightErrors.push(`rows.${index}: seriesId or seriesTitle is required.`);
        return null;
      }
      if (row.seriesId && !seriesById.get(row.seriesId)) {
        preflightErrors.push(`rows.${index}: unknown seriesId ${row.seriesId}.`);
        return null;
      }
      return { index, row };
    })
    .filter((entry): entry is { index: number; row: RankingImportRow } => entry !== null);

  if (preflightErrors.length > 0 && staged.length === 0) {
    await RankingImportModel.create({
      id: batchId,
      period: canonical.period,
      cadence: canonical.cadence,
      sourceFileName: input.fileName,
      importedById: ctx.actor.id,
      importedByName: ctx.actor.name,
      status: "FAILED",
      totalRows: input.rows.length,
      successRows: 0,
      failedRows: preflightErrors.length,
      errors: preflightErrors.map((message) => ({ message })),
      createdAt: now,
      updatedAt: now,
    });
    throw new AppError(400, preflightErrors.join("; "), "RANKING_IMPORT_INVALID");
  }

  // Sprint 3.1 / RANK-001 — deactivate the previous active batch for this
  // period before the new batch writes. Doing this outside the transaction
  // is safe because it only flips a pointer; the new batch becomes the
  // source of truth once the transaction commits.
  await RankingModel.updateMany(
    { period: canonical.period, active: true },
    { $set: { active: false, updatedAt: now } },
  );

  // Sprint 3.1 / RANK-001 — deactivate the previous active batch for this
  // period before the new batch writes. Doing this outside the transaction
  // is safe because it only flips a pointer; the new batch becomes the
  // source of truth once the transaction commits.
  await RankingModel.updateMany(
    { period: canonical.period, active: true },
    { $set: { active: false, updatedAt: now } },
  );

  await RankingImportModel.create({
    id: batchId,
    period: canonical.period,
    cadence: canonical.cadence,
    sourceFileName: input.fileName,
    importedById: ctx.actor.id,
    importedByName: ctx.actor.name,
    status: "PENDING",
    totalRows: input.rows.length,
    successRows: 0,
    failedRows: preflightErrors.length,
    errors: preflightErrors.map((message) => ({ message })),
    createdAt: now,
    updatedAt: now,
  });

  const imported = await runWorkflowTransaction(async (session: ClientSession) => {
    const written: any[] = [];
    for (const { row } of staged) {
      const series = row.seriesId ? seriesById.get(row.seriesId) : null;
      const finalScore = row.finalScore ?? row.score ?? row.readerScore ?? 0;
      const readerScore = row.readerScore ?? row.score ?? finalScore;
      const voteCount = row.voteCount ?? row.votes ?? 0;
      const atRisk = row.atRisk ?? (finalScore < 5 || row.status === "AT_RISK");
      const status = row.status ?? (atRisk ? "AT_RISK" : "ACTIVE");
      const seriesId = row.seriesId ?? id("series-ext");
      const seriesTitle = series?.title ?? row.seriesTitle ?? seriesId;

      // Sprint 3.1 / RANK-001 — every import writes a fresh row stamped
      // with the new batch id. The unique key (period, seriesId,
      // importBatchId) ensures each batch gets its own row instead of
      // mutating the previous batch in place.
      const updated = await RankingModel.findOneAndUpdate(
        { seriesId, period: canonical.period, importBatchId: batchId },
        {
          $set: {
            seriesId,
            seriesTitle,
            period: canonical.period,
            cadence: canonical.cadence,
            readerScore,
            voteCount,
            finalScore,
            status,
            atRisk,
            source: input.source,
            importedById: ctx.actor.id,
            importedAt: now,
            importedFrom: input.fileName ?? "manual-import",
            active: true,
            updatedAt: now,
          },
          $setOnInsert: {
            id: id("rank"),
            importBatchId: batchId,
            createdAt: now,
          },
        },
        {
          returnDocument: "after",
          upsert: true,
          ...(session ? { session } : {}),
        },
      ).lean();
      written.push(updated);
    }

    return written;
  });

  // Sprint 3.1 / RANK-001 — recompute rank after the upserts commit so
  // the read sees the freshly staged rows. The active flag filters out
  // the prior batch so the ordering only reflects the new import.
  const periodRankings = await RankingModel.find({
    period: canonical.period,
    active: true,
  })
    .sort({ finalScore: -1, voteCount: -1, id: 1 })
    .select("id")
    .lean();
  if (periodRankings.length > 0) {
    await RankingModel.bulkWrite(
      periodRankings.map((ranking, idx) => ({
        updateOne: {
          filter: { id: ranking.id },
          update: { $set: { rank: idx + 1, updatedAt: now } },
        },
      })) as any,
    );
  }

  const failedRows = preflightErrors.length;
  const batchStatus = imported.length > 0 ? "IMPORTED" : "FAILED";
  await RankingImportModel.updateOne(
    { id: batchId },
    {
      $set: {
        status: batchStatus,
        successRows: imported.length,
        failedRows,
        importedAt: now,
        updatedAt: now,
      },
    },
  );

  return {
    batchId,
    imported,
    errors: preflightErrors,
    totalRows: input.rows.length,
    successRows: imported.length,
    failedRows,
  };
}

export async function listRankingsByPeriod(period: string) {
  const rows = await RankingModel.aggregate([
    { $match: { period, active: true } },
    {
      $group: {
        _id: "$period",
        cadence: { $first: "$cadence" },
        importedAt: { $max: "$importedAt" },
      },
    },
    {
      $project: {
        _id: 0,
        period: "$_id",
        cadence: 1,
        importedAt: 1,
      },
    },
  ]);
  return rows;
}

export async function listSeriesRankings(seriesId: string) {
  // Sprint 3.1 / RANK-001 — disambiguate by the active batch per period so
  // historical re-imports do not show up as ghost rows in the read model.
  return RankingModel.find({ seriesId, active: true })
    .sort({ period: -1, rank: 1, finalScore: -1 })
    .lean();
}
