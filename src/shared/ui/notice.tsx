import { cn } from "@/shared/lib/cn";
import type { ReactNode } from "react";

export function Notice({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[6px] border border-[var(--admin-gold)] bg-[var(--admin-surface)] px-4 py-3 shadow-[0_10px_30px_rgba(31,24,12,0.04)]",
        className,
      )}
    >
      {icon ? <div className="mt-0.5 shrink-0 text-[var(--admin-gold-icon)]">{icon}</div> : null}
      <div className="min-w-0 flex-1">
        <p className="font-serif text-[16px] font-semibold text-[var(--admin-ink)]">{title}</p>
        <div className="mt-1 text-[13px] text-[var(--admin-muted)]">{children}</div>
      </div>
      {action}
    </div>
  );
}
