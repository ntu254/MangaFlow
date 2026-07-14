import { AppError } from "../../lib/http.js";
import type { RequestActor, Role } from "../../types.js";

export function assertRole(actor: RequestActor | undefined, roles: readonly Role[]) {
  if (!actor) {
    throw new AppError(401, "Authentication required", "AUTH_REQUIRED");
  }
  if (!roles.includes(actor.role)) {
    throw new AppError(403, "You are not allowed to perform this action", "FORBIDDEN");
  }
}

export function assertReadAllowed(condition: boolean, message = "Resource not found") {
  if (!condition) {
    throw new AppError(404, message, "NOT_FOUND");
  }
}

export function assertWriteAllowed(condition: boolean, message = "You are not allowed to perform this action") {
  if (!condition) {
    throw new AppError(403, message, "FORBIDDEN");
  }
}

export function assertStatus<TStatus extends string>(
  current: TStatus,
  allowed: readonly TStatus[],
  message = "Workflow status does not allow this action",
) {
  if (!allowed.includes(current)) {
    throw new AppError(409, message, "INVALID_WORKFLOW_STATUS");
  }
}

export function rejectLifecycleFieldPatch(payload: Record<string, unknown>, forbiddenFields: readonly string[]) {
  const attempted = forbiddenFields.filter((field) => Object.prototype.hasOwnProperty.call(payload, field));
  if (attempted.length > 0) {
    throw new AppError(
      400,
      `Use workflow commands instead of patching lifecycle fields: ${attempted.join(", ")}`,
      "WORKFLOW_COMMAND_REQUIRED",
    );
  }
}
