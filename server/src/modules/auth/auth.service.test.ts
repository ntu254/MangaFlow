import { describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import {
  createAuthService,
  type AuthUser,
  type UserRepository
} from "./auth.service.js";

const now = "2026-06-03T00:00:00.000Z";

async function createHash(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

function createTestUser(id: string, email: string, systemRole: any, status: any = "ACTIVE"): AuthUser {
  return {
    id,
    email,
    fullName: `Test ${id}`,
    avatarUrl: null,
    systemRole,
    status,
    createdAt: now,
    updatedAt: now
  };
}

function createMemoryUserRepository(usersList: { user: AuthUser; passwordHash: string }[]): UserRepository {
  const users = new Map(usersList.map((item) => [item.user.id, item.user]));
  const withPassword = new Map(usersList.map((item) => [item.user.email, item]));

  return {
    async findById(id) {
      return users.get(id) ?? null;
    },
    async findByEmailWithPassword(email) {
      return withPassword.get(email) ?? null;
    }
  };
}

describe("auth service", () => {
  it("authenticates a user with correct credentials and rejects invalid ones", async () => {
    const passwordHash = await createHash("password123");
    const activeUser = createTestUser("user1", "user1@example.com", "MANGAKA", "ACTIVE");
    const suspendedUser = createTestUser("user2", "user2@example.com", "EDITOR", "SUSPENDED");

    const repo = createMemoryUserRepository([
      { user: activeUser, passwordHash },
      { user: suspendedUser, passwordHash }
    ]);
    const service = createAuthService(repo);

    // 1. Success authentication
    const auth1 = await service.authenticate("user1@example.com", "password123");
    expect(auth1.id).toBe("user1");
    expect(auth1.systemRole).toBe("MANGAKA");

    // 2. Invalid password
    await expect(service.authenticate("user1@example.com", "wrongpass")).rejects.toMatchObject({
      code: "AUTH_FAILED",
      statusCode: 401
    });

    // 3. Non-existent email
    await expect(service.authenticate("nonexistent@example.com", "password123")).rejects.toMatchObject({
      code: "AUTH_FAILED",
      statusCode: 401
    });

    // 4. Suspended account
    await expect(service.authenticate("user2@example.com", "password123")).rejects.toMatchObject({
      code: "ACCOUNT_SUSPENDED",
      statusCode: 403
    });
  });

  it("retrieves current user by ID", async () => {
    const activeUser = createTestUser("user1", "user1@example.com", "BOARD", "ACTIVE");
    const repo = createMemoryUserRepository([{ user: activeUser, passwordHash: "hash" }]);
    const service = createAuthService(repo);

    const user = await service.getCurrentUser("user1");
    expect(user).not.toBeNull();
    expect(user?.email).toBe("user1@example.com");

    const missing = await service.getCurrentUser("nonexistent");
    expect(missing).toBeNull();
  });

  it("maps user role and status to redirect state", () => {
    const repo = createMemoryUserRepository([]);
    const service = createAuthService(repo);

    // 1. Admin redirect
    expect(service.getAuthRedirectState({ systemRole: "ADMIN", status: "ACTIVE" })).toEqual({
      blocked: false,
      redirectTo: "/app/admin/dashboard"
    });

    // 2. Editor redirect
    expect(service.getAuthRedirectState({ systemRole: "EDITOR", status: "ACTIVE" })).toEqual({
      blocked: false,
      redirectTo: "/app/editor/dashboard"
    });

    // 3. Suspended user redirect
    expect(service.getAuthRedirectState({ systemRole: "MANGAKA", status: "SUSPENDED" })).toEqual({
      blocked: true,
      redirectTo: "/app/blocked"
    });

    // 4. No role redirect
    expect(service.getAuthRedirectState({ systemRole: null, status: "ACTIVE" })).toEqual({
      blocked: true,
      redirectTo: "/app/blocked"
    });
  });
});
