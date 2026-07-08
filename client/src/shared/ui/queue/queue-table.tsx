import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type QueueAccent = "rose" | "amber" | "emerald" | "blue" | null;

export type QueueColumn<T> = {
  key: string;
  header: ReactNode;
  align?: "left" | "right" | "center";
  /** width / extra cell classes */
  className?: string;
  render: (row: T) => ReactNode;
};

const ACCENT_ROW: Record<NonNullable<QueueAccent>, string> = {
  rose: "border-l-rose-500 bg-rose-50/40",
  amber: "border-l-amber-500 bg-amber-50/30",
  emerald: "border-l-emerald-500",
  blue: "border-l-blue-500",
};

function alignClass(align?: "left" | "right" | "center") {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}

export function QueueTable<T>({
  columns,
  rows,
  getRowKey,
  getRowAccent,
  onRowClick,
  isRowSelected,
  minWidth = 960,
  fixed = false,
  empty,
}: {
  columns: QueueColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  getRowAccent?: (row: T) => QueueAccent;
  onRowClick?: (row: T) => void;
  isRowSelected?: (row: T) => boolean;
  minWidth?: number;
  /** Fit-to-width mode: table-fixed + truncating cells, no horizontal scroll. */
  fixed?: boolean;
  empty?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_20px_70px_rgba(31,24,12,0.04)]">
      {rows.length === 0 ? (
        <div className="p-10 text-center text-[13px] text-[var(--admin-faint)]">
          {empty ?? "Không có mục nào."}
        </div>
      ) : (
        <div className={fixed ? "overflow-hidden" : "overflow-x-auto"}>
          <table
            className={cn("w-full text-[13px]", fixed && "table-fixed")}
            style={fixed ? undefined : { minWidth }}
          >
            <thead className="border-b border-[var(--admin-border)] bg-[var(--admin-page)]/60 text-[10px] uppercase tracking-widest text-[var(--admin-faint)]">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 font-semibold",
                      alignClass(col.align),
                      fixed && "overflow-hidden",
                      col.className,
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]">
              {rows.map((row) => {
                const accent = getRowAccent?.(row) ?? null;
                const selected = isRowSelected?.(row) ?? false;
                const clickable = Boolean(onRowClick);
                return (
                  <tr
                    key={getRowKey(row)}
                    role={clickable ? "button" : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    onClick={clickable ? () => onRowClick?.(row) : undefined}
                    onKeyDown={
                      clickable
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              onRowClick?.(row);
                            }
                          }
                        : undefined
                    }
                    className={cn(
                      "border-l-2 border-l-transparent transition-colors hover:bg-[var(--admin-hover)]/60",
                      accent ? ACCENT_ROW[accent] : null,
                      clickable ? "cursor-pointer" : null,
                      selected
                        ? "bg-[var(--admin-selection)] shadow-[inset_3px_0_0_var(--admin-navy)]"
                        : null,
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3 align-middle",
                          alignClass(col.align),
                          fixed && "overflow-hidden",
                          col.className,
                        )}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
