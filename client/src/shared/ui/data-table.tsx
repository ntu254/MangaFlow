import type { ReactNode } from "react";
import { EmptyState } from "./empty-state";
import { TableSkeleton } from "./table-skeleton";
import { cn } from "@/shared/lib/cn";

export function DataTable({
  isLoading,
  isEmpty,
  emptyTitle = "No data found",
  emptyDescription,
  skeletonRows = 5,
  skeletonColumns = 5,
  children,
  className,
  stateClassName,
}: {
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  skeletonRows?: number;
  skeletonColumns?: number;
  children?: ReactNode;
  className?: string;
  stateClassName?: string;
}) {
  const wrap = (content: ReactNode) => (
    <div
      className={cn(
        "overflow-hidden rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_20px_70px_rgba(31,24,12,0.04)]",
        className,
      )}
    >
      {content}
    </div>
  );

  if (isLoading) {
    return wrap(
      <div className={cn("p-4", stateClassName)}>
        <TableSkeleton rows={skeletonRows} columns={skeletonColumns} />
      </div>,
    );
  }

  if (isEmpty) {
    return wrap(
      <div className={cn("p-5", stateClassName)}>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          className="rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-page)]/45"
        />
      </div>,
    );
  }

  return wrap(children ?? null);
}
