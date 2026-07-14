import { AtRiskReportModel, RankingModel, SeriesModel, stripMongo } from "../../../db/models.js";
import { id, nowIso } from "../../../domain/ids.js";
import { AppError } from "../../../lib/http.js";
import { audit, notifyMany } from "../../../services/audit.service.js";
import { requireActor } from "../../../controllers/helpers.js";
import type { AuthedRequest } from "../../../types.js";

export type AtRiskDecision = "CONTINUE" | "RESCHEDULE" | "HIATUS" | "CANCELLED";

function normalizeAtRiskDecision(value: unknown): AtRiskDecision {
  const normalized = String(value ?? "").toUpperCase();
  if (["CONTINUE", "RESCHEDULE", "HIATUS", "CANCELLED"].includes(normalized)) {
    return normalized as AtRiskDecision;
  }
  if (normalized === "CANCEL") return "CANCELLED";
  throw new AppError(
    400,
    "Decision must be CONTINUE, RESCHEDULE, HIATUS, or CANCELLED.",
    "VALIDATION_ERROR",
  );
}

function normalizePublicationType(value: unknown) {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized === "WEEKLY" || normalized === "MONTHLY") return normalized;
  return null;
}

function cadenceFromPublicationType(value: unknown) {
  return String(value ?? "").toUpperCase() === "WEEKLY" ? "weekly" : "monthly";
}

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
  return decideAtRiskSeriesCommand(req, seriesId, body.decision, {
    publicationType: body.publicationType,
    note: body.note,
  });
}

async function decideAtRiskSeriesCommand(
  req: AuthedRequest,
  seriesId: string,
  rawDecision: unknown,
  opts: { publicationType?: unknown; note?: string } = {},
) {
  const actor = requireActor(req);
  if (actor.role !== "BOARD") {
    throw new AppError(403, "You do not have permission for this action.", "FORBIDDEN");
  }
  const decision = normalizeAtRiskDecision(rawDecision);

  const series = (await SeriesModel.findOne({ id: seriesId }).lean()) as any;
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  const report = await AtRiskReportModel.findOne({ seriesId, status: "SUBMITTED" })
    .sort({ createdAt: -1 })
    .lean();
  if (!report) {
    throw new AppError(
      409,
      "A submitted Tantou at-risk report is required before the Board can decide.",
      "AT_RISK_REPORT_REQUIRED",
    );
  }

  const patch: Record<string, unknown> = { updatedAt: nowIso() };
  const resumeFromHiatus = String(series.status) === "HIATUS" ? "ONGOING" : series.status;

  switch (decision) {
    case "CONTINUE":
      patch.status = resumeFromHiatus;
      await RankingModel.updateMany(
        { seriesId, $or: [{ atRisk: true }, { status: "AT_RISK" }] },
        { $set: { atRisk: false, status: "ACTIVE", updatedAt: nowIso() } },
      );
      break;
    case "RESCHEDULE": {
      const pubType = normalizePublicationType(opts.publicationType);
      if (!pubType) throw new AppError(400, "Invalid publicationType.", "VALIDATION_ERROR");
      patch.publicationType = pubType;
      patch.cadence = cadenceFromPublicationType(pubType);
      patch.status = resumeFromHiatus;
      break;
    }
    case "HIATUS":
      patch.status = "HIATUS";
      break;
    case "CANCELLED":
      patch.status = "CANCELLED";
      patch.cancelledAt = new Date();
      patch.cancelledById = actor.id;
      patch.cancelReason = opts.note ?? "";
      break;
  }

  await SeriesModel.updateOne({ id: seriesId }, { $set: patch });

  const auditAction = `series.at_risk_${decision.toLowerCase()}`;
  const recipients = [series.authorId, series.editorId].filter(Boolean) as string[];
  await notifyMany(
    recipients.map((userId) => ({
      userId,
      kind: auditAction,
      title: "Series decision",
      message: `Board decision for ${series.title ?? seriesId}: ${decision}.`,
    })),
  );

  await audit(req, auditAction, "series", seriesId, {
    decision,
    note: opts.note,
    reportId: (report as any).id,
    publicationType: patch.publicationType,
    status: patch.status,
  });

  return stripMongo(await SeriesModel.findOne({ id: seriesId }).lean());
}
