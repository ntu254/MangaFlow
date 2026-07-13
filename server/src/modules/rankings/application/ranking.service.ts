import { RankingImportModel, RankingModel, SeriesModel } from "../../../db/models.js";
import { id, nowIso } from "../../../domain/ids.js";
import { AppError } from "../../../lib/http.js";
import { audit, notifyMany } from "../../../services/audit.service.js";
import { requireActor } from "../../../controllers/helpers.js";
import { rejectProtectedFields } from "../../../validators/common.js";
import type { AuthedRequest } from "../../../types.js";
import {
  assertCanReadGovernanceSeries,
  assertCanReadProductionSeries,
  readableProductionSeriesIds,
} from "../../../services/mvp-access.service.js";

export async function rankingListFilter(req: AuthedRequest) {
  const actor = requireActor(req);
  const filter: Record<string, any> = {};

  if (actor.role !== "BOARD") {
    const seriesIds = await readableProductionSeriesIds(actor);
    filter.seriesId = seriesIds.length > 0 ? { $in: seriesIds } : "__mvp_no_ranking_access__";
  }

  const querySeriesId = req.query.seriesId;
  if (querySeriesId) {
    if (actor.role === "BOARD") {
      await assertCanReadGovernanceSeries(actor, String(querySeriesId));
    } else {
      await assertCanReadProductionSeries(actor, String(querySeriesId));
    }
    filter.seriesId = String(querySeriesId);
  }

  return filter;
}

export function rankingModel() {
  return RankingModel;
}

export async function listSeriesRankings(req: AuthedRequest, seriesId: string) {
  const actor = requireActor(req);

  if (actor.role === "BOARD") {
    await assertCanReadGovernanceSeries(actor, seriesId);
  } else {
    await assertCanReadProductionSeries(actor, seriesId);
  }

  return RankingModel.find({ seriesId }).sort({ finalScore: -1 }).lean();
}

export async function importRankings(req: AuthedRequest, body: any) {
  const actor = requireActor(req);
  rejectProtectedFields(body as unknown as Record<string, unknown>);

  const batchId = id("rimport");
  const now = nowIso();

  await RankingImportModel.create({
    id: batchId,
    period: body.period,
    sourceFileName: body.fileName,
    importedById: actor.id,
    importedByName: actor.name,
    status: "PENDING",
    totalRows: body.rows.length,
    successRows: 0,
    failedRows: 0,
    errors: [],
    createdAt: now,
    updatedAt: now,
  });

  const seriesIds = [...new Set(body.rows.map((row: any) => row.seriesId).filter(Boolean))] as string[];
  const seriesRows = await SeriesModel.find({ id: { $in: seriesIds } })
    .select("id title authorId editorId")
    .lean();
  const seriesById = new Map(seriesRows.map((series: any) => [String(series.id), series]));

  const imported = [];
  const errors: string[] = [];
  const atRiskNotifications: { userId: string; kind: string; title: string; message: string }[] = [];

  for (const [index, row] of body.rows.entries()) {
    if (!row.seriesId && !row.seriesTitle) {
      errors.push(`rows.${index}: seriesId or seriesTitle is required.`);
      continue;
    }
    const series = row.seriesId ? seriesById.get(row.seriesId) : null;
    if (row.seriesId && !series) {
      errors.push(`rows.${index}: unknown seriesId ${row.seriesId}.`);
      continue;
    }

    const finalScore = row.finalScore ?? row.score ?? row.readerScore ?? 0;
    const readerScore = row.readerScore ?? row.score ?? finalScore;
    const voteCount = row.voteCount ?? row.votes ?? 0;
    const atRisk = row.atRisk ?? (finalScore < 5 || row.status === "AT_RISK");
    const status = row.status ?? (atRisk ? "AT_RISK" : "ACTIVE");
    const seriesId = row.seriesId ?? id("series-ext");
    const seriesTitle = series?.title ?? row.seriesTitle ?? seriesId;

    const previous = await RankingModel.findOne({ seriesId, period: body.period })
      .select({ atRisk: 1 })
      .lean();
    const becameAtRisk = atRisk && !(previous as any)?.atRisk;

    const ranking = await RankingModel.findOneAndUpdate(
      { seriesId, period: body.period },
      {
        $set: {
          seriesId,
          seriesTitle,
          period: body.period,
          readerScore,
          voteCount,
          finalScore,
          status,
          atRisk,
          source: body.source,
          importBatchId: batchId,
          importedById: actor.id,
          importedAt: now,
          importedFrom: body.fileName ?? "manual-import",
          updatedAt: now,
        },
        $setOnInsert: {
          id: id("rank"),
          createdAt: now,
        },
      },
      { returnDocument: "after", upsert: true },
    ).lean();
    imported.push(ranking);

    if (becameAtRisk && series) {
      for (const userId of [(series as any).authorId, (series as any).editorId]) {
        if (userId) {
          atRiskNotifications.push({
            userId: String(userId),
            kind: "series.at_risk",
            title: "Series at risk",
            message: `${seriesTitle} có nguy cơ bị huỷ do ranking thấp. Board sẽ xem xét.`,
          });
        }
      }
    }
  }

  if (atRiskNotifications.length > 0) {
    await notifyMany(atRiskNotifications);
  }

  const batchStatus = errors.length > 0 && imported.length === 0 ? "FAILED" : "IMPORTED";
  await RankingImportModel.updateOne(
    { id: batchId },
    {
      $set: {
        status: batchStatus,
        successRows: imported.length,
        failedRows: errors.length,
        errors: errors.map((message) => ({ message })),
        importedAt: now,
        updatedAt: now,
      },
    },
  );

  if (errors.length > 0 && imported.length === 0) {
    throw new AppError(400, errors.join("; "), "RANKING_IMPORT_INVALID");
  }

  await audit(req, "RANKING_IMPORTED", "ranking_import", batchId, {
    importBatchId: batchId,
    period: body.period,
    totalRows: body.rows.length,
    successRows: imported.length,
    failedRows: errors.length,
    sourceFileName: body.fileName,
  });

  return {
    id: batchId,
    period: body.period,
    source: body.source,
    fileName: body.fileName ?? "manual-import.csv",
    rowCount: body.rows.length,
    imported: imported.length,
    failed: errors.length,
    status: batchStatus,
    rankings: imported,
  };
}
