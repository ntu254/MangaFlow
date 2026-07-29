import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export function DataPagination({
  total,
  page,
  pageSize = 10,
  pageSizeOptions = [8, 10, 20, 50],
  onPageChange,
  onPageSizeChange,
  itemName = "records",
}: {
  total: number;
  page: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  itemName?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const firstRow = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastRow = Math.min(safePage * pageSize, total);
  const maxVisiblePages = 5;
  const initialStart = Math.max(1, safePage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, initialStart + maxVisiblePages - 1);
  const startPage = Math.max(1, endPage - maxVisiblePages + 1);
  const visiblePages = Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index,
  );

  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 px-4 py-5 text-[14px] text-[var(--admin-muted)]">
      <p>
        Showing {firstRow} to {lastRow} of {total} {itemName}
      </p>
      <div className="flex items-center gap-3" aria-label="Pagination">
        <button
          type="button"
          disabled={safePage === 1}
          aria-label="First page"
          onClick={() => onPageChange(1)}
          className="grid size-8 place-items-center rounded text-[var(--admin-faint)] hover:bg-[var(--admin-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronsLeft className="size-4" />
        </button>
        <button
          type="button"
          disabled={safePage === 1}
          aria-label="Previous page"
          onClick={() => onPageChange(safePage - 1)}
          className="grid size-8 place-items-center rounded text-[var(--admin-faint)] hover:bg-[var(--admin-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        {visiblePages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            aria-current={pageNumber === safePage ? "page" : undefined}
            onClick={() => onPageChange(pageNumber)}
            className={
              pageNumber === safePage
                ? "grid size-9 place-items-center rounded-[5px] bg-[var(--admin-navy)] text-[13px] font-semibold text-[var(--admin-cream)]"
                : "grid size-9 place-items-center rounded-[5px] text-[13px] hover:bg-[var(--admin-hover)]"
            }
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          disabled={safePage === totalPages}
          aria-label="Next page"
          onClick={() => onPageChange(safePage + 1)}
          className="grid size-8 place-items-center rounded text-[var(--admin-faint)] hover:bg-[var(--admin-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          type="button"
          disabled={safePage === totalPages}
          aria-label="Last page"
          onClick={() => onPageChange(totalPages)}
          className="grid size-8 place-items-center rounded text-[var(--admin-faint)] hover:bg-[var(--admin-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronsRight className="size-4" />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <span>Rows per page</span>
        {onPageSizeChange ? (
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-10 w-20 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="grid h-10 min-w-12 place-items-center rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-[13px] font-semibold text-[var(--admin-ink)]">
            {pageSize}
          </span>
        )}
      </div>
    </footer>
  );
}
