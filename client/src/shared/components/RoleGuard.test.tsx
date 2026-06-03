import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RoleGuard } from "./RoleGuard";
import type { AuthRouteUser } from "@/features/auth/auth-flow";

function renderGuard(user: AuthRouteUser | null, allowedRoles?: string[]) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <RoleGuard user={user} allowedRoles={(allowedRoles ?? ["MANGAKA"]) as any}>
        <main>Allowed workspace</main>
      </RoleGuard>
    </MemoryRouter>
  );
}

describe("RoleGuard", () => {
  it("renders children for users with an allowed role", () => {
    const html = renderGuard({
      systemRole: "MANGAKA",
      status: "ACTIVE"
    });

    expect(html).toContain("Allowed workspace");
  });

  it("does not render children when user is null", () => {
    const html = renderGuard(null);
    expect(html).not.toContain("Allowed workspace");
  });

  it("does not render children when role is not allowed", () => {
    const html = renderGuard({
      systemRole: "ASSISTANT",
      status: "ACTIVE"
    });
    expect(html).not.toContain("Allowed workspace");
  });

  it("does not render children for synced users without assigned system role", () => {
    const html = renderGuard({
      systemRole: null,
      status: "ACTIVE"
    });
    expect(html).not.toContain("Allowed workspace");
  });
});
