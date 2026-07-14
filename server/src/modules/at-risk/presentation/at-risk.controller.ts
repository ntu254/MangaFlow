import { asyncRoute, created, ok } from "../../../lib/http.js";
import { parseBody } from "../../../validators/common.js";
import type { AuthedRequest } from "../../../types.js";
import {
  createAtRiskReport as createAtRiskReportCommand,
  decideAtRiskSeries,
  getLatestAtRiskReport as getLatestAtRiskReportQuery,
} from "../application/at-risk.service.js";
import { atRiskDecisionSchema, atRiskReportSchema } from "./at-risk.schemas.js";

export const createAtRiskReport = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(atRiskReportSchema, req);
  created(res, await createAtRiskReportCommand(req, String(req.params.seriesId), body));
});

export const getLatestAtRiskReport = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await getLatestAtRiskReportQuery(req, String(req.params.seriesId)));
});

export const atRiskDecision = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(atRiskDecisionSchema, req);
  ok(res, await decideAtRiskSeries(req, String(req.params.seriesId), body));
});
