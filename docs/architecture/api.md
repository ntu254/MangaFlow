# API Architecture

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
