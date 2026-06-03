import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import type { AuthVerifier } from "../auth/auth.middleware.js";
import type { AuthUser, SystemRole, UserRepository, UserStatus } from "../auth/auth.service.js";

function createUser(
  id: string,
  systemRole: SystemRole | null,
  status: UserStatus
): AuthUser {
  const now = "2026-06-02T00:00:00.000Z";

  return {
    id,
    email: `${id}@example.com`,
    fullName: id,
    avatarUrl: null,
    systemRole,
    status,
    createdAt: now,
    updatedAt: now
  };
}

function createRepository(seed: AuthUser[]): UserRepository {
  const users = new Map(seed.map((user) => [user.id, user]));

  return {
    async findById(id) {
      return users.get(id) ?? null;
    },
    async listUsersForRoleReview(filters) {
      return [...users.values()].filter((user) => {
        if (filters.role === "pending" && user.systemRole !== null) {
          return false;
        }
        if (filters.status && user.status !== filters.status) {
          return false;
        }
        return true;
      });
    },
    async assignSystemRole(userId, role) {
      const user = users.get(userId);
      if (!user) {
        return null;
      }
      const updated = { ...user, systemRole: role };
      users.set(userId, updated);
      return updated;
    },
    async updateUserStatus(userId, status) {
      const user = users.get(userId);
      if (!user) {
        return null;
      }
      const updated = { ...user, status };
      users.set(userId, updated);
      return updated;
    }
  };
}

function createVerifier(id: string, systemRole: SystemRole | null = null, status: UserStatus = "ACTIVE"): AuthVerifier {
  return {
    async verify() {
      return {
        sub: id,
        systemRole,
        status
      };
    },
    async verifyWithProfile() {
      return { sub: id, email: `${id}@example.com`, fullName: id, avatarUrl: null };
    }
  };
}

const admin = createUser("admin_001", "ADMIN", "ACTIVE");
const assistant = createUser("assistant_001", "ASSISTANT", "ACTIVE");
const pending = createUser("pending_001", null, "ACTIVE");

describe("admin role assignment routes", () => {
  it("returns 403 for non-admin callers", async () => {
    const app = createApp({
      authVerifier: createVerifier(assistant.id, "ASSISTANT"),
      userRepository: createRepository([admin, assistant, pending])
    });

    const response = await request(app)
      .get("/api/admin/users?role=pending")
      .set("Authorization", "Bearer valid");

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      success: false,
      code: "ADMIN_REQUIRED"
    });
  });

  it("lets admins list pending users", async () => {
    const app = createApp({
      authVerifier: createVerifier(admin.id, "ADMIN"),
      userRepository: createRepository([admin, assistant, pending])
    });

    const response = await request(app)
      .get("/api/admin/users?role=pending&status=ACTIVE")
      .set("Authorization", "Bearer valid");

    expect(response.status).toBe(200);
    expect(response.body.data.users).toHaveLength(1);
    expect(response.body.data.users[0]).toMatchObject({
      id: pending.id
    });
  });

  it("lets admins assign roles", async () => {
    const app = createApp({
      authVerifier: createVerifier(admin.id, "ADMIN"),
      userRepository: createRepository([admin, pending])
    });

    const response = await request(app)
      .patch(`/api/admin/users/${pending.id}/role`)
      .set("Authorization", "Bearer valid")
      .send({ systemRole: "MANGAKA" });

    expect(response.status).toBe(200);
    expect(response.body.data.user).toMatchObject({
      id: pending.id,
      systemRole: "MANGAKA"
    });
  });

  it("lets admins suspend users", async () => {
    const app = createApp({
      authVerifier: createVerifier(admin.id, "ADMIN"),
      userRepository: createRepository([admin, assistant])
    });

    const response = await request(app)
      .patch(`/api/admin/users/${assistant.id}/status`)
      .set("Authorization", "Bearer valid")
      .send({ status: "SUSPENDED" });

    expect(response.status).toBe(200);
    expect(response.body.data.user.status).toBe("SUSPENDED");
  });

  it("rejects invalid role input", async () => {
    const app = createApp({
      authVerifier: createVerifier(admin.id, "ADMIN"),
      userRepository: createRepository([admin, pending])
    });

    const response = await request(app)
      .patch(`/api/admin/users/${pending.id}/role`)
      .set("Authorization", "Bearer valid")
      .send({ systemRole: "OWNER" });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_ROLE");
  });
});


