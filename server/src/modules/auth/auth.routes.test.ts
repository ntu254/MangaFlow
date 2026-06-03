import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import type { AuthVerifier } from "./auth.middleware.js";
import type { UserRepository } from "./auth.service.js";

function createRepository(): UserRepository {
  const users = new Map<string, Awaited<ReturnType<UserRepository["upsertFromProfile"]>>>();

  return {
    async findByClerkId(clerkId) {
      return users.get(clerkId) ?? null;
    },
    async upsertFromProfile(profile) {
      const now = new Date("2026-06-02T00:00:00.000Z").toISOString();
      const existing = users.get(profile.clerkId);
      const user = {
        id: existing?.id ?? `user_${profile.clerkId}`,
        clerkId: profile.clerkId,
        email: profile.email,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        systemRole: existing?.systemRole ?? null,
        requestedSystemRole: existing?.requestedSystemRole ?? null,
        status: existing?.status ?? "ACTIVE",
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      } as const;
      users.set(profile.clerkId, user);
      return user;
    },
    async updateOnboarding(clerkId, input) {
      const existing = users.get(clerkId);
      if (!existing) {
        return null;
      }
      const updated = {
        ...existing,
        ...input,
        requestedSystemRole: input.requestedSystemRole ?? existing.requestedSystemRole,
        systemRole: existing.systemRole,
        updatedAt: new Date("2026-06-02T00:00:00.000Z").toISOString()
      };
      users.set(clerkId, updated);
      return updated;
    }
  };
}

const validVerifier: AuthVerifier = {
  async verify() {
    return {
      clerkId: "clerk_pending_001",
      systemRole: null,
      status: "ACTIVE"
    };
  },
  async verifyWithProfile() {
    return {
      clerkId: "clerk_pending_001",
      email: "pending@example.com",
      fullName: "Pending User",
      avatarUrl: "https://img.example.com/avatar.png"
    };
  }
};

describe("auth routes", () => {
  it("returns 401 when token is missing", async () => {
    const app = createApp({ authVerifier: validVerifier, userRepository: createRepository() });

    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      code: "AUTH_REQUIRED"
    });
  });

  it("returns 401 when token is invalid", async () => {
    const app = createApp({
      authVerifier: {
        async verify() {
          return null;
        },
        async verifyWithProfile() {
          return null;
        }
      },
      userRepository: createRepository()
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

  it("syncs and returns current user through the standard envelope", async () => {
    const app = createApp({ authVerifier: validVerifier, userRepository: createRepository() });

    const response = await request(app)
      .post("/api/auth/sync-user")
      .set("Authorization", "Bearer valid");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        user: {
          clerkId: "clerk_pending_001",
          systemRole: null,
          status: "ACTIVE"
        },
        auth: {
          onboardingRequired: true,
          redirectTo: "/app/onboarding"
        }
      }
    });
  });
});

