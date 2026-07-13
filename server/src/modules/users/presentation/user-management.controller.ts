import { asyncRoute, created, ok } from "../../../lib/http.js";
import type { AuthedRequest } from "../../../types.js";
import {
  createUser as createUserCommand,
  deactivateUser as deactivateUserCommand,
  deleteUser as deleteUserCommand,
  getUser as getUserQuery,
  listUsers as listUsersQuery,
  updateUser as updateUserCommand,
} from "../application/user-management.service.js";
import { createUserSchema, updateUserSchema } from "./user-management.schemas.js";

export const listUsers = asyncRoute(async (_req: AuthedRequest, res) => {
  ok(res, await listUsersQuery());
});

export const getUser = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await getUserQuery(String(req.params.userId)));
});

export const createUser = asyncRoute(async (req: AuthedRequest, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "Invalid user payload.",
      code: "VALIDATION_ERROR",
      errors: parsed.error.flatten(),
    });
  }

  created(res, await createUserCommand(req, parsed.data));
});

export const updateUser = asyncRoute(async (req: AuthedRequest, res) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "Invalid user update payload.",
      code: "VALIDATION_ERROR",
      errors: parsed.error.flatten(),
    });
  }

  ok(res, await updateUserCommand(req, String(req.params.userId), parsed.data));
});

export const deactivateUser = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await deactivateUserCommand(req, String(req.params.userId)));
});

export const deleteUser = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await deleteUserCommand(req, String(req.params.userId)));
});
