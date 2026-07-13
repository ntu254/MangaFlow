import { asyncRoute, ok } from "../../../lib/http.js";
import { parseBody } from "../../../validators/common.js";
import type { AuthedRequest } from "../../../types.js";
import {
  postponeChapterPublication,
  publishChapter,
  scheduleChapterPublication,
} from "../application/publication.service.js";
import { publicationNoteSchema, schedulePublicationSchema } from "./publication.schemas.js";

export const schedulePublication = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(schedulePublicationSchema, req);
  ok(res, await scheduleChapterPublication(req, String(req.params.chapterId), body));
});

export const postponePublication = asyncRoute(async (req: AuthedRequest, res) => {
  const body = req.body ? parseBody(publicationNoteSchema, req) : {};
  ok(res, await postponeChapterPublication(req, String(req.params.chapterId), body));
});

export const publishPublication = asyncRoute(async (req: AuthedRequest, res) => {
  const body = req.body ? parseBody(publicationNoteSchema, req) : {};
  ok(res, await publishChapter(req, String(req.params.chapterId), body));
});
