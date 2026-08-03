import { AppError, asyncRoute, ok } from "../lib/http.js";
import { requireActor } from "./helpers.js";
import { listReviewFiles } from "../services/review-file.service.js";
import type { AuthedRequest } from "../types.js";

export const listReviewFilesController = asyncRoute(async (req: AuthedRequest, res) => {
  const context = String(req.params.context ?? "");
  if (context !== "proposal" && context !== "chapter") {
    throw new AppError(404, "Review context not found.", "NOT_FOUND");
  }
  ok(res, await listReviewFiles(requireActor(req), { context, id: String(req.params.id ?? "") }));
});
