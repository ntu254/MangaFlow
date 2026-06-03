import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RoleGuard } from "./RoleGuard";

function renderGuard(
  systemRole: string | null,
  status: string = "ACTIVE",
  allowedRoles: string[] = ["MANGAKA"]
) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <RoleGuard
        systemRole={systemRole as any}
        status={status as any}
        allowedRoles={allowedRoles as any}
      >
        <main>Allowed workspace</main>
      </RoleGuard>
    </MemoryRouter>
  );
}

describe("RoleGuard", () => {
  it("renders children for users with an allowed role", () => {
    const html = renderGuard("MANGAKA");
    expect(html).toContain("Allowed workspace");
  });

  it("does not render children when role is null", () => {
    const html = renderGuard(null);
    expect(html).not.toContain("Allowed workspace");
  });

  it("does not render children when role is not allowed", () => {
    const html = renderGuard("ASSISTANT");
    expect(html).not.toContain("Allowed workspace");
  });

  it("does not render children when status is SUSPENDED", () => {
    const html = renderGuard("MANGAKA", "SUSPENDED");
    expect(html).not.toContain("Allowed workspace");
  });
});
