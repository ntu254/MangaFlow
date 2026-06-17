import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface DataTableColumn<T> {
  header: React.ReactNode
  accessorKey?: keyof T
  cell?: (item: T) => React.ReactNode
  className?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  emptyState?: React.ReactNode
  loading?: boolean
  className?: string
  rowKey: (item: T) => string
}

export function DataTable<T>({
  data,
  columns,
  emptyState,
  loading,
  className,
  rowKey,
}: DataTableProps<T>) {
  return (
    <div className={cn("w-full overflow-auto rounded-lg border border-border/50 bg-card", className)}>
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 text-muted-foreground border-b border-border/50">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className={cn("px-4 py-3 font-medium", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-primary border-r-transparent animate-spin"></span>
                  Loading data...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                {emptyState || "No data available."}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={rowKey(item)} className="transition-colors hover:bg-muted/30">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className={cn("px-4 py-3 align-middle", col.className)}>
                    {col.cell ? col.cell(item) : col.accessorKey ? String(item[col.accessorKey]) : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
