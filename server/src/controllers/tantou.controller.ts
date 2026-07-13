import { asyncRoute, ok } from "../lib/http.js";
import { AuthedRequest } from "../types.js";
import { getTantouEditor } from "../services/tantou.service.js";
import { assertCanReadSeries } from "../services/mvp-access.service.js";
import { requireActor } from "./helpers.js";

export const getSeriesEditor = asyncRoute(async (req: AuthedRequest, res) => {
  const seriesId = String(req.params.seriesId);
  await assertCanReadSeries(requireActor(req), seriesId);
  const editor = await getTantouEditor(seriesId);
  ok(res, editor);
});
