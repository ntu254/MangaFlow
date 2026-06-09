# MangaFlow Component System

> MangaFlow uses component-first reusable UI. Feature screens must be composed from shared components before creating feature-specific UI.

> Components support production workflow screens only. Public reader/library UI
> needs a future contract before components are added for it.

---

# 1. Component Layers

```txt
1. UI Primitives
2. Shared Layout Components
3. Shared Feature Components
4. Feature-Specific Components
```

---

# 2. UI Primitives

All screens should use these before creating custom UI:

```txt
MFButton
MFCard
MFBadge
MFIconCircle
MFProgress
MFTabs
MFSection
MFInput
MFSelect
MFTextarea
MFDialog
MFDropdown
MFTable
MFEmptyState
MFLoadingState
MFErrorState
MFUploadBox
MFPagePreviewCard
```

Suggested location:

```txt
client/src/shared/components/ui
```

---

# 3. Shared Layout Components

```txt
MarketingNavbar
MarketingFooter
AppNavbar
RoleSidebar
PageShell
DashboardShell
WorkspaceShell
DetailPageShell
AuthShell
```

Suggested location:

```txt
client/src/shared/components/layout
```

---

# 4. Shared Feature Components

Reusable across features:

```txt
ChapterProgressCard
ActionItemList
TaskStatusBadge
DecisionBadge
AtRiskBadge
ReviewDecisionBar
CommentThread
SubmissionVersionList
PublicationReadinessChecklist
RankingTable
PayrollSummaryCard
AIProcessingPanel
BubbleRegionOverlay
```

Suggested location:

```txt
client/src/shared/components/domain
```

---

# 5. Feature Components

Feature components must compose shared components.

Examples:

```txt
features/series/components/SeriesCard.tsx
features/chapter/components/ChapterPageGrid.tsx
features/task/components/CreateTaskDialog.tsx
features/review/components/SubmissionReviewPanel.tsx
features/board/components/VoteCard.tsx
```

Feature components may contain business-specific layout and data mapping, but should not redefine global visual language.

---

# 5.1 Route Page Composition Rule

Route-level page files should remain thin. A route page should usually handle
only page title setup, hook orchestration, and high-level layout composition.

Split a page when any of these are true:

```txt
The file exceeds roughly 250 lines.
The page has more than four useState calls.
The page calls more than two API surfaces.
The page contains table columns, API mappers, and JSX together.
The page contains multiple domain panels such as queue + decision + readiness.
The page mixes local/sample fallback data with live API data.
The page touches a high-risk boundary such as auth, Assistant access, Board, publication, payroll, or file access.
```

Preferred split order:

```txt
1. Move mappers and table columns to utils/.
2. Move data loading and mutations to hooks/.
3. Move domain panels to components/.
4. Keep the page as layout composition only.
```

Recommended feature shape:

```txt
client/src/features/{feature}/
├── api/
│   ├── {feature}.api.ts
│   ├── {feature}.types.ts
│   └── {feature}.keys.ts        # future TanStack Query convention
├── hooks/
│   ├── use{Feature}PageData.ts
│   └── use{ActionName}.ts
├── components/
│   ├── {Feature}Hero.tsx
│   ├── {Feature}BoundaryCard.tsx
│   ├── {Feature}Table.tsx
│   ├── {Feature}ActionsPanel.tsx
│   └── {Feature}StatePreview.tsx
├── utils/
│   ├── {feature}.mappers.ts
│   └── {feature}.columns.tsx
└── pages/
    └── {Feature}Page.tsx
```

Feature panels should be split by domain responsibility, not by tiny visual
fragments. Prefer `ReviewQueuePanel`, `ChapterReadinessTab`, or
`WorkspaceCanvasPanel` over one-off wrappers such as `TitleText` or
`SmallBadge`.

---

# 6. Required Component Rules

```txt
Do not duplicate button styling.
Do not duplicate card styling.
Do not hardcode badge colors.
Do not create page-only UI if it can be shared.
Do not bypass status-ui.ts.
Do not import raw ShadCN components in feature screens if a MangaFlow wrapper exists.
```

---

# 7. ShadCN Wrapping Rule

ShadCN primitives should be wrapped by MangaFlow components.

Examples:

```txt
Button → MFButton
Card → MFCard
Badge → MFBadge
Dialog → MFDialog
Tabs → MFTabs
Progress → MFProgress
Input → MFInput
```

Why:

```txt
Keeps radius, color, spacing, focus, loading, disabled states consistent.
```

---

# 8. Component Prop Rules

All shared components must use TypeScript props.

Example:

```ts
type MFButtonProps = {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  loading?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>
```

---

# 9. Naming Rules

```txt
MF* = primitive/shared visual component
*Card = card-based domain component
*Panel = right/side panel
*Dialog = modal workflow
*Shell = layout wrapper
*Badge = status/label display
*List = collection display
```

---

# 10. Anti-Duplication Rule

Before creating a new component, check:

```txt
1. Can MFButton/MFCard/MFBadge solve it?
2. Can existing domain component be reused?
3. Can this be a variant instead of new component?
4. Is business logic separated from visual primitive?
```

---

# 11. Folder Structure

```txt
client/src/shared/components/
├── ui/
│   ├── MFButton.tsx
│   ├── MFCard.tsx
│   ├── MFBadge.tsx
│   ├── MFProgress.tsx
│   ├── MFTabs.tsx
│   ├── MFUploadBox.tsx
│   └── MFPagePreviewCard.tsx
│
├── layout/
│   ├── AppNavbar.tsx
│   ├── RoleSidebar.tsx
│   ├── PageShell.tsx
│   ├── WorkspaceShell.tsx
│   └── MarketingNavbar.tsx
│
└── domain/
    ├── ChapterProgressCard.tsx
    ├── ActionItemList.tsx
    ├── TaskStatusBadge.tsx
    ├── ReviewDecisionBar.tsx
    ├── PublicationReadinessChecklist.tsx
    └── RankingTable.tsx
```

---

# 12. Definition of Component Done

A shared component is done only when:

```txt
[ ] Has typed props
[ ] Uses cn() for class composition
[ ] Uses design tokens
[ ] Supports disabled state when interactive
[ ] Supports focus-visible state
[ ] Supports loading state if action component
[ ] Works in mobile width
[ ] Has examples in docs or Storybook/future preview
[ ] No feature business logic inside primitive
```
