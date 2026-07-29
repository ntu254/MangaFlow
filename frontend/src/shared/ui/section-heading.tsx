import { cn } from "@/shared/lib/cn";
import type { ReactNode } from "react";

export function SectionHeading({
  title,
  icon,
  meta,
  className,
}: {
  title: string;
  icon?: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-[var(--admin-border)] pb-3",
        className,
      )}
    >
      <h2 className="flex items-center gap-2 font-serif text-[20px] font-semibold text-[var(--admin-ink)]">
        {icon ? <span className="text-[var(--admin-faint)]">{icon}</span> : null}
        {title}
      </h2>
      {meta ? (
        <div className="text-[12px] font-medium text-[var(--admin-muted)]">{meta}</div>
      ) : null}
    </div>
  );
}
