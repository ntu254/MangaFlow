# MangaFlow Layout Patterns

---

# 1. App Shell

All authenticated screens use the same shell:

```txt
RoleSidebar + AppNavbar + Main Content
```

Rules:

```txt
Sidebar is role-based.
Navbar contains search, notification bell, user menu.
Do not duplicate profile navigation if user menu already has profile.
Logout can live in user menu or bottom sidebar.
```

---

# 2. PageShell Pattern

Use `PageShell` for normal screens.

```tsx
<PageShell
  title="My Series"
  description="Manage your manga series and manuscripts."
  actions={<MFButton>Create Series</MFButton>}
>
  ...
</PageShell>
```

Rules:

```txt
Title top-left.
Primary action top-right.
Description under title.
Content below with 32px gap.
```

---

# 3. Bento Dashboard Pattern

Use bento cards for dashboard.

```txt
KPI Cards
Recent Activity
Pending Actions
Progress Cards
Quick Actions
```

Layout:

```txt
Desktop: 12-column grid
Tablet: 2-column grid
Mobile: 1-column stack
```

---

# 4. Workspace Pattern

Workspace screens use:

```txt
Left Panel: page/task/context list
Center Canvas: page preview / work area
Right Panel: details / comments / actions
```

Rules:

```txt
Left and right panels are collapsible.
Center canvas is the focus.
Use soft surface panels.
Avoid vertical overflow that hides key actions.
```

---

# 5. Detail Page Pattern

Used for Series, Chapter, Task, Submission.

```txt
Header summary card
Tabs or sections
Main content grid
Right metadata/actions panel
```

---

# 6. Marketing Page Pattern

Marketing pages use:

```txt
Floating pill navbar
Hero section
Workspace preview mockup
Pipeline section
Role views section
Footer
```

Rules:

```txt
Marketing can be more spacious.
Still no heavy dark theme.
Use same tokens and components.
```

---

# 7. Table Pattern

Use table only when data comparison is needed.

Rules:

```txt
Use white card wrapper.
Use sticky header for large tables.
Use badges for status.
Use row hover with soft purple tint.
Avoid dense enterprise table spacing.
```
