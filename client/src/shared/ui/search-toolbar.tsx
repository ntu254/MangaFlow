import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/lib/cn";
import type { ReactNode } from "react";

export function SearchToolbar({
  query,
  onQueryChange,
  placeholder = "Search...",
  filters,
  actions,
  className,
  inputClassName,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
  inputClassName?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <div className="relative min-w-0 basis-[280px] flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-faint)]" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={placeholder}
          aria-label="Search"
          className={cn(
            "h-10 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] pl-10 text-[13px] shadow-sm placeholder:text-[var(--admin-faint)]",
            inputClassName,
          )}
        />
      </div>
      {filters}
      {actions}
    </div>
  );
}
