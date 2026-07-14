import { asyncRoute, ok } from "../../../lib/http.js";
import type { AuthedRequest } from "../../../types.js";
import { listAssistantEarnings } from "../application/earning.service.js";

export const getMyEarnings = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = req.actor!;
  ok(res, await listAssistantEarnings(actor.id));
});
