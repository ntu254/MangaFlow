# API Architecture

The API supports the production-only internal MVP. It exposes production,
review, board, ranking, payroll, AI, notification, and dashboard routes; it
does not expose public catalog, library, reader, or reading-progress routes.

Base URL:

```txt
/api
```

## Core groups

- `/auth`
- `/admin/users`
- `/task-types`
- `/series`
- `/series/:seriesId/members`
- `/manuscripts`
- `/chapters`
- `/pages`
- `/files`
- `/regions`
- `/tasks`
- `/submissions`
- `/comments`
- `/board`
- `/publications`
- `/rankings`
- `/payroll`
- `/ai`
- `/notifications`
- `/dashboard`

## Response format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

## Error format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```
