import type { ReactNode } from "react";
import { StateBlock } from "./state-block";

export function PageGuard({
  denial,
  error,
  errorTitle = "Could not load data",
  errorMessage,
  pageName = "this page",
  children,
}: {
  denial: "session" | "role" | null;
  error?: unknown;
  errorTitle?: string;
  errorMessage?: string;
  pageName?: string;
  children: ReactNode;
}) {
  if (denial) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <StateBlock
          tone="danger"
          title="Access denied"
          description={
            denial === "session"
              ? "Please sign in again."
              : "Your current role cannot access this page."
          }
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <StateBlock
          tone="danger"
          title={errorTitle}
          description={errorMessage ?? "An unexpected error occurred."}
        />
      </div>
    );
  }

  return <>{children}</>;
}
