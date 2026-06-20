import { LayoutGrid, List, Search } from "lucide-react";

export type ViewMode = "kanban" | "list";
export type DueFilter = "all" | "overdue" | "week";

export function TaskToolbar({
  search,
  setSearch,
  seriesOptions,
  seriesFilter,
  setSeriesFilter,
  typeOptions,
  typeFilter,
  setTypeFilter,
  dueFilter,
  setDueFilter,
  showApproved,
  setShowApproved,
  view,
  setView,
}: {
  search: string;
  setSearch: (v: string) => void;
  seriesOptions: { id: string; label: string }[];
  seriesFilter: string;
  setSeriesFilter: (v: string) => void;
  typeOptions: string[];
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  dueFilter: DueFilter;
  setDueFilter: (v: DueFilter) => void;
  showApproved: boolean;
  setShowApproved: (v: boolean) => void;
  view: ViewMode;
  setView: (v: ViewMode) => void;
}) {
  const selectCls =
    "h-8 rounded-md border border-foreground/15 bg-background px-2 text-[12px] text-foreground focus:border-foreground/30 focus:outline-none";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search series, chapter, page…"
          className="h-8 w-64 rounded-md border border-foreground/15 bg-background pl-8 pr-2 text-[12px] text-foreground placeholder:text-foreground/40 focus:border-foreground/30 focus:outline-none"
        />
      </div>

      <select
        value={seriesFilter}
        onChange={(e) => setSeriesFilter(e.target.value)}
        className={selectCls}
      >
        <option value="all">All series</option>
        {seriesOptions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
        className={selectCls}
      >
        <option value="all">All types</option>
        {typeOptions.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <select
        value={dueFilter}
        onChange={(e) => setDueFilter(e.target.value as DueFilter)}
        className={selectCls}
      >
        <option value="all">Any deadline</option>
        <option value="overdue">Overdue</option>
        <option value="week">Due in 7 days</option>
      </select>

      <label className="inline-flex h-8 items-center gap-1.5 rounded-md border border-foreground/15 bg-background px-2.5 text-[12px] text-foreground/70">
        <input
          type="checkbox"
          checked={showApproved}
          onChange={(e) => setShowApproved(e.target.checked)}
          className="h-3.5 w-3.5 accent-primary"
        />
        Show approved
      </label>

      <div className="ml-auto inline-flex h-8 items-center rounded-md border border-foreground/15 bg-background p-0.5">
        <button
          type="button"
          onClick={() => setView("kanban")}
          aria-pressed={view === "kanban"}
          className={`inline-flex h-7 items-center gap-1 rounded px-2 text-[11px] font-medium transition ${
            view === "kanban"
              ? "bg-primary text-primary-foreground"
              : "text-foreground/70 hover:text-foreground"
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5" /> Kanban
        </button>
        <button
          type="button"
          onClick={() => setView("list")}
          aria-pressed={view === "list"}
          className={`inline-flex h-7 items-center gap-1 rounded px-2 text-[11px] font-medium transition ${
            view === "list"
              ? "bg-primary text-primary-foreground"
              : "text-foreground/70 hover:text-foreground"
          }`}
        >
          <List className="h-3.5 w-3.5" /> List
        </button>
      </div>
    </div>
  );
}
