import { cn } from "@/shared/lib/cn";
import type { ReactNode } from "react";

export function StateBlock({
  title,
  description,
  tone = "default",
  action,
}: {
  title: string;
  description?: string;
  tone?: "default" | "danger" | "success" | "warning";
  action?: ReactNode;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-[6px] border p-3 text-[13px] shadow-sm",
        tone === "default" && "border-[var(--admin-border)] bg-[var(--admin-surface)]",
        tone === "danger" && "border-destructive/30 bg-destructive/10 text-destructive",
        tone === "success" &&
          "border-[var(--role-editor)]/30 bg-[var(--role-editor)]/10 text-[var(--role-editor)]",
        tone === "warning" &&
          "border-[var(--role-board)]/30 bg-[var(--role-board)]/10 text-[var(--role-board)]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-[var(--admin-ink)]">{title}</p>
          {description ? <p className="mt-0.5 text-[var(--admin-faint)]">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
