import { asyncRoute, ok, AppError } from "../lib/http.js";
import { AuthedRequest } from "../types.js";
import { getTantouEditor } from "../services/tantou.service.js";
import {
  assertCanReadGovernanceSeries,
  assertCanReadProductionSeries,
} from "../services/mvp-access.service.js";

export const getSeriesEditor = asyncRoute(async (req: AuthedRequest, res) => {
  const seriesId = String(req.params.seriesId);
  const actor = req.actor!;
  if (actor.role === "BOARD") {
    await assertCanReadGovernanceSeries(actor, seriesId);
  } else {
    await assertCanReadProductionSeries(actor, seriesId);
  }
  const editor = await getTantouEditor(seriesId);
  ok(res, editor);
});
