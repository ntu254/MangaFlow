import { Link } from "@tanstack/react-router";
import { AccessDeniedPanel } from "@/entities/access";
import { PageHeader } from "@/shared/ui";
import type { AdminAccessDenial } from "./admin-access-hooks";

export function AccessDenied({
  title,
  description,
  denial,
}: {
  title: string;
  description: string;
  denial: AdminAccessDenial;
}) {
  const isSessionIssue = denial === "session";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title={title} description={description} />
      <AccessDeniedPanel
        title={isSessionIssue ? "Session expired" : "Admin access required"}
        description={
          isSessionIssue
            ? "Please sign in again so admin requests include a valid bearer token."
            : "Your current role cannot access admin-only data."
        }
        action={
          <Link
            to={isSessionIssue ? "/login" : "/app/dashboard"}
            className="inline-flex items-center gap-2 rounded border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-ink)] outline-none transition hover:bg-[var(--admin-hover)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {isSessionIssue ? "Sign in again" : "Back to dashboard"}
          </Link>
        }
      />
    </div>
  );
}
