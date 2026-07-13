import { AtRiskReportModel, SeriesModel } from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { AppError, asyncRoute, created, ok } from "../lib/http.js";
import { audit } from "../services/audit.service.js";
import { assertCanReadSeries } from "../services/mvp-access.service.js";
import { requireActor } from "./helpers.js";
import type { AuthedRequest } from "../types.js";

export const createAtRiskReport = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const seriesId = String(req.params.seriesId);
  const series = (await SeriesModel.findOne({ id: seriesId }).lean()) as any;
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  if (actor.role !== "EDITOR" || series.editorId !== actor.id) {
    throw new AppError(403, "Only the series Tantou Editor can submit an at-risk report.", "NOT_TANTOU_EDITOR");
  }
  const rankingSummary = String(req.body?.rankingSummary ?? "").trim();
  const recommendation = String(req.body?.recommendation ?? "").trim();
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
    notes: typeof req.body?.notes === "string" ? req.body.notes : "",
    status: "SUBMITTED",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  await audit(req, "series.at_risk_report_submitted", "at_risk_report", report.id, { seriesId });
  created(res, report);
});

export const getLatestAtRiskReport = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const seriesId = String(req.params.seriesId);
  await assertCanReadSeries(actor, seriesId, { allowBoardGovernance: true });
  const report = await AtRiskReportModel.findOne({ seriesId, status: "SUBMITTED" })
    .sort({ createdAt: -1 })
    .lean();
  if (!report) throw new AppError(404, "No submitted at-risk report found.", "AT_RISK_REPORT_NOT_FOUND");
  ok(res, report);
});
