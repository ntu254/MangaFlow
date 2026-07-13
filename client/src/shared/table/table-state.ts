export type TableSortDir = "asc" | "desc";

export type TextColumnFilter = { type: "text"; value: string };
export type SelectColumnFilter = { type: "select"; value: string | string[] };
export type DateRangeColumnFilter = { type: "dateRange"; from?: string; to?: string };
export type NumberRangeColumnFilter = { type: "numberRange"; min?: number; max?: number };
export type BooleanColumnFilter = { type: "boolean"; value: boolean };

export type ColumnFilter =
  | TextColumnFilter
  | SelectColumnFilter
  | DateRangeColumnFilter
  | NumberRangeColumnFilter
  | BooleanColumnFilter;

export type TableFilters = Record<string, ColumnFilter>;

export type TableState = {
  page: number;
  pageSize: number;
  q: string;
  sortBy?: string;
  sortDir: TableSortDir;
  filters: TableFilters;
};

export const DEFAULT_TABLE_STATE: TableState = {
  page: 1,
  pageSize: 20,
  q: "",
  sortDir: "asc",
  filters: {},
};

function readPositiveInteger(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function serializeFilters(filters: TableFilters) {
  return Object.keys(filters).length > 0 ? JSON.stringify(filters) : "";
}

export function deserializeFilters(raw: string | null): TableFilters {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as TableFilters;
  } catch {
    return {};
  }
}

export function parseTableStateFromSearchParams(
  params: URLSearchParams,
  defaults: Partial<TableState> = {},
): TableState {
  const base = { ...DEFAULT_TABLE_STATE, ...defaults };
  const sortDir = params.get("sortDir") === "desc" ? "desc" : "asc";

  return {
    page: readPositiveInteger(params.get("page"), base.page),
    pageSize: readPositiveInteger(params.get("pageSize"), base.pageSize),
    q: params.get("q") ?? base.q,
    sortBy: params.get("sortBy") ?? base.sortBy,
    sortDir,
    filters: deserializeFilters(params.get("filters")),
  };
}

export function tableStateToSearchParams(state: TableState) {
  const params = new URLSearchParams();
  params.set("page", String(state.page));
  params.set("pageSize", String(state.pageSize));
  if (state.q.trim()) params.set("q", state.q.trim());
  if (state.sortBy) {
    params.set("sortBy", state.sortBy);
    params.set("sortDir", state.sortDir);
  }
  const filters = serializeFilters(state.filters);
  if (filters) params.set("filters", filters);
  return params;
}

export function resetTableState(overrides: Partial<TableState> = {}): TableState {
  return {
    ...DEFAULT_TABLE_STATE,
    ...overrides,
    filters: overrides.filters ?? {},
  };
}

export function setTableFilter(
  state: TableState,
  field: string,
  filter: ColumnFilter | undefined,
): TableState {
  const filters = { ...state.filters };
  if (filter) {
    filters[field] = filter;
  } else {
    delete filters[field];
  }
  return { ...state, page: 1, filters };
}
