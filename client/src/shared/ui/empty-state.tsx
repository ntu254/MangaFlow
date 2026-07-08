import { forwardRef, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { title, description, action, icon, className },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[6px] border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)]/55 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="grid size-10 place-items-center rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-page)] text-[var(--admin-faint)]">
          {icon}
        </div>
      ) : null}
      <h3 className="font-serif text-[20px] font-semibold text-[var(--admin-ink)]">{title}</h3>
      {description ? (
        <p className="max-w-md text-[13px] leading-relaxed text-[var(--admin-muted)]">
          {description}
        </p>
      ) : null}
      {action}
    </div>
  );
});

EmptyState.displayName = "EmptyState";
