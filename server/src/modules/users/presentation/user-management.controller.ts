import { asyncRoute, created, ok } from "../../../lib/http.js";
import {
  buildPagination,
  parseListQuery,
} from "../../../shared/contracts/list-contract.js";
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

const USER_LIST_CONFIG = {
  searchable: ["name", "email"] as const,
  sortable: ["name", "email", "role", "active", "createdAt", "updatedAt"] as const,
  filterable: {
    name: "text",
    email: "text",
    role: "select",
    active: "boolean",
    isChair: "boolean",
    isEditorInChief: "boolean",
  } as const,
  defaultSort: { field: "createdAt", dir: "desc" } as const,
  maxPageSize: 100,
};

export const listUsers = asyncRoute(async (req: AuthedRequest, res) => {
  const query = parseListQuery(req, USER_LIST_CONFIG);
  const result = await listUsersQuery(query);
  return res.json({
    success: true,
    data: result.data,
    pagination: buildPagination(query, result.total),
    meta: {
      q: query.q,
      sort: query.sort,
      filters: query.filters,
      summary: result.summary,
    },
  });
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
