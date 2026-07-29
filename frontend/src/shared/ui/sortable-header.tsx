import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { SortDirection } from "@/shared/lib/use-sortable-data";

export function SortableHeader({
  label,
  sortKey,
  activeSortKey,
  direction,
  onSort,
  className,
}: {
  label: string;
  sortKey: string;
  activeSortKey: string | null;
  direction: SortDirection;
  onSort: (key: string) => void;
  className?: string;
}) {
  const active = activeSortKey === sortKey;
  const ariaSort =
    active && direction === "asc"
      ? "ascending"
      : active && direction === "desc"
        ? "descending"
        : "none";

  return (
    <button
      type="button"
      aria-sort={ariaSort}
      onClick={() => onSort(sortKey)}
      className={cn(
        "inline-flex items-center gap-1 select-none rounded outline-none hover:text-[var(--admin-ink,inherit)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        className,
      )}
    >
      {label}
      {active && direction === "asc" ? (
        <ArrowUp className="size-3" />
      ) : active && direction === "desc" ? (
        <ArrowDown className="size-3" />
      ) : (
        <ArrowUpDown className="size-3 opacity-40" />
      )}
    </button>
  );
}
