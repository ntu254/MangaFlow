import { asyncRoute, created } from "../../../lib/http.js";
import type { AuthedRequest } from "../../../types.js";
import { parseBody } from "../../../validators/common.js";
import { createChapterSchema } from "../../../validators/chapter.schema.js";
import {
  createSeriesChapter as createSeriesChapterCommand,
  rejectManualSeriesCreation,
} from "../application/series-production.service.js";

export const createSeries = asyncRoute(async () => {
  rejectManualSeriesCreation();
});

export const createSeriesChapter = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(createChapterSchema, req);
  created(res, await createSeriesChapterCommand(req, String(req.params.id), body));
});
