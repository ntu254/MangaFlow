# MangaFlow Design System

**MangaFlow does not redesign from scratch.**
The goal is to professionalize the existing light SaaS dashboard style, unify tokens/components, and extend the visual system consistently across roles.

## 1. Visual Direction
- **Mangaka**: Production Hub, ownership, series workflow
- **Assistant**: Focused Task Studio, low noise, high speed
- **Editor**: Review queue, quality gate, decision clarity
- **Board**: Ranking report, decision dashboard
- **Admin**: SaaS admin, data table, config

## 2. Color Palette
Primary color is firmly set to Violet. We avoid `indigo-*` for primary actions to maintain consistency.

- **Primary**: `violet-600` (Main actions, workflow progress)
- **Primary Hover**: `violet-700`
- **Primary Soft**: `violet-50` / `violet-100`
- **Focus Ring**: `violet-500` / `violet-600`
- **Neutral**: `slate` scale (`slate-50` to `slate-900`) for text, backgrounds, borders.
- **Surface**: `white` for cards and popovers.

### Semantic Status Colors
- **Success/Completed**: `emerald`
- **Risk/Error/Blocked**: `red`
- **Editor/Review**: `purple`
- **Board/Ranking**: `amber` / `orange`
- **AI Features**: `fuchsia`
- **Task/Action**: `blue`

## 3. Typography
- **Font Family**: `Outfit` (used globally for consistency)
- **Usage**:
  - Headings: 600–700 weight
  - Body/UI: 400–500 weight
  - Small metadata: 500 weight
  - Numeric/stat values: `tabular-nums` when needed for alignment

## 4. Component Patterns
- **Layout Shell**: Bento grid layouts with standard gaps.
- **Cards**:
  - `Card` / `Surface`: Static container (`bg-white border-slate-200 shadow-sm`). Does **not** have hover effects to avoid feeling clickable.
  - `InteractiveCard`: Clickable container. Includes `hover:shadow-md hover:-translate-y-[2px] hover:border-violet-300` and focus rings.
- **Status Badges**: Soft background (`bg-{color}-50`), distinct text (`text-{color}-700`), and border (`border-{color}-200`).

## 5. Layout System

MangaFlow uses a **hybrid collapsible shell**, not one rigid layout. Roles have
different intents, so the shell adapts while the chrome rules stay constant.

### Chrome rules (single source of truth)
| Layer | Responsibility | Must NOT hold |
|---|---|---|
| **Sidebar** (`AppSidebar`) | Role/module navigation. Modes: `expanded` / `rail` / `hidden`. | Flow logic of an entity |
| **Top Navbar** (`AppNavbar`) | Global utility: search, notifications, settings, account. | Page/entity title |
| **Context Header** (`ContextHeader`) | Current entity: title, breadcrumb, status, actions. | — |
| **Context Tabs** | Flow inside the entity (route-based, deep-linkable). | — |
| **Studio/Review** | May force sidebar `hidden` + `bleed` for focus. | — |

Default sidebar by role (`uiStore.DEFAULT_SIDEBAR_BY_ROLE`): Admin `expanded`,
Mangaka/Assistant `rail`, Editor/Board `expanded`. Studio pages force `hidden`.

### Backbone layouts (`shared/components/layout/`)
- **App Shell + Context Tabs** — Mangaka/Series flow (`SeriesHubLayout`).
- **Master–Detail** (`MasterDetailLayout`) — review/approval queues (Editor).
- **Canvas Workspace** (`CanvasWorkspaceLayout`) — Page Studio / Task Studio.
- **Bento** (`BentoGrid` + `BentoCard`) — role dashboards.

### How a page declares its chrome
Pages call `usePageChrome({ contextHeader, tabs, sidebar, bleed }, deps)`. The
shell renders the header/tabs and applies sidebar/bleed. No hardcoded per-route
switch in the navbar.

### Area → layout mapping
| Area | Layout |
|---|---|
| Login | Split Screen |
| Role Dashboard | Bento |
| Series Production Hub | App Shell + Context Tabs |
| Series/Chapter list | List + Inspector Drawer |
| Pages | Grid |
| Page Studio / Task Studio | Canvas Workspace (focus) |
| Mangaka / Editor Review | Master–Detail (+ Comparison for Editor) |
| Board Ranking | Report Dashboard + Table |
| Admin | Table + Command Bar |
| Notifications / Audit Log | Inbox / Master–Detail + Inspector |

