import type { ReactNode } from "react"
import { MFSkeleton } from "@/shared/components/feedback/MFSkeleton"
import { cn } from "@/shared/lib/utils"
import { MFCard } from "./MFCard"

type TableAlignment = "left" | "center" | "right"

export interface MFTableColumn<T> {
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  align?: TableAlignment
  className?: string
  headerClassName?: string
}

interface MFTableProps<T> {
  columns: MFTableColumn<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  caption: string
  showCaption?: boolean
  loading?: boolean
  loadingRowCount?: number
  emptyTitle?: string
  emptyDescription?: string
  className?: string
  tableClassName?: string
}

const alignmentStyles: Record<TableAlignment, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
}

export function MFTable<T>({
  columns,
  rows,
  getRowKey,
  caption,
  showCaption = false,
  loading = false,
  loadingRowCount = 4,
  emptyTitle = "No records yet",
  emptyDescription = "Records will appear here when they are available.",
  className,
  tableClassName,
}: MFTableProps<T>) {
  const safeLoadingRowCount = Math.max(1, Math.floor(loadingRowCount))
  const columnCount = Math.max(1, columns.length)

  return (
    <MFCard padding="sm" className={cn("overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table
          aria-busy={loading}
          className={cn("w-full min-w-[640px] border-collapse", tableClassName)}
        >
          <caption className={showCaption ? "px-md py-md text-left text-title-lg text-on-surface" : "sr-only"}>
            {caption}
          </caption>
          <thead className="sticky top-0 z-10 bg-surface-low">
            <tr className="border-b border-outline-variant/40">
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={cn(
                    "px-md py-md text-label-md text-on-surface-muted",
                    alignmentStyles[column.align ?? "left"],
                    column.headerClassName,
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30 bg-surface-lowest">
            {loading
              ? Array.from({ length: safeLoadingRowCount }, (_, rowIndex) => (
                  <tr key={`loading-${rowIndex}`} aria-hidden="true">
                    {columns.map((column) => (
                      <td key={column.id} className={cn("px-md py-md", column.className)}>
                        <MFSkeleton className="h-5 w-full max-w-40" />
                      </td>
                    ))}
                  </tr>
                ))
              : null}
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-md py-xxl text-center">
                  <div className="mx-auto max-w-md">
                    <span
                      className="material-symbols-outlined text-[32px] text-on-surface-muted"
                      aria-hidden="true"
                    >
                      table_rows
                    </span>
                    <h3 className="mt-sm text-title-lg text-on-surface">{emptyTitle}</h3>
                    <p className="mt-sm text-body-md text-on-surface-muted">
                      {emptyDescription}
                    </p>
                  </div>
                </td>
              </tr>
            ) : null}
            {!loading
              ? rows.map((row) => (
                  <tr
                    key={getRowKey(row)}
                    className="transition-colors hover:bg-primary-fixed/20"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          "px-md py-md text-body-md text-on-surface",
                          alignmentStyles[column.align ?? "left"],
                          column.className,
                        )}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </MFCard>
  )
}
