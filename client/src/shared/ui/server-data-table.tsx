import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import type { ReactNode } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/shared/lib/cn";
import { DataPagination } from "./data-pagination";
import { EmptyState } from "./empty-state";
import { StateBlock } from "./state-block";
import { TableSkeleton } from "./table-skeleton";

export type ServerDataTablePagination = {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemName?: string;
};

export type ServerDataTableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  getRowId?: (row: TData, index: number) => string;
  getRowClassName?: (row: TData) => string | undefined;
  isLoading?: boolean;
  error?: unknown;
  emptyTitle?: string;
  emptyDescription?: string;
  skeletonRows?: number;
  toolbar?: ReactNode;
  pagination?: ServerDataTablePagination;
  className?: string;
};

function errorMessage(error: unknown) {
  if (!error) return undefined;
  if (error instanceof Error) return error.message;
  return "The table data could not be loaded.";
}

export function ServerDataTable<TData>({
  data,
  columns,
  getRowId,
  getRowClassName,
  isLoading,
  error,
  emptyTitle = "No records found",
  emptyDescription = "Try changing the search or filters.",
  skeletonRows = 8,
  toolbar,
  pagination,
  className,
}: ServerDataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });
  const hasRows = table.getRowModel().rows.length > 0;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[0_20px_70px_rgba(31,24,12,0.04)]",
        className,
      )}
    >
      {toolbar ? <div className="border-b border-[var(--admin-border)] p-4">{toolbar}</div> : null}

      {error ? (
        <div className="p-4">
          <StateBlock
            tone="danger"
            title="Could not load records"
            description={errorMessage(error)}
          />
        </div>
      ) : isLoading ? (
        <div className="p-4">
          <TableSkeleton rows={skeletonRows} columns={Math.max(columns.length, 1)} />
        </div>
      ) : !hasRows ? (
        <div className="p-5">
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            className="rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-page)]/45"
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className={getRowClassName?.(row.original)}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {pagination && !error ? <DataPagination {...pagination} /> : null}
    </section>
  );
}
