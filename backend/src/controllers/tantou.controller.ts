import { asyncRoute, ok, AppError } from "../lib/http.js";
import { AuthedRequest } from "../types.js";
import { parseBody } from "../validators/common.js";
import { assignEditorSchema } from "../validators/tantou.schema.js";
import { getTantouEditor, assignTantouEditor, removeTantouEditor } from "../services/tantou.service.js";

export const getSeriesEditor = asyncRoute(async (req: AuthedRequest, res) => {
  const seriesId = String(req.params.seriesId);
  const editor = await getTantouEditor(seriesId);
  ok(res, editor);
});

export const assignSeriesEditor = asyncRoute(async (req: AuthedRequest, res) => {
  const seriesId = String(req.params.seriesId);
  const body = parseBody(assignEditorSchema, req);
  const member = await assignTantouEditor(req, seriesId, body.editorId);
  ok(res, member);
});

export const removeSeriesEditor = asyncRoute(async (req: AuthedRequest, res) => {
  const seriesId = String(req.params.seriesId);
  const result = await removeTantouEditor(req, seriesId);
  ok(res, result);
});
