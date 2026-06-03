import { z } from "zod";
import bcrypt from "bcryptjs";
import { env } from "../../config/env.config.js";

export const systemRoleSchema = z.enum([
  "ADMIN",
  "MANGAKA",
  "ASSISTANT",
  "EDITOR",
  "BOARD"
]);

export const userStatusSchema = z.enum(["ACTIVE", "SUSPENDED"]);

export type SystemRole = z.infer<typeof systemRoleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  systemRole: SystemRole | null; // nullable for compatibility in tests
  status: UserStatus;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserRepository = {
  findById(id: string): Promise<AuthUser | null>;
  listUsersForRoleReview?(filters: { role?: "pending"; status?: UserStatus }): Promise<AuthUser[]>;
  assignSystemRole?(userId: string, role: SystemRole): Promise<AuthUser | null>;
  updateUserStatus?(userId: string, status: UserStatus): Promise<AuthUser | null>;

  // New email/password methods (optional for test mock compatibility)
  findByEmail?(email: string): Promise<AuthUser | null>;
  findByEmailWithPassword?(email: string): Promise<{ user: AuthUser; passwordHash: string } | null>;
  createUser?(input: {
    email: string;
    passwordHash: string;
    fullName: string;
    systemRole: SystemRole;
    status: UserStatus;
  }): Promise<AuthUser>;
  updateUser?(id: string, input: { fullName?: string; avatarUrl?: string | null }): Promise<AuthUser | null>;
  changePassword?(id: string, passwordHash: string): Promise<boolean>;
  listAllUsers?(): Promise<AuthUser[]>;
};

export class AuthServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

const roleRedirects: Record<SystemRole, string> = {
  ADMIN: "/app/admin/dashboard",
  MANGAKA: "/app/mangaka/dashboard",
  ASSISTANT: "/app/assistant/dashboard",
  EDITOR: "/app/editor/dashboard",
  BOARD: "/app/board/dashboard"
};

export function createAuthService(userRepository: UserRepository) {
  return {
    async getCurrentUser(id: string) {
      return userRepository.findById(id);
    },

    async authenticate(email: string, password: string): Promise<AuthUser> {
      if (!userRepository.findByEmailWithPassword) {
        throw new AuthServiceError("AUTH_FAILED", "Authentication repository error", 500);
      }
      const match = await userRepository.findByEmailWithPassword(email);
      if (!match) {
        throw new AuthServiceError("AUTH_FAILED", "Invalid email or password", 401);
      }

      const passwordMatch = await bcrypt.compare(password, match.passwordHash);
      if (!passwordMatch) {
        throw new AuthServiceError("AUTH_FAILED", "Invalid email or password", 401);
      }

      if (match.user.status === "SUSPENDED") {
        throw new AuthServiceError("ACCOUNT_SUSPENDED", "Your account has been suspended", 403);
      }

      return match.user;
    },

    async hashPassword(password: string): Promise<string> {
      return bcrypt.hash(password, env.bcryptSaltRounds);
    },

    getAuthRedirectState(user: Pick<AuthUser, "systemRole" | "status">) {
      if (user.status === "SUSPENDED") {
        return {
          blocked: true,
          redirectTo: "/app/blocked"
        };
      }

      if (!user.systemRole) {
        return {
          blocked: true,
          redirectTo: "/app/blocked"
        };
      }

      return {
        blocked: false,
        redirectTo: roleRedirects[user.systemRole]
      };
    }
  };
}
