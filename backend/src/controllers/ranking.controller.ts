import { asyncRoute, ok } from "../lib/http.js";
import { SeriesModel } from "../db/models.js";
import { requireActor } from "./helpers.js";
import { AppError } from "../lib/http.js";
import {
  importRankings,
  listRankingsByPeriod,
  listSeriesRankings,
} from "../services/ranking.service.js";
import { audit } from "../services/audit.service.js";
import { parseBody, rejectProtectedFields } from "../validators/common.js";
import { z } from "zod";
import type { AuthedRequest } from "../types.js";

const rankingImportRowSchema = z
  .object({
    seriesId: z.string().min(1).optional(),
    seriesTitle: z.string().min(1).optional(),
    score: z.coerce.number().min(0).max(10).optional(),
    finalScore: z.coerce.number().min(0).max(10).optional(),
    readerScore: z.coerce.number().min(0).max(10).optional(),
    votes: z.coerce.number().int().min(0).optional(),
    voteCount: z.coerce.number().int().min(0).optional(),
    rank: z.coerce.number().int().positive().optional(),
    status: z.string().optional(),
    atRisk: z.boolean().optional(),
  })
  .strict();

const rankingImportSchema = z
  .object({
    period: z.string().min(1).max(80),
    cadence: z.enum(["WEEKLY", "MONTHLY"]).optional(),
    source: z.string().min(1).max(80),
    fileName: z.string().min(1).max(240).optional(),
    rows: z.array(rankingImportRowSchema).min(1).max(500),
  })
  .strict();

/**
 * Sprint 3.1 — moves the ranking endpoints out of notification.controller.ts
 * so the controller surface for notifications no longer doubles as the
 * ranking import surface.
 */
export const listRankingPeriods = asyncRoute(async (_req: AuthedRequest, res) => {
  const periods = await listRankingsByPeriod("");
  ok(res, periods);
});

export const listRankingPeriodFor = asyncRoute(async (req: AuthedRequest, res) => {
  const period = String(req.params.period);
  const rows = await listRankingsByPeriod(period);
  ok(res, rows);
});

export const getSeriesRankings = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const seriesId = String(req.params.seriesId);
  if (actor.role === "MANGAKA") {
    const series = await SeriesModel.findOne({ id: seriesId, authorId: actor.id }).lean();
    if (!series) {
      throw new AppError(
        403,
        "You do not have permission to view rankings for this series.",
        "FORBIDDEN",
      );
    }
  }
  const rankings = await listSeriesRankings(seriesId);
  ok(res, rankings);
});

export const importRankingsController = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const body = parseBody(rankingImportSchema, req);
  rejectProtectedFields(body as Record<string, unknown>);
  const result = await importRankings(
    { actor: { id: actor.id, name: actor.name } },
    {
      period: body.period,
      cadence: body.cadence,
      source: body.source,
      fileName: body.fileName,
      rows: body.rows,
    },
  );
  await audit(req, "RANKING_IMPORTED", "ranking_import", result.batchId, {
    importBatchId: result.batchId,
    period: body.period,
    totalRows: result.totalRows,
    successRows: result.successRows,
    failedRows: result.failedRows,
  });
  const rankedImported = result.imported;
  ok(res, {
    batchId: result.batchId,
    period: body.period,
    totalRows: result.totalRows,
    successRows: result.successRows,
    failedRows: result.failedRows,
    errors: result.errors,
    rankings: rankedImported,
  });
});
