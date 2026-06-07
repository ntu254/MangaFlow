# MangaFlow Accessibility Rules

---

# 1. Keyboard

All interactive elements must be reachable by keyboard.

Required:

```txt
Buttons
Links
Tabs
Dialogs
Dropdowns
Sidebar items
Workspace tool buttons
```

---

# 2. Focus

Use visible focus ring:

```txt
focus-visible:ring-4
focus-visible:ring-primary/20
focus-visible:outline-none
```

---

# 3. ARIA Labels

Icon-only buttons require aria-label.

Examples:

```tsx
<button aria-label="Open notifications">
<button aria-label="Collapse sidebar">
<button aria-label="Run bubble detection">
```

---

# 4. Contrast

Text must be readable on pastel backgrounds.

Rules:

```txt
Main text uses dark text token.
Muted text only for metadata.
Do not use yellow/lime for small text on white.
```

---

# 5. Status Communication

Do not rely on color only.

Status badge must include label:

```txt
APPROVED
REVISION
AT RISK
PENDING
```

---

# 6. Forms

Every input needs:

```txt
Visible label or aria-label
Validation message
Focus state
Error state
```

---

# 7. Motion

Keep motion subtle.

Avoid:

```txt
Large bouncing animations
Continuous distracting animation in workspace
Motion required to understand state
```

---

# 8. Screen Readers

Important state changes should be text-visible and optionally announced via aria-live in future.
