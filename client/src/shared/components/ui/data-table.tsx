import * as React from 'react'
import { cn } from '@/shared/lib/utils'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { AlertCircle, FileQuestion, Loader2 } from 'lucide-react'

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
  error?: Error | string | boolean
  className?: string
  rowKey: (item: T) => string
  onRowClick?: (item: T) => void
}

export function DataTable<T>({
  data,
  columns,
  emptyState,
  loading,
  error,
  className,
  rowKey,
  onRowClick,
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
          {error ? (
            <tr>
              <td colSpan={columns.length} className="p-4">
                <EmptyState 
                  icon={AlertCircle}
                  title="Failed to load data"
                  description={typeof error === 'string' ? error : (error instanceof Error ? error.message : "An unexpected error occurred while fetching data.")}
                  className="bg-rose-50/50 border-rose-200"
                />
              </td>
            </tr>
          ) : loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8">
                <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                  <span className="text-sm font-medium">Loading data...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-4">
                {typeof emptyState === 'string' ? (
                  <EmptyState icon={FileQuestion} title={emptyState} />
                ) : (
                  emptyState || <EmptyState icon={FileQuestion} title="No data found" description="There are no records to display." />
                )}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr 
                key={rowKey(item)} 
                className={cn("transition-colors hover:bg-muted/30", onRowClick && "cursor-pointer")}
                onClick={() => onRowClick?.(item)}
              >
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
