import { describe, expect, it } from "vitest";
import { getAdminRoleReviewRoute, isAdminRoleReviewUser } from "./admin-flow";

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
});

