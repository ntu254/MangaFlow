import { asyncRoute, ok, AppError } from "../lib/http.js";
import { AuthedRequest } from "../types.js";
import { parseBody } from "../validators/common.js";
import { assignEditorSchema } from "../validators/tantou.schema.js";
import { getTantouEditor, assignTantouEditor, removeTantouEditor } from "../services/tantou.service.js";
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

export const assignSeriesEditor = asyncRoute(async (req: AuthedRequest, res) => {
  const seriesId = String(req.params.seriesId);
  const body = parseBody(assignEditorSchema, req);
  const member = await assignTantouEditor(req, seriesId, body.editorId, body.editorName);
  ok(res, member);
});

export const removeSeriesEditor = asyncRoute(async (req: AuthedRequest, res) => {
  const seriesId = String(req.params.seriesId);
  const result = await removeTantouEditor(req, seriesId);
  ok(res, result);
});
