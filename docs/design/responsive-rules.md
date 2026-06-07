# MangaFlow Responsive Rules

---

# 1. Breakpoints

Suggested Tailwind breakpoints:

```txt
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

---

# 2. Desktop

Desktop is primary for production workflow.

Rules:

```txt
Use sidebar + navbar.
Use 12-column grids.
Workspace can use 3-panel layout.
Keep canvas central.
```

---

# 3. Tablet

Tablet layout:

```txt
Sidebar collapses.
Workspace panels become drawers.
Cards become 2-column.
Tables should allow horizontal scroll.
```

---

# 4. Mobile

Mobile supports management/review, not full heavy canvas editing in MVP.

Rules:

```txt
Sidebar becomes drawer.
Navbar compact.
Cards stack.
Workspace shows one panel at a time.
Tables become card lists where possible.
Primary actions remain reachable.
```

---

# 5. Workspace Mobile Rule

For complex workspace screens:

```txt
Assigned Page
Task Detail
Comments
Submission
```

Should be accessible through tabs or bottom segmented controls.

---

# 6. Touch Target

Minimum touch target:

```txt
44px height/width
```

---

# 7. Text Wrapping

Long manga/series/task names must wrap gracefully.

Do not allow overflow outside cards.
