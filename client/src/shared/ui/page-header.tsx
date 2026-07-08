import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  actionsClassName,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  actionsClassName?: string;
}) {
  const headerActions = actions ?? children;

  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className={cn("min-w-0", contentClassName)}>
        {eyebrow ? (
          <p className="font-serif text-[14px] text-[var(--admin-faint)]">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 font-serif text-[38px] leading-none text-[var(--admin-ink)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-[14px] text-[var(--admin-muted)]">{description}</p>
        ) : null}
      </div>
      {headerActions ? (
        <div className={cn("flex flex-wrap items-center gap-3", actionsClassName)}>
          {headerActions}
        </div>
      ) : null}
    </header>
  );
}
