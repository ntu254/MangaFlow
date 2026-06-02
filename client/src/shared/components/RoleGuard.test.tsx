import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RoleGuard } from "./RoleGuard";
import type { AuthRouteUser } from "@/features/auth/auth-flow";

function renderGuard(user: AuthRouteUser | null) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <RoleGuard user={user} allowedRoles={["MANGAKA"]}>
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
    expect(html).not.toContain("Access Denied");
  });

  it("renders access denied when user is missing or role is not allowed", () => {
    expect(renderGuard(null)).toContain("Access Denied");
    expect(
      renderGuard({
        systemRole: "ASSISTANT",
        status: "ACTIVE"
      })
    ).toContain("Access Denied");
  });

  it("renders access denied for synced users without assigned system role", () => {
    const html = renderGuard({
      systemRole: null,
      status: "ACTIVE"
    });

    expect(html).toContain("Access Denied");
    expect(html).toContain("Return to Home");
  });
});
