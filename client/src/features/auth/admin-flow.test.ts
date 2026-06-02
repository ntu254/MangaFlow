import { describe, expect, it } from "vitest";
import {
  assignableSystemRoles,
  buildAdminRoleReviewUrl,
  buildAdminUserRoleUrl,
  buildAdminUserStatusUrl,
  getAdminRoleReviewRoute,
  isAdminRoleReviewUser
} from "./admin-flow";

describe("admin-flow", () => {
  it("uses the admin role review route", () => {
    expect(getAdminRoleReviewRoute()).toBe("/app/admin/users/role-review");
  });

  it("identifies users waiting for role review", () => {
    expect(
      isAdminRoleReviewUser({
        systemRole: null,
        requestedSystemRole: "MANGAKA",
        status: "ACTIVE"
      })
    ).toBe(true);
  });

  it("excludes assigned or suspended users from active role review", () => {
    expect(
      isAdminRoleReviewUser({
        systemRole: "ASSISTANT",
        requestedSystemRole: null,
        status: "ACTIVE"
      })
    ).toBe(false);
    expect(
      isAdminRoleReviewUser({
        systemRole: null,
        requestedSystemRole: "ASSISTANT",
        status: "SUSPENDED"
      })
    ).toBe(false);
  });

  it("builds admin API URLs", () => {
    expect(buildAdminRoleReviewUrl("http://localhost:5001/api")).toBe(
      "http://localhost:5001/api/admin/users?role=pending&status=ACTIVE"
    );
    expect(buildAdminUserRoleUrl("http://localhost:5001/api", "user_1")).toBe(
      "http://localhost:5001/api/admin/users/user_1/role"
    );
    expect(buildAdminUserStatusUrl("http://localhost:5001/api", "user_1")).toBe(
      "http://localhost:5001/api/admin/users/user_1/status"
    );
  });

  it("exposes assignable non-admin workflow roles", () => {
    expect(assignableSystemRoles).toEqual([
      "MANGAKA",
      "ASSISTANT",
      "EDITOR",
      "BOARD"
    ]);
  });
});
