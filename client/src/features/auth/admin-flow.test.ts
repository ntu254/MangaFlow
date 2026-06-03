import { describe, expect, it } from "vitest";
import {
  assignableSystemRoles,
  buildAdminUsersUrl,
  buildAdminCreateUserUrl,
  buildAdminUserRoleUrl,
  buildAdminUserStatusUrl,
  buildAdminUserResetPasswordUrl
} from "./admin-flow";

describe("admin-flow", () => {
  it("builds admin API URLs", () => {
    expect(buildAdminUsersUrl("http://localhost:5001/api")).toBe(
      "http://localhost:5001/api/admin/users"
    );
    expect(buildAdminCreateUserUrl("http://localhost:5001/api")).toBe(
      "http://localhost:5001/api/admin/users"
    );
    expect(buildAdminUserRoleUrl("http://localhost:5001/api", "user_1")).toBe(
      "http://localhost:5001/api/admin/users/user_1/role"
    );
    expect(buildAdminUserStatusUrl("http://localhost:5001/api", "user_1")).toBe(
      "http://localhost:5001/api/admin/users/user_1/status"
    );
    expect(buildAdminUserResetPasswordUrl("http://localhost:5001/api", "user_1")).toBe(
      "http://localhost:5001/api/admin/users/user_1/reset-password"
    );
  });

  it("exposes assignable system roles including ADMIN", () => {
    expect(assignableSystemRoles).toEqual([
      "ADMIN",
      "MANGAKA",
      "ASSISTANT",
      "EDITOR",
      "BOARD"
    ]);
  });
});
