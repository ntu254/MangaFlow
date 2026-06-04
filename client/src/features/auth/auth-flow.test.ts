import { describe, expect, it } from "vitest";
import { resolveAuthRoute } from "./auth-flow";

describe("resolveAuthRoute", () => {
  it("sends signed-out users to sign in", () => {
    expect(resolveAuthRoute({ isSignedIn: false, user: null })).toBe("/sign-in");
  });

  it("sends signed-in users without a role to blocked state", () => {
    expect(
      resolveAuthRoute({
        isSignedIn: true,
        user: { systemRole: null, status: "ACTIVE" }
      })
    ).toBe("/app/blocked");
  });

  it("sends role-bearing users to their dashboard", () => {
    expect(
      resolveAuthRoute({
        isSignedIn: true,
        user: { systemRole: "BOARD", status: "ACTIVE" }
      })
    ).toBe("/app/board/dashboard");
  });

  it("sends suspended users to the blocked state", () => {
    expect(
      resolveAuthRoute({
        isSignedIn: true,
        user: { systemRole: "ASSISTANT", status: "SUSPENDED" }
      })
    ).toBe("/app/blocked");
  });
});
