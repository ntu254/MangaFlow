import { describe, it, expect, vi, beforeEach } from "vitest";

const sessionStorageState: Record<string, string> = {};

vi.mock("@/shared/api/config", () => ({
  apiConfig: { useMockApi: true },
}));

vi.mock("@/shared/api", () => ({
  apiClient: {
    post: vi.fn().mockImplementation(() => Promise.resolve({})),
  },
}));

import { adminAuthService } from "./admin-auth.service";

describe("adminAuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(sessionStorageState).forEach((k) => delete sessionStorageState[k]);

    vi.stubGlobal(
      "sessionStorage",
      {
        getItem: vi.fn((key: string) => (key in sessionStorageState ? sessionStorageState[key] : null)),
        setItem: vi.fn((key: string, value: string) => { sessionStorageState[key] = value; }),
        removeItem: vi.fn((key: string) => { delete sessionStorageState[key]; }),
        clear: vi.fn(() => { Object.keys(sessionStorageState).forEach((k) => delete sessionStorageState[k]); }),
      },
    );
  });

  it("hasPermission grants super_admin bypass", () => {
    const session = {
      roleName: "super_admin" as const,
      permissions: [],
    };

    expect(adminAuthService.hasPermission(session, "users", "write")).toBe(true);
    expect(adminAuthService.hasPermission(session, "anything", "delete")).toBe(true);
  });

  it("hasPermission denies when no session", () => {
    expect(adminAuthService.hasPermission(null, "users", "read")).toBe(false);
  });

  it("hasPermission restricts based on permissions map", () => {
    const session = {
      roleName: "admin" as const,
      permissions: [{ module: "users", canRead: true, canWrite: false, canDelete: false }],
    };

    expect(adminAuthService.hasPermission(session, "users", "read")).toBe(true);
    expect(adminAuthService.hasPermission(session, "users", "write")).toBe(false);
    expect(adminAuthService.hasPermission(session, "users", "delete")).toBe(false);
    expect(adminAuthService.hasPermission(session, "finance", "read")).toBe(false);
  });

  it("saveSession and getSession round trip", () => {
    const session = {
      id: "1",
      userId: "auth-1",
      email: "admin@example.com",
      displayName: "Admin",
      roleId: "r1",
      roleName: "admin" as const,
      permissions: [],
    };

    adminAuthService.saveSession(session);
    const result = adminAuthService.getSession();

    expect(result?.email).toBe("admin@example.com");
    expect(result?.roleName).toBe("admin");
  });

  it("clearSession removes admin session", () => {
    sessionStorageState.admin_session = JSON.stringify({
      id: "1",
      userId: "auth-1",
      email: "admin@example.com",
      displayName: "Admin",
      roleId: "r1",
      roleName: "admin",
      permissions: [],
    });

    adminAuthService.clearSession();
    expect(adminAuthService.getSession()).toBeNull();
  });
});
