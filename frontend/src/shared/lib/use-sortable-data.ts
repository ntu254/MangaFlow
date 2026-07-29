import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc" | null;

export type SortAccessor<T> = (item: T) => string | number | Date | null | undefined;

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a instanceof Date || b instanceof Date) {
    return new Date(a as Date).getTime() - new Date(b as Date).getTime();
  }
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

export function useSortableData<T>(
  data: T[],
  accessors: Record<string, SortAccessor<T>>,
  defaultSort?: { key: string; direction: SortDirection },
) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSort?.key ?? null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSort?.direction ?? null);

  const toggleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("asc");
      return;
    }
    if (sortDirection === "asc") {
      setSortDirection("desc");
      return;
    }
    if (sortDirection === "desc") {
      setSortKey(defaultSort?.key ?? null);
      setSortDirection(defaultSort?.direction ?? null);
      return;
    }
    setSortDirection("asc");
  };

  const sorted = useMemo(() => {
    const accessor = sortKey ? accessors[sortKey] : undefined;
    if (!sortKey || !sortDirection || !accessor) return data;
    const copy = [...data];
    copy.sort((a, b) => {
      const result = compareValues(accessor(a), accessor(b));
      return sortDirection === "asc" ? result : -result;
    });
    return copy;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sortKey, sortDirection]);

  return { sorted, sortKey, sortDirection, toggleSort };
}
