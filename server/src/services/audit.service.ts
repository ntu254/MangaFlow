import { AuditEntryModel, NotificationModel, UserModel } from "../db/models.js";
import { id } from "../domain/ids.js";
import type { AuthedRequest, RequestActor } from "../types.js";

export async function audit(
  req: AuthedRequest,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {}
) {
  const actor = req.actor ?? systemActor();
  await AuditEntryModel.create({
    id: id("aud"),
    actorId: actor.id,
    actorRole: actor.role,
    action,
    entityType,
    entityId,
    metadata,
    requestId: req.requestId,
    createdAt: new Date()
  });
}

export async function notify(
  userId: string,
  kind: string,
  message: string,
  title = kind.replace(/\./g, " ")
) {
  await NotificationModel.create({
    id: id("ntf"),
    userId,
    kind,
    title,
    message,
    createdAt: new Date()
  });
}

export async function notifyMany(items: { userId: string; kind: string; message: string; title?: string }[]) {
  if (items.length === 0) return;
  await NotificationModel.insertMany(
    items.map((item) => ({
      id: id("ntf"),
      userId: item.userId,
      kind: item.kind,
      title: item.title ?? item.kind.replace(/\./g, " "),
      message: item.message,
      createdAt: new Date()
    }))
  );
}

export type NotificationAudienceType = "USER" | "ROLE" | "ALL";
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH";

export async function broadcastNotification(opts: {
  audienceType: NotificationAudienceType;
  audienceRole?: string;
  targetUserId?: string;
  kind: string;
  title: string;
  message: string;
  priority?: NotificationPriority;
  actionUrl?: string;
  createdById?: string;
  createdByName?: string;
}): Promise<{ batchId: string; recipientCount: number }> {
  const batchId = id("ntfb");
  const now = new Date();
  const priority = opts.priority ?? "NORMAL";

  let recipientIds: string[] = [];

  if (opts.audienceType === "USER" && opts.targetUserId) {
    recipientIds = [opts.targetUserId];
  } else if (opts.audienceType === "ROLE" && opts.audienceRole) {
    const roleUpper = opts.audienceRole.toUpperCase();
    const users = await UserModel.find({ role: roleUpper, active: true }).select("id").lean();
    recipientIds = users.map((u: any) => String(u.id));
  } else if (opts.audienceType === "ALL") {
    const users = await UserModel.find({ active: true }).select("id").lean();
    recipientIds = users.map((u: any) => String(u.id));
  }

  if (recipientIds.length === 0) return { batchId, recipientCount: 0 };

  await NotificationModel.insertMany(
    recipientIds.map((userId) => ({
      id: id("ntf"),
      userId,
      kind: opts.kind,
      title: opts.title,
      message: opts.message,
      audienceType: opts.audienceType,
      audienceRole: opts.audienceRole,
      priority,
      actionUrl: opts.actionUrl,
      batchId,
      createdById: opts.createdById,
      createdByName: opts.createdByName,
      sentAt: now,
      createdAt: now,
    }))
  );

  return { batchId, recipientCount: recipientIds.length };
}

export function systemActor(): RequestActor {
  return {
    id: "system",
    name: "System",
    email: "system@mangaflow.local",
    role: "ADMIN"
  };
}
