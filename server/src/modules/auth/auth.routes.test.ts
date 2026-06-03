import request from "supertest";
import { describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { createApp } from "../../app.js";
import type { AuthVerifier } from "./auth.middleware.js";
import type { AuthUser, UserRepository } from "./auth.service.js";
import type { SessionRepository, SessionDocument } from "./session.repository.js";

const now = "2026-06-03T00:00:00.000Z";

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
    async findByEmail(email) {
      return withPassword.get(email)?.user ?? null;
    },
    async findByEmailWithPassword(email) {
      return withPassword.get(email) ?? null;
    }
  };
}

function createMemorySessionRepository(): SessionRepository {
  const sessions = new Map<string, SessionDocument>();
  let nextId = 1;

  return {
    async createSession(userId, expiresAt) {
      const id = String(nextId++);
      const session = {
        _id: id,
        userId: userId as any,
        expiresAt,
        createdAt: new Date()
      };
      sessions.set(id, session);
      return session;
    },
    async findValidSession(id) {
      const session = sessions.get(id);
      if (!session || session.revokedAt) return null;
      if (session.expiresAt < new Date()) return null;
      return session;
    },
    async revokeSession(id) {
      const session = sessions.get(id);
      if (session) {
        session.revokedAt = new Date();
      }
    },
    async revokeAllForUser(userId) {
      for (const session of sessions.values()) {
        if (String(session.userId) === userId) {
          session.revokedAt = new Date();
        }
      }
    }
  };
}

const mockUser = createTestUser("user1", "user1@example.com", "MANGAKA", "ACTIVE");
const validVerifier: AuthVerifier = {
  async verify() {
    return {
      sub: mockUser.id,
      systemRole: mockUser.systemRole,
      status: mockUser.status,
      email: mockUser.email,
      fullName: mockUser.fullName,
      avatarUrl: mockUser.avatarUrl
    };
  },
  async verifyWithProfile() {
    return {
      sub: mockUser.id,
      email: mockUser.email,
      fullName: mockUser.fullName,
      avatarUrl: mockUser.avatarUrl
    };
  }
};

describe("auth routes", () => {
  it("returns 401 when token is missing", async () => {
    const repo = createMemoryUserRepository([]);
    const app = createApp({
      authVerifier: validVerifier,
      userRepository: repo,
      sessionRepository: createMemorySessionRepository()
    });

    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      code: "AUTH_REQUIRED"
    });
  });

  it("returns 401 when token is invalid", async () => {
    const repo = createMemoryUserRepository([]);
    const app = createApp({
      authVerifier: {
        async verify() {
          return null;
        },
        async verifyWithProfile() {
          return null;
        }
      },
      userRepository: repo,
      sessionRepository: createMemorySessionRepository()
    });

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      code: "AUTH_INVALID"
    });
  });

  it("returns 200 and the current user profile on GET /auth/me", async () => {
    const repo = createMemoryUserRepository([{ user: mockUser, passwordHash: "hash" }]);
    const app = createApp({
      authVerifier: validVerifier,
      userRepository: repo,
      sessionRepository: createMemorySessionRepository()
    });

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer valid");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        user: {
          id: mockUser.id,
          email: mockUser.email,
          systemRole: "MANGAKA"
        },
        auth: {
          blocked: false,
          redirectTo: "/app/mangaka/dashboard"
        }
      }
    });
  });

  it("authenticates credentials on POST /auth/login", async () => {
    const passwordHash = await bcrypt.hash("password123", 10);
    const repo = createMemoryUserRepository([{ user: mockUser, passwordHash }]);
    const app = createApp({
      authVerifier: validVerifier,
      userRepository: repo,
      sessionRepository: createMemorySessionRepository()
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "user1@example.com", password: "password123" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("token");
    expect(response.body.data.user).toMatchObject({
      id: mockUser.id,
      email: mockUser.email
    });
  });

  it("returns 401 on wrong login credentials", async () => {
    const passwordHash = await bcrypt.hash("password123", 10);
    const repo = createMemoryUserRepository([{ user: mockUser, passwordHash }]);
    const app = createApp({
      authVerifier: validVerifier,
      userRepository: repo,
      sessionRepository: createMemorySessionRepository()
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "user1@example.com", password: "wrong_password" });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      code: "AUTH_FAILED"
    });
  });

  it("logs out successfully on POST /auth/logout", async () => {
    const repo = createMemoryUserRepository([]);
    const app = createApp({
      authVerifier: validVerifier,
      userRepository: repo,
      sessionRepository: createMemorySessionRepository()
    });

    const response = await request(app).post("/api/auth/logout");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
