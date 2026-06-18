# Frontend Layout Playbook

How to migrate a screen to the redesigned shell. Foundation lives in
`client/src/shared/components/layout/` and `client/src/styles/globals.css`.

## Golden rules
1. **Tokens, not raw scales.** Use `bg-background / text-foreground / border-border /
   bg-primary / text-muted-foreground / bg-card`. Never `gray-*` or `purple-*`.
   (Semantic status colors — emerald/red/amber/fuchsia/blue and `purple` for
   review — may use Tailwind scales for soft badges.)
2. **Chrome belongs to the shell.** Title/status/actions/tabs go through
   `usePageChrome`, never a hardcoded switch in the navbar.
3. **Sidebar = role nav only.** Flow logic lives in Context Tabs.

## Recipe by layout

### Bento dashboard
```tsx
usePageChrome({ contextHeader: { title: 'Home', breadcrumb: 'Production Hub' } })
return (
  <BentoGrid>
    <BentoCard colSpan={8}>...</BentoCard>
    <BentoCard colSpan={4}>...</BentoCard>
  </BentoGrid>
)
```
Reference: `app/mangaka/DashboardPage.tsx`.

### App Shell + Context Tabs (entity hub)
Make the page a **layout** that loads the entity, declares `contextHeader` + `tabs`
(route links), and renders `<Outlet context={...} />`. Add nested routes; redirect
index to the first tab. Child routes read data via `useOutletContext`.
Reference: `app/mangaka/SeriesDetailPage.tsx` + `app/mangaka/series-tabs.tsx` + router.

### Master–Detail (queues / review / inbox / audit)
```tsx
usePageChrome({ bleed: true, contextHeader: { title: 'Review Queue' } })
return <MasterDetailLayout list={<List/>} detail={<Detail/>} hasSelection={!!sel} />
```
Keep the data hooks unchanged; the detail pane just calls the existing
`use*SeriesReview` / action hooks. Reference: `app/editor/ReviewQueuePage.tsx`.

### Canvas Workspace (Studio)
```tsx
usePageChrome({ sidebar: 'hidden', bleed: true })
return <CanvasWorkspaceLayout toolbar={...} inspector={...}>{canvas}</CanvasWorkspaceLayout>
```
Root element should be `h-full` (no `-m-6`, no `calc(100vh-64px)`).
Reference: `app/mangaka/PageStudioPage.tsx`, `app/assistant/TaskStudioPage.tsx`.

### Admin (Table + Command Bar)
Use `CommandBar` (search/filters/actions) above `Table` primitives.
Sidebar stays `expanded` (role default).

## Remaining screens to migrate (GĐ2+)
Admin Users/Board-Members/Task-Types/Audit · Assistant dashboard ·
Editor dashboard + per-page submission review (Comparison) · Board
dashboard/ranking/voting · Notifications · Mangaka Review/Task Review ·
Series list (Inspector Drawer) · Login (already Split Screen — token cleanup only).

## Checklist per screen
- [ ] `usePageChrome` set (header/tabs/sidebar/bleed)
- [ ] No `gray-*` / `purple-*` left (`rg "(gray|purple)-[0-9]" <file>`)
- [ ] In-page duplicate title/PageHeader removed (now in Context Header)
- [ ] `npx tsc --noEmit` clean
- [ ] Verified in browser for the role (golden path)

## Decided migration: TaskTypesPage (`app/admin/TaskTypesPage.tsx`)
**Direction = Admin canonical Table + CommandBar + Sheet Drawer, not card grid.**
The current page renders a `ConfigCard` grid with stubbed `console.log` actions; a
wired `TaskTypesTable` + Create/Edit dialogs + CRUD hooks already exist and just
need to be assembled under the canonical pattern (reference: `EarningsPage`).

Foundation fixes to land BEFORE the UI migration:
- [ ] Normalize TaskType id shape across list vs mutations — list uses `.lean()`
      (returns `_id`), mutations return `id`. Pick one (map in repo list, or accept
      both client-side). Same bug class as the Earnings populate fix.
- [ ] Add `code` to the client `AdminTaskType` type and to the Create/Edit dialogs —
      server `code` is required + unique, so create currently fails without it.
- [ ] Extend client type for `currency`, `allowRegionTask`, `allowPageTask`,
      `requiresFileSubmission`, `requiresTextSubmission`, `sortOrder`.
- [ ] Handle delete 409 soft-deactivate ("Task type is in use and was deactivated
      instead") as an info/success state with query invalidate, not a generic error.
- [ ] Remove or defer the DangerZone "Archive unused" action — no real usage API.
- [ ] Remove placeholder stat cards (or convert to a real, token-clean summary only).

Table columns: Task Type (name + code) · Description · Base Rate (currency) ·
Status · Updated At · Actions.

Drawer (Sheet): header name/status/code · config block · capabilities chips ·
timeline · reference ids (metadata) · footer actions (Edit / Activate-Deactivate /
Delete).

**HOLD** until Mongo dev DB is up and the smoke test passes
(`docs/verification/redesign-smoke-test.md`).
