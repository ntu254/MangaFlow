# MangaFlow API Contract

## Response envelopes

All successful responses use:

```ts
type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
};
```

All errors use:

```ts
type ApiError = {
  success: false;
  data: null;
  message: string;
  code: string;
  requestId?: string;
};
```

Authorization semantics:

- Read outside the actor scope returns `404`.
- Write outside the actor scope returns `403`.
- Frontend role gating must match backend guards but never replace them.

## List query contract

All list endpoints accept the same query shape:

```ts
type ListQuery = {
  page: number;
  pageSize: number;
  q?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  filters?: Record<string, ColumnFilter>;
};
```

`filters` is encoded as JSON in the URL. Supported filter kinds:

- `text`
- `select`
- `dateRange`
- `numberRange`
- `boolean`

All list responses return:

```ts
type ListResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  meta: {
    q?: string;
    sort?: { field: string; dir: "asc" | "desc" };
    filters: Record<string, ColumnFilter>;
  };
};
```

## Workflow command rule

Mutation endpoints should be named workflow commands. Do not expose generic
patches that allow clients to directly mutate lifecycle/status/publication
fields.
