import { asyncRoute, created, ok } from "../../../lib/http.js";
import type { AuthedRequest } from "../../../types.js";
import { parseBody } from "../../../validators/common.js";
import { createPageSchema, patchPageSchema } from "../../../validators/chapter.schema.js";
import {
  createChapterPage as createChapterPageCommand,
  deletePage as deletePageCommand,
  updatePage as updatePageCommand,
} from "../application/page-production.service.js";

export const createChapterPage = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(createPageSchema, req);
  created(res, await createChapterPageCommand(req, String(req.params.chapterId), body));
});

export const updatePage = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(patchPageSchema, req);
  ok(res, await updatePageCommand(req, String(req.params.pageId), body));
});

export const deletePage = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await deletePageCommand(req, String(req.params.pageId)));
});
