import { asyncRoute, ok } from "../lib/http.js";
import type { AuthedRequest } from "../types.js";
import * as adminService from "../services/admin.service.js";

export const listAssistantEarnings = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = req.actor!;
  const assistantId =
    actor.role === "ADMIN" && typeof req.query.assistantId === "string"
      ? req.query.assistantId
      : actor.id;
  const earnings = await adminService.listAssistantEarnings(assistantId);
  ok(res, earnings);
});
