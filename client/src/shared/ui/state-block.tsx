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
        tone === "danger" &&
          "border-rose-200 bg-rose-50/50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-900/10 dark:text-rose-200",
        tone === "success" &&
          "border-emerald-200 bg-emerald-50/50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-900/10 dark:text-emerald-200",
        tone === "warning" &&
          "border-amber-200 bg-amber-50/50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-900/10 dark:text-amber-200",
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
