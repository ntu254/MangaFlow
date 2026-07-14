import { AtRiskReportModel, SeriesModel } from "../../../db/models.js";
import { id, nowIso } from "../../../domain/ids.js";
import { AppError } from "../../../lib/http.js";
import { audit } from "../../../services/audit.service.js";
import { atRiskSeriesDecision } from "../../../services/workflow.service.js";
import { requireActor } from "../../../controllers/helpers.js";
import type { AuthedRequest } from "../../../types.js";

export async function createAtRiskReport(req: AuthedRequest, seriesId: string, body: any) {
  const actor = requireActor(req);
  const series = (await SeriesModel.findOne({ id: seriesId }).lean()) as any;
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  if (actor.role !== "EDITOR" || series.editorId !== actor.id) {
    throw new AppError(403, "Only the series Tantou Editor can submit an at-risk report.", "NOT_TANTOU_EDITOR");
  }

  const rankingSummary = String(body?.rankingSummary ?? "").trim();
  const recommendation = String(body?.recommendation ?? "").trim();
  if (!rankingSummary || !recommendation) {
    throw new AppError(400, "rankingSummary and recommendation are required.", "VALIDATION_ERROR");
  }

  const report = await AtRiskReportModel.create({
    id: id("risk-report"),
    seriesId,
    editorId: actor.id,
    editorName: actor.name,
    rankingSummary,
    recommendation,
    notes: typeof body?.notes === "string" ? body.notes : "",
    status: "SUBMITTED",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  await audit(req, "series.at_risk_report_submitted", "at_risk_report", report.id, { seriesId });
  return report;
}

export async function getLatestAtRiskReport(req: AuthedRequest, seriesId: string) {
  const actor = requireActor(req);
  const series = (await SeriesModel.findOne({ id: seriesId }).lean()) as any;
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  const canRead = actor.role === "BOARD" || (actor.role === "EDITOR" && series.editorId === actor.id);
  if (!canRead) {
    throw new AppError(404, "No submitted at-risk report found.", "AT_RISK_REPORT_NOT_FOUND");
  }
  const report = await AtRiskReportModel.findOne({ seriesId, status: "SUBMITTED" })
    .sort({ createdAt: -1 })
    .lean();
  if (!report) throw new AppError(404, "No submitted at-risk report found.", "AT_RISK_REPORT_NOT_FOUND");
  return report;
}

export function decideAtRiskSeries(
  req: AuthedRequest,
  seriesId: string,
  body: { decision?: unknown; publicationType?: unknown; note?: string },
) {
  return atRiskSeriesDecision(req, seriesId, body.decision, {
    publicationType: body.publicationType,
    note: body.note,
  });
}
