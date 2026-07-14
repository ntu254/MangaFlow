import { asyncRoute, ok } from "../../../lib/http.js";
import type { AuthedRequest } from "../../../types.js";
import {
  assertCanReadGovernanceSeries,
  assertCanReadProductionSeries,
} from "../../../services/mvp-access.service.js";
import { getTantouEditor } from "../application/tantou-editor.service.js";

export const getSeriesEditor = asyncRoute(async (req: AuthedRequest, res) => {
  const seriesId = String(req.params.seriesId);
  const actor = req.actor!;
  if (actor.role === "BOARD") {
    await assertCanReadGovernanceSeries(actor, seriesId);
  } else {
    await assertCanReadProductionSeries(actor, seriesId);
  }
  ok(res, await getTantouEditor(seriesId));
});
