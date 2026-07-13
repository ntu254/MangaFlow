import type { Response } from "express";
import { AppError } from "../../lib/http.js";
import type { AuthedRequest } from "../../types.js";

export type SortDir = "asc" | "desc";

export type TextFilter = { type: "text"; value: string };
export type SelectFilter = { type: "select"; value: string | string[] };
export type DateRangeFilter = { type: "dateRange"; from?: string; to?: string };
export type NumberRangeFilter = { type: "numberRange"; min?: number; max?: number };
export type BooleanFilter = { type: "boolean"; value: boolean };

export type ColumnFilter =
  | TextFilter
  | SelectFilter
  | DateRangeFilter
  | NumberRangeFilter
  | BooleanFilter;

export type ListFilters = Record<string, ColumnFilter>;

export type ListPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type ListSort = {
  field: string;
  dir: SortDir;
};

export type ListQuery = {
  page: number;
  pageSize: number;
  q?: string;
  sort?: ListSort;
  filters: ListFilters;
};

export type ListFieldConfig = {
  searchable?: readonly string[];
  sortable?: readonly string[];
  filterable?: Record<string, ColumnFilter["type"]>;
  defaultSort?: ListSort;
  maxPageSize?: number;
};

export type ListMeta = {
  q?: string;
  sort?: ListSort;
  filters: ListFilters;
};

export type ListEnvelope<T> = {
  data: T[];
  pagination: ListPagination;
  meta: ListMeta;
};

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_MAX_PAGE_SIZE = 100;

function firstQueryValue(value: unknown): string | undefined {
  if (Array.isArray(value)) return firstQueryValue(value[0]);
  return typeof value === "string" ? value : undefined;
}

function parsePositiveInteger(value: unknown, fallback: number) {
  const raw = firstQueryValue(value);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseFilters(rawValue: unknown): ListFilters {
  const raw = firstQueryValue(rawValue);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("filters must be an object");
    }
    return parsed as ListFilters;
  } catch {
    throw new AppError(400, "Invalid filters query parameter", "INVALID_LIST_FILTERS");
  }
}

function assertFilterShape(field: string, filter: ColumnFilter, expectedType: ColumnFilter["type"]) {
  if (!filter || typeof filter !== "object" || filter.type !== expectedType) {
    throw new AppError(400, `Invalid filter for ${field}`, "INVALID_LIST_FILTER");
  }
}

export function parseListQuery(req: AuthedRequest, config: ListFieldConfig = {}): ListQuery {
  const maxPageSize = config.maxPageSize ?? DEFAULT_MAX_PAGE_SIZE;
  const page = parsePositiveInteger(req.query.page, 1);
  const pageSize = Math.min(parsePositiveInteger(req.query.pageSize, DEFAULT_PAGE_SIZE), maxPageSize);
  const q = firstQueryValue(req.query.q)?.trim() || undefined;
  const sortBy = firstQueryValue(req.query.sortBy);
  const sortDir: SortDir = firstQueryValue(req.query.sortDir) === "desc" ? "desc" : "asc";
  const filters = parseFilters(req.query.filters);

  const sort = sortBy ? { field: sortBy, dir: sortDir } : config.defaultSort;
  if (sort && !(config.sortable ?? []).includes(sort.field)) {
    throw new AppError(400, `Cannot sort by ${sort.field}`, "INVALID_SORT_FIELD");
  }

  for (const [field, filter] of Object.entries(filters)) {
    const expectedType = config.filterable?.[field];
    if (!expectedType) {
      throw new AppError(400, `Cannot filter by ${field}`, "INVALID_FILTER_FIELD");
    }
    assertFilterShape(field, filter, expectedType);
  }

  return { page, pageSize, q, sort, filters };
}

export function listSortToMongo(sort?: ListSort) {
  if (!sort) return {};
  return { [sort.field]: sort.dir === "asc" ? 1 : -1 } as Record<string, 1 | -1>;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function listSearchToMongo(q: string | undefined, fields: readonly string[] = []) {
  if (!q || fields.length === 0) return {};
  const expression = new RegExp(escapeRegExp(q), "i");
  return { $or: fields.map((field) => ({ [field]: expression })) };
}

export function listFiltersToMongo(filters: ListFilters) {
  const mongoFilters: Record<string, unknown> = {};

  for (const [field, filter] of Object.entries(filters)) {
    if (filter.type === "text" && filter.value.trim()) {
      mongoFilters[field] = new RegExp(escapeRegExp(filter.value.trim()), "i");
    }

    if (filter.type === "select") {
      mongoFilters[field] = Array.isArray(filter.value) ? { $in: filter.value } : filter.value;
    }

    if (filter.type === "dateRange") {
      const range: Record<string, Date> = {};
      if (filter.from) range.$gte = new Date(filter.from);
      if (filter.to) range.$lte = new Date(filter.to);
      if (Object.keys(range).length > 0) mongoFilters[field] = range;
    }

    if (filter.type === "numberRange") {
      const range: Record<string, number> = {};
      if (typeof filter.min === "number") range.$gte = filter.min;
      if (typeof filter.max === "number") range.$lte = filter.max;
      if (Object.keys(range).length > 0) mongoFilters[field] = range;
    }

    if (filter.type === "boolean") {
      mongoFilters[field] = filter.value;
    }
  }

  return mongoFilters;
}

export function combineMongoFilters(...filters: Array<Record<string, unknown>>) {
  const activeFilters = filters.filter((filter) => Object.keys(filter).length > 0);
  if (activeFilters.length === 0) return {};
  if (activeFilters.length === 1) return activeFilters[0];
  return { $and: activeFilters };
}

export function buildPagination(query: Pick<ListQuery, "page" | "pageSize">, total: number): ListPagination {
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  return {
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages,
    hasNextPage: query.page < totalPages,
    hasPreviousPage: query.page > 1,
  };
}

export function buildListEnvelope<T>(data: T[], query: ListQuery, total: number): ListEnvelope<T> {
  return {
    data,
    pagination: buildPagination(query, total),
    meta: {
      q: query.q,
      sort: query.sort,
      filters: query.filters,
    },
  };
}

export function sendList<T>(res: Response, data: T[], query: ListQuery, total: number) {
  return res.json({
    success: true,
    ...buildListEnvelope(data, query, total),
  });
}
