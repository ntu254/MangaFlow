import { describe, expect, it } from "vitest";
import {
  AdminRoleAssignmentError,
  createRoleAssignmentService
} from "./role-assignment.service.js";
import type { AuthUser, SystemRole, UserRepository, UserStatus } from "../auth/auth.service.js";

type SeedUser = Pick<
  AuthUser,
  "clerkId" | "email" | "fullName" | "systemRole" | "requestedSystemRole" | "status"
>;

function createUser(overrides: SeedUser): AuthUser {
  const now = "2026-06-02T00:00:00.000Z";

  return {
    id: `user_${overrides.clerkId}`,
    clerkId: overrides.clerkId,
    email: overrides.email,
    fullName: overrides.fullName,
    avatarUrl: null,
    systemRole: overrides.systemRole,
    requestedSystemRole: overrides.requestedSystemRole,
    status: overrides.status,
    createdAt: now,
    updatedAt: now
  };
}

function createRoleRepository(seed: AuthUser[]): UserRepository {
  const users = new Map(seed.map((user) => [user.id, user]));
  const byClerkId = new Map(seed.map((user) => [user.clerkId, user.id]));

  return {
    async findByClerkId(clerkId) {
      const id = byClerkId.get(clerkId);
      return id ? users.get(id) ?? null : null;
    },
    async upsertFromClerk() {
      throw new Error("not needed in role assignment tests");
    },
    async updateOnboarding() {
      throw new Error("not needed in role assignment tests");
    },
    async listUsersForRoleReview(filters) {
      const records = [...users.values()];

      return records.filter((user) => {
        if (filters.role === "pending" && user.systemRole !== null) {
          return false;
        }
        if (filters.status && user.status !== filters.status) {
          return false;
        }
        return true;
      });
    },
    async findById(id) {
      return users.get(id) ?? null;
    },
    async assignSystemRole(userId, role: SystemRole) {
      const existing = users.get(userId);
      if (!existing) {
        return null;
      }
      const updated = {
        ...existing,
        systemRole: role,
        requestedSystemRole: null,
        updatedAt: "2026-06-02T00:00:00.000Z"
      };
      users.set(userId, updated);
      return updated;
    },
    async updateUserStatus(userId, status: UserStatus) {
      const existing = users.get(userId);
      if (!existing) {
        return null;
      }
      const updated = {
        ...existing,
        status,
        updatedAt: "2026-06-02T00:00:00.000Z"
      };
      users.set(userId, updated);
      return updated;
    }
  };
}

const admin = createUser({
  clerkId: "clerk_admin_001",
  email: "admin@example.com",
  fullName: "Admin",
  systemRole: "ADMIN",
  requestedSystemRole: null,
  status: "ACTIVE"
});

const assistant = createUser({
  clerkId: "clerk_assistant_001",
  email: "assistant@example.com",
  fullName: "Assistant",
  systemRole: "ASSISTANT",
  requestedSystemRole: null,
  status: "ACTIVE"
});

const pending = createUser({
  clerkId: "clerk_pending_001",
  email: "pending@example.com",
  fullName: "Pending",
  systemRole: null,
  requestedSystemRole: "MANGAKA",
  status: "ACTIVE"
});

describe("role assignment service", () => {
  it("rejects non-admin role assignment", async () => {
    const service = createRoleAssignmentService(createRoleRepository([admin, assistant, pending]));

    await expect(
      service.assignSystemRole(assistant, pending.id, "MANGAKA")
    ).rejects.toBeInstanceOf(AdminRoleAssignmentError);
  });

  it("lists pending users for active admins", async () => {
    const service = createRoleAssignmentService(createRoleRepository([admin, assistant, pending]));

    const users = await service.listUsersForRoleReview(admin, {
      role: "pending",
      status: "ACTIVE"
    });

    expect(users).toHaveLength(1);
    expect(users[0]?.clerkId).toBe("clerk_pending_001");
  });

  it("assigns a system role and clears the requested role", async () => {
    const service = createRoleAssignmentService(createRoleRepository([admin, pending]));

    const updated = await service.assignSystemRole(admin, pending.id, "MANGAKA");

    expect(updated.systemRole).toBe("MANGAKA");
    expect(updated.requestedSystemRole).toBeNull();
  });

  it("suspends and reactivates users", async () => {
    const service = createRoleAssignmentService(createRoleRepository([admin, assistant]));

    const suspended = await service.updateUserStatus(admin, assistant.id, "SUSPENDED");
    const active = await service.updateUserStatus(admin, assistant.id, "ACTIVE");

    expect(suspended.status).toBe("SUSPENDED");
    expect(active.status).toBe("ACTIVE");
  });

  it("rejects invalid role input", async () => {
    const service = createRoleAssignmentService(createRoleRepository([admin, pending]));

    await expect(
      service.assignSystemRole(admin, pending.id, "OWNER" as SystemRole)
    ).rejects.toMatchObject({
      code: "INVALID_ROLE"
    });
  });
});

