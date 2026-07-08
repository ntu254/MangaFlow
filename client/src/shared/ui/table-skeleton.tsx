import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2" aria-label="Loading table rows">
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="grid gap-3 rounded-[5px] border border-[var(--admin-border)] bg-[var(--admin-page)]/45 p-3"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((__, column) => (
            <Skeleton key={column} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}
