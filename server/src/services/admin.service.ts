import bcrypt from "bcryptjs";
import {
  EarningModel,
  EarningItemModel,
  UserModel,
} from "../db/models.js";
import { AppError } from "../lib/http.js";
import { audit } from "./audit.service.js";
import { id } from "../domain/ids.js";
import type { AuthedRequest } from "../types.js";

const PROTECTED_FIELDS = ["passwordHash", "id", "createdAt", "updatedAt"];

export async function listUsers() {
  return UserModel.find({}).sort({ role: 1, name: 1 }).lean();
}

export async function getUser(userId: string) {
  return UserModel.findOne({ id: userId }).lean();
}

export function adminUser(user: any) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active !== false,
    isChair: Boolean(user.isChair),
    isEditorInChief: Boolean(user.isEditorInChief),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function createUser(req: AuthedRequest, body: Record<string, unknown>) {
  const email = String(body.email).toLowerCase().trim();
  const existing = await UserModel.findOne({ email }).lean();
  if (existing) throw new AppError(409, "Email is already in use.", "EMAIL_IN_USE");

  const password = String(body.password ?? email);
  const user = await UserModel.create({
    id: id("u"),
    name: body.name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: body.role,
    active: body.active ?? true,
    isChair: Boolean(body.isChair),
    isEditorInChief: Boolean(body.isEditorInChief),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await audit(req, "user.create", "user", (user as any).id, {
    role: body.role,
    active: body.active ?? true,
  });
  return user.toObject();
}

async function assertDoesNotRemoveCurrentAdmin(
  req: AuthedRequest,
  userId: string,
  patch: Record<string, unknown>,
) {
  if (req.actor?.id !== userId) return;
  const roleAfter = patch.role ?? req.actor.role;
  const activeAfter = patch.active;
  if (roleAfter !== "ADMIN" || activeAfter === false) {
    throw new AppError(
      400,
      "You cannot remove your own active admin access.",
      "SELF_ADMIN_LOCKOUT",
    );
  }
}

export async function updateUser(
  req: AuthedRequest,
  userId: string,
  patch: Record<string, unknown>,
) {
  const disallowed = Object.keys(patch).filter((key) => PROTECTED_FIELDS.includes(key));
  if (disallowed.length > 0) {
    throw new AppError(
      400,
      `Cannot overwrite protected fields: ${disallowed.join(", ")}`,
      "PROTECTED_FIELD",
    );
  }

  const existing = (await UserModel.findOne({ id: userId }).lean()) as any;
  if (!existing) {
    throw new AppError(404, "User not found.", "NOT_FOUND");
  }
  await assertDoesNotRemoveCurrentAdmin(req, userId, patch);

  const { reason, ...persistedPatch } = patch;
  const setFields: Record<string, unknown> = { ...persistedPatch };
  await UserModel.findOneAndUpdate(
    { id: userId },
    { $set: { ...setFields, updatedAt: new Date() } },
    { returnDocument: "after" },
  ).lean();

  if (persistedPatch.role !== undefined || persistedPatch.active !== undefined) {
    await audit(req, "user.update", "user", userId, {
      changedFields: Object.keys(persistedPatch),
      previousRole: existing.role,
      newRole: persistedPatch.role ?? existing.role,
      previousActive: existing.active,
      newActive: persistedPatch.active ?? existing.active,
      reason,
    });
  }

  return UserModel.findOne({ id: userId }).lean();
}

export async function deactivateUser(req: AuthedRequest, userId: string) {
  await assertDoesNotRemoveCurrentAdmin(req, userId, { active: false });
  return updateUser(req, userId, { active: false });
}

export async function deleteUser(req: AuthedRequest, userId: string) {
  await assertDoesNotRemoveCurrentAdmin(req, userId, { active: false });
  const existing = await UserModel.findOne({ id: userId }).lean();
  if (!existing) throw new AppError(404, "User not found.", "NOT_FOUND");
  await UserModel.findOneAndUpdate(
    { id: userId },
    { $set: { active: false, deletedAt: new Date(), updatedAt: new Date() } },
    { returnDocument: "after" },
  ).lean();
  await audit(req, "user.delete", "user", userId, {
    softDelete: true,
    previousRole: (existing as any).role,
  });
  return UserModel.findOne({ id: userId }).lean();
}

export async function listAssistantEarnings(assistantId: string) {
  const earnings = await EarningModel.find({ assistantId })
    .sort({ period: -1, updatedAt: -1 })
    .lean();
  const items = await EarningItemModel.find({ assistantId }).sort({ createdAt: -1 }).lean();
  // Attach each month's approved-task line items so the assistant can see what
  // makes up their monthly total (flowchart AD).
  return earnings.map((earning: any) => ({
    ...earning,
    items: items.filter((item: any) => item.earningId === earning.id),
  }));
}
