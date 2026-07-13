import { AppError, asyncRoute, created, ok } from "../lib/http.js";
import type { AuthedRequest } from "../types.js";
import * as adminService from "../services/admin.service.js";
import { audit } from "../services/audit.service.js";
import { clearDemoDatabase, reseedDemoDatabase } from "../seed.js";
import { env } from "../config/env.js";
import {
  adminNotificationSchema,
  patchAdminNotificationSchema,
} from "../validators/admin.schema.js";

export const listAudit = asyncRoute(async (req: AuthedRequest, res) => {
  const filters = {
    action: typeof req.query.action === "string" ? req.query.action : undefined,
    actorId: typeof req.query.actorId === "string" ? req.query.actorId : undefined,
  };
  const entries = await adminService.listAuditEntries(filters);
  ok(res, entries);
});

export const listManagedNotifications = asyncRoute(async (req: AuthedRequest, res) => {
  const filters = {
    targetRole: typeof req.query.targetRole === "string" ? req.query.targetRole : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
    type: typeof req.query.type === "string" ? req.query.type : undefined,
  };
  ok(res, await adminService.listManagedNotifications(filters));
});

export const createManagedNotification = asyncRoute(async (req: AuthedRequest, res) => {
  const parsed = adminNotificationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      data: null,
      message: parsed.error.issues.map((i) => i.message).join("; "),
      code: "VALIDATION_ERROR",
    });
  }
  created(res, await adminService.createManagedNotification(req, parsed.data));
});

export const patchManagedNotification = asyncRoute(async (req: AuthedRequest, res) => {
  const parsed = patchAdminNotificationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      data: null,
      message: parsed.error.issues.map((i) => i.message).join("; "),
      code: "VALIDATION_ERROR",
    });
  }
  ok(
    res,
    await adminService.patchManagedNotification(
      req,
      String(req.params.notificationId),
      parsed.data,
    ),
  );
});

export const deleteManagedNotification = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await adminService.deleteManagedNotification(req, String(req.params.notificationId)));
});

export const listPayroll = asyncRoute(async (_req: AuthedRequest, res) => {
  const earnings = await adminService.listEarnings();
  ok(res, earnings);
});

export const listAssistantEarnings = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = req.actor!;
  const assistantId =
    actor.role === "ADMIN" && typeof req.query.assistantId === "string"
      ? req.query.assistantId
      : actor.id;
  const earnings = await adminService.listAssistantEarnings(assistantId);
  ok(res, earnings);
});

export const workflowSummary = asyncRoute(async (_req: AuthedRequest, res) => {
  ok(res, await adminService.workflowSummary());
});

export const storageSummary = asyncRoute(async (_req: AuthedRequest, res) => {
  ok(res, await adminService.storageSummary());
});

function assertDemoToolAllowed() {
  if (env.NODE_ENV === "production") {
    throw new AppError(
      403,
      "Demo reset/clear endpoints are disabled in production.",
      "DEMO_TOOL_FORBIDDEN",
    );
  }
}

// Demo tooling: reset / clear all transactional data while keeping user accounts.
export const resetDemoData = asyncRoute(async (req: AuthedRequest, res) => {
  assertDemoToolAllowed();
  const result = await reseedDemoDatabase();
  await audit(req, "admin.demo_reset", "system", "demo", result);
  ok(res, result);
});

export const clearDemoData = asyncRoute(async (req: AuthedRequest, res) => {
  assertDemoToolAllowed();
  const result = await clearDemoDatabase();
  await audit(req, "admin.demo_clear", "system", "demo", result);
  ok(res, result);
});
