import { describe, expect, it } from "vitest";
import {
  createAuthService,
  type ClerkUserProfile,
  type UserRepository
} from "./auth.service.js";

function createMemoryUserRepository(): UserRepository {
  const users = new Map<string, Awaited<ReturnType<UserRepository["upsertFromClerk"]>>>();

  return {
    async findByClerkId(clerkId) {
      return users.get(clerkId) ?? null;
    },
    async upsertFromClerk(profile) {
      const existing = users.get(profile.clerkId);
      const now = new Date("2026-06-02T00:00:00.000Z").toISOString();
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

const clerkProfile: ClerkUserProfile = {
  clerkId: "clerk_pending_001",
  email: "pending@example.com",
  fullName: "Pending User",
  avatarUrl: "https://img.example.com/avatar.png"
};

describe("auth service", () => {
  it("syncs Clerk profile into a pending internal user idempotently", async () => {
    const service = createAuthService(createMemoryUserRepository());

    const first = await service.syncUserFromClerk(clerkProfile);
    const second = await service.syncUserFromClerk({
      ...clerkProfile,
      fullName: "Updated User"
    });

    expect(first.systemRole).toBeNull();
    expect(second.id).toBe(first.id);
    expect(second.fullName).toBe("Updated User");
  });

  it("maps user role and status to redirect state", () => {
    const service = createAuthService(createMemoryUserRepository());

    expect(service.getAuthRedirectState({ systemRole: null, status: "ACTIVE" })).toEqual({
      onboardingRequired: true,
      blocked: false,
      redirectTo: "/app/onboarding"
    });
    expect(service.getAuthRedirectState({ systemRole: "EDITOR", status: "ACTIVE" })).toEqual({
      onboardingRequired: false,
      blocked: false,
      redirectTo: "/app/editor/dashboard"
    });
    expect(service.getAuthRedirectState({ systemRole: "MANGAKA", status: "SUSPENDED" })).toEqual({
      onboardingRequired: false,
      blocked: true,
      redirectTo: "/app/blocked"
    });
  });

  it("lets onboarding request a non-privileged role without assigning systemRole", async () => {
    const service = createAuthService(createMemoryUserRepository());
    await service.syncUserFromClerk(clerkProfile);

    const user = await service.completeOnboarding("clerk_pending_001", {
      fullName: "Pending Mangaka",
      requestedSystemRole: "MANGAKA"
    });

    expect(user.requestedSystemRole).toBe("MANGAKA");
    expect(user.systemRole).toBeNull();
  });

  it("rejects privileged role requests during onboarding", async () => {
    const service = createAuthService(createMemoryUserRepository());
    await service.syncUserFromClerk(clerkProfile);

    await expect(
      service.completeOnboarding("clerk_pending_001", {
        requestedSystemRole: "ADMIN"
      })
    ).rejects.toMatchObject({
      code: "ONBOARDING_ROLE_FORBIDDEN"
    });
  });
});
