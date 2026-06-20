# MangaFlow — Architecture (Phase 1, UI mock)

## Routes

```
/                       Marketing landing
/login                  Split-screen login (UI only)

/read/                  Public reader (mocks /api/public/*)
  $slug                 Series page
  $slug/$chapter        Chapter viewer (vertical scroll)

/app                    Console layout (Sidebar + Topbar)
  /dashboard            Per-role home
  /series               Grid list (+ /new, /:id)
  /chapters/:id         Chapter workspace tabs
  /review               Editor review queue
  /board                Board voting
  /tasks                Assistant kanban
  /submissions          Two-round approval list
  /publications         Schedule + publish
  /payroll              Confirm + mark paid
  /rankings             Period leaderboards
  /ai/bubble            AI Bubble Studio (localhost:8000)
  /admin/users          User table (Admin)
  /admin/roles          Permission matrix (Admin)
  /settings             Profile + AI base URL
```

`/app/*` is wrapped by `AppShell` (`src/components/site/AppShell.tsx`), which
provides `ThemeProvider`, `RoleProvider`, `Sidebar`, and `Topbar`. Every page
calls `PageHeader` to keep the title/jp/description block consistent.

## Role demo

`RoleProvider` (in `src/lib/role.tsx`) stores the current role in
`localStorage["mangaflow.role"]`. The Topbar exposes a `RoleSwitcher` so a
demo viewer can flip between Admin / Mangaka / Editor / Assistant / Board
without a login flow. The Sidebar filters items by role; pages themselves
read `useRole()` to swap content (most notably `/app/dashboard` and
`/app/tasks`).
