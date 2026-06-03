import type { NextFunction, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedRequest } from "./auth.middleware.js";
import { requireSeriesRole, requireSystemRole, type RoleAuthorizedRequest } from "./rbac.middleware.js";
import type { AuthUser, UserRepository } from "./auth.service.js";
import type { SeriesRepository } from "../series/series.service.js";

const now = "2026-06-03T00:00:00.000Z";

function createUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: overrides.id ?? "user_mangaka",
    clerkId: overrides.clerkId ?? "clerk_mangaka",
    email: overrides.email ?? "mangaka@example.com",
    fullName: overrides.fullName ?? "Mangaka",
    avatarUrl: overrides.avatarUrl ?? null,
    systemRole: overrides.systemRole ?? "MANGAKA",
    requestedSystemRole: overrides.requestedSystemRole ?? null,
    status: overrides.status ?? "ACTIVE",
    createdAt: now,
    updatedAt: now
  };
}

function createUserRepository(user: AuthUser | null): UserRepository {
  return {
    async findByClerkId(clerkId) {
      return user?.clerkId === clerkId ? user : null;
    },
    async upsertFromProfile() {
      throw new Error("not needed in RBAC tests");
    },
    async updateOnboarding() {
      throw new Error("not needed in RBAC tests");
    }
  };
}

function createSeriesRepository(role: string | null): SeriesRepository {
  return {
    async createSeries() {
      throw new Error("not needed in RBAC tests");
    },
    async findSeriesById() {
      return null;
    },
    async findSeriesBySlug() {
      return null;
    },
    async listSeriesForUser() {
      return [];
    },
    async updateSeries() {
      return null;
    },
    async deleteSeries() {
      return false;
    },
    async getSeriesMemberRole() {
      return role;
    }
  };
}

function createResponse() {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
  };
  return response as unknown as Response & typeof response;
}

describe("RBAC middleware", () => {
  it("binds localUser for allowed active system roles", async () => {
    const user = createUser({ systemRole: "MANGAKA" });
    const req = {
      auth: { clerkId: user.clerkId, systemRole: user.systemRole, status: user.status }
    } as AuthenticatedRequest;
    const res = createResponse();
    const next: NextFunction = vi.fn();

    await requireSystemRole(["MANGAKA"], createUserRepository(user))(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect((req as RoleAuthorizedRequest).localUser).toEqual(user);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects missing auth, unsynced users, suspended users, and wrong roles", async () => {
    const noAuthRes = createResponse();
    await requireSystemRole(["MANGAKA"], createUserRepository(createUser()))({} as AuthenticatedRequest, noAuthRes, vi.fn());
    expect(noAuthRes.status).toHaveBeenCalledWith(401);
    expect(noAuthRes.json).toHaveBeenCalledWith(expect.objectContaining({ code: "AUTH_REQUIRED" }));

    const unsyncedRes = createResponse();
    await requireSystemRole(["MANGAKA"], createUserRepository(null))(
      { auth: { clerkId: "missing", systemRole: "MANGAKA", status: "ACTIVE" } } as AuthenticatedRequest,
      unsyncedRes,
      vi.fn()
    );
    expect(unsyncedRes.status).toHaveBeenCalledWith(401);
    expect(unsyncedRes.json).toHaveBeenCalledWith(expect.objectContaining({ code: "USER_NOT_SYNCED" }));

    const suspendedRes = createResponse();
    await requireSystemRole(["MANGAKA"], createUserRepository(createUser({ status: "SUSPENDED" })))(
      { auth: { clerkId: "clerk_mangaka", systemRole: "MANGAKA", status: "SUSPENDED" } } as AuthenticatedRequest,
      suspendedRes,
      vi.fn()
    );
    expect(suspendedRes.status).toHaveBeenCalledWith(403);
    expect(suspendedRes.json).toHaveBeenCalledWith(expect.objectContaining({ code: "FORBIDDEN" }));

    const wrongRoleRes = createResponse();
    await requireSystemRole(["EDITOR"], createUserRepository(createUser({ systemRole: "MANGAKA" })))(
      { auth: { clerkId: "clerk_mangaka", systemRole: "MANGAKA", status: "ACTIVE" } } as AuthenticatedRequest,
      wrongRoleRes,
      vi.fn()
    );
    expect(wrongRoleRes.status).toHaveBeenCalledWith(403);
    expect(wrongRoleRes.json).toHaveBeenCalledWith(expect.objectContaining({ code: "FORBIDDEN" }));
  });

  it("returns 500 when database lookup fails", async () => {
    const failingUserRepository: UserRepository = {
      async findByClerkId() {
        throw new Error("Database connection lost");
      },
      async upsertFromProfile() {
        throw new Error("not needed");
      },
      async updateOnboarding() {
        throw new Error("not needed");
      }
    };

    const req = {
      auth: { clerkId: "clerk_mangaka", systemRole: "MANGAKA", status: "ACTIVE" }
    } as AuthenticatedRequest;
    const res = createResponse();
    const next: NextFunction = vi.fn();

    await requireSystemRole(["MANGAKA"], failingUserRepository)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "INTERNAL_ERROR" }));
    expect(next).not.toHaveBeenCalled();
  });

  it("enforces series role only after localUser has been bound", async () => {
    const req = {
      params: { seriesId: "series_1" }
    } as unknown as RoleAuthorizedRequest;
    const res = createResponse();

    await requireSeriesRole(["OWNER_MANGAKA"], createSeriesRepository("OWNER_MANGAKA"))(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "INTERNAL_ERROR" }));
  });

  it("binds allowed series roles and rejects missing or disallowed memberships", async () => {
    const req = {
      params: { seriesId: "series_1" },
      localUser: createUser()
    } as unknown as RoleAuthorizedRequest;
    const res = createResponse();
    const next: NextFunction = vi.fn();

    await requireSeriesRole(["OWNER_MANGAKA"], createSeriesRepository("OWNER_MANGAKA"))(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.seriesRole).toBe("OWNER_MANGAKA");

    const deniedRes = createResponse();
    await requireSeriesRole(["EDITOR"], createSeriesRepository("ASSISTANT"))(
      {
        params: { seriesId: "series_1" },
        localUser: createUser()
      } as unknown as RoleAuthorizedRequest,
      deniedRes,
      vi.fn()
    );

    expect(deniedRes.status).toHaveBeenCalledWith(403);
    expect(deniedRes.json).toHaveBeenCalledWith(expect.objectContaining({ code: "FORBIDDEN" }));
  });
});

