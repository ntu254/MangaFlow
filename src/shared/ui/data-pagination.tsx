import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";

export function DataPagination({
  total,
  page,
  pageSize = 10,
  onPageChange,
  itemName = "records",
}: {
  total: number;
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, total);
  const visiblePages = Array.from({ length: Math.min(totalPages, 4) }, (_, index) => index + 1);

  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 px-4 py-5 text-[14px] text-[var(--admin-muted)]">
      <p>
        Showing {firstRow} to {lastRow} of {total} {itemName}
      </p>
      <div className="flex items-center gap-3" aria-label="Pagination">
        <button
          type="button"
          disabled={page === 1}
          aria-label="Previous page"
          onClick={() => onPageChange(page - 1)}
          className="grid size-8 place-items-center rounded text-[var(--admin-faint)] hover:bg-[var(--admin-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        {visiblePages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            aria-current={pageNumber === page ? "page" : undefined}
            onClick={() => onPageChange(pageNumber)}
            className={
              pageNumber === page
                ? "grid size-9 place-items-center rounded-[5px] bg-[var(--admin-navy)] text-[13px] font-semibold text-[var(--admin-cream)]"
                : "grid size-9 place-items-center rounded-[5px] text-[13px] hover:bg-[var(--admin-hover)]"
            }
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          disabled={page === totalPages}
          aria-label="Next page"
          onClick={() => onPageChange(page + 1)}
          className="grid size-8 place-items-center rounded text-[var(--admin-faint)] hover:bg-[var(--admin-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          type="button"
          disabled={page === totalPages}
          aria-label="Last page"
          onClick={() => onPageChange(totalPages)}
          className="grid size-8 place-items-center rounded text-[var(--admin-faint)] hover:bg-[var(--admin-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronsRight className="size-4" />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <span>Rows per page</span>
        <Select value={String(pageSize)} disabled>
          <SelectTrigger className="h-10 w-20 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={String(pageSize)}>{pageSize}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </footer>
  );
}
