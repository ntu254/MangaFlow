import type { ReactNode } from "react";
import { PageHeader } from "@/shared/ui/page-header";

/**
 * Standard scaffold for review/work queue list pages: title + actions, a row of
 * summary stat cards, tabs, an optional filter toolbar, the table, and a footer
 * (pagination). Each page supplies its own data-specific slots.
 */
export function QueuePage({
  eyebrow,
  title,
  description,
  actions,
  stats,
  tabs,
  toolbar,
  footer,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  stats?: ReactNode;
  tabs?: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader eyebrow={eyebrow} title={title} description={description} />
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>

      {stats ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{stats}</div> : null}

      {tabs || toolbar ? (
        <div className="space-y-3">
          {tabs ? <div>{tabs}</div> : null}
          {toolbar ? <div>{toolbar}</div> : null}
        </div>
      ) : null}

      {children}

      {footer ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-[var(--admin-faint)]">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/** Small outline button used for header actions (Refresh / Filter). */
export function QueueActionButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon?: ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3.5 py-2 text-[13px] font-semibold text-[var(--admin-ink)] transition-colors hover:bg-[var(--admin-hover)] disabled:opacity-50"
    >
      {icon}
      {label}
    </button>
  );
}
