import {
  systemRoleSchema,
  userStatusSchema,
  type AuthUser,
  type UserRepository,
  type UserStatus
} from "../auth/auth.service.js";

export class AdminRoleAssignmentError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

function assertRepositoryMethod<T>(
  method: T | undefined,
  name: string
): asserts method is T {
  if (!method) {
    throw new AdminRoleAssignmentError(
      "ADMIN_REPOSITORY_UNAVAILABLE",
      `${name} is not available`,
      500
    );
  }
}

function assertActiveAdmin(actor: AuthUser) {
  if (actor.status !== "ACTIVE" || actor.systemRole !== "ADMIN") {
    throw new AdminRoleAssignmentError(
      "ADMIN_REQUIRED",
      "Admin role is required",
      403
    );
  }
}

export function createRoleAssignmentService(userRepository: UserRepository) {
  return {
    async listUsersForRoleReview(
      actor: AuthUser,
      filters: { role?: "pending"; status?: UserStatus }
    ) {
      assertActiveAdmin(actor);
      assertRepositoryMethod(
        userRepository.listUsersForRoleReview,
        "listUsersForRoleReview"
      );

      return userRepository.listUsersForRoleReview(filters);
    },

    async assignSystemRole(actor: AuthUser, targetUserId: string, role: string) {
      assertActiveAdmin(actor);

      const parsed = systemRoleSchema.safeParse(role);
      if (!parsed.success) {
        throw new AdminRoleAssignmentError("INVALID_ROLE", "Invalid role", 400);
      }

      if (actor.id === targetUserId) {
        throw new AdminRoleAssignmentError(
          "SELF_ROLE_ASSIGNMENT_FORBIDDEN",
          "Users cannot assign their own role",
          403
        );
      }

      assertRepositoryMethod(userRepository.assignSystemRole, "assignSystemRole");
      const updated = await userRepository.assignSystemRole(
        targetUserId,
        parsed.data
      );

      if (!updated) {
        throw new AdminRoleAssignmentError(
          "USER_NOT_FOUND",
          "User not found",
          404
        );
      }

      return updated;
    },

    async updateUserStatus(
      actor: AuthUser,
      targetUserId: string,
      status: string
    ) {
      assertActiveAdmin(actor);

      const parsed = userStatusSchema.safeParse(status);
      if (!parsed.success) {
        throw new AdminRoleAssignmentError(
          "INVALID_STATUS",
          "Invalid status",
          400
        );
      }

      assertRepositoryMethod(userRepository.updateUserStatus, "updateUserStatus");
      const updated = await userRepository.updateUserStatus(
        targetUserId,
        parsed.data
      );

      if (!updated) {
        throw new AdminRoleAssignmentError(
          "USER_NOT_FOUND",
          "User not found",
          404
        );
      }

      return updated;
    }
  };
}

