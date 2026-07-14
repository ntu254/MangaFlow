import bcrypt from "bcryptjs";
import { AppError } from "../../../lib/http.js";
import { id } from "../../../domain/ids.js";
import type { AuthedRequest } from "../../../types.js";
import { audit } from "../../../services/audit.service.js";
import {
  createUserRecord,
  findUserRecordByEmail,
  findUserRecordById,
  listUserRecords,
  patchUserRecord,
} from "../infrastructure/user.repository.js";
import { toAdminUserView } from "../domain/user.presenter.js";

const PROTECTED_FIELDS = ["passwordHash", "id", "createdAt", "updatedAt"];

export type CreateUserInput = {
  name: string;
  email: string;
  password?: string;
  role: "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD";
  active?: boolean;
  isChair?: boolean;
  isEditorInChief?: boolean;
};

export type UpdateUserInput = Partial<Omit<CreateUserInput, "password">> & {
  reason?: string;
};

export async function listUsers() {
  const users = await listUserRecords();
  return users.map(toAdminUserView);
}

export async function getUser(userId: string) {
  const user = await findUserRecordById(userId);
  if (!user) throw new AppError(404, "User not found.", "NOT_FOUND");
  return toAdminUserView(user);
}

export async function createUser(req: AuthedRequest, body: CreateUserInput) {
  const email = body.email.toLowerCase().trim();
  const existing = await findUserRecordByEmail(email);
  if (existing) throw new AppError(409, "Email is already in use.", "EMAIL_IN_USE");

  const password = body.password ?? email;
  const user = await createUserRecord({
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

  return toAdminUserView(user.toObject());
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

export async function updateUser(req: AuthedRequest, userId: string, patch: UpdateUserInput) {
  const disallowed = Object.keys(patch).filter((key) => PROTECTED_FIELDS.includes(key));
  if (disallowed.length > 0) {
    throw new AppError(
      400,
      `Cannot overwrite protected fields: ${disallowed.join(", ")}`,
      "PROTECTED_FIELD",
    );
  }

  const existing = await findUserRecordById(userId);
  if (!existing) throw new AppError(404, "User not found.", "NOT_FOUND");

  await assertDoesNotRemoveCurrentAdmin(req, userId, patch);

  const { reason, ...persistedPatch } = patch;
  await patchUserRecord(userId, persistedPatch);

  if (persistedPatch.role !== undefined || persistedPatch.active !== undefined) {
    await audit(req, "user.update", "user", userId, {
      changedFields: Object.keys(persistedPatch),
      previousRole: (existing as any).role,
      newRole: persistedPatch.role ?? (existing as any).role,
      previousActive: (existing as any).active,
      newActive: persistedPatch.active ?? (existing as any).active,
      reason,
    });
  }

  return getUser(userId);
}

export async function deactivateUser(req: AuthedRequest, userId: string) {
  await assertDoesNotRemoveCurrentAdmin(req, userId, { active: false });
  return updateUser(req, userId, { active: false });
}

export async function deleteUser(req: AuthedRequest, userId: string) {
  await assertDoesNotRemoveCurrentAdmin(req, userId, { active: false });
  const existing = await findUserRecordById(userId);
  if (!existing) throw new AppError(404, "User not found.", "NOT_FOUND");

  await patchUserRecord(userId, {
    active: false,
    deletedAt: new Date(),
  });

  await audit(req, "user.delete", "user", userId, {
    softDelete: true,
    previousRole: (existing as any).role,
  });

  return getUser(userId);
}
