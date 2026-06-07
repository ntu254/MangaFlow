# MangaFlow Interaction States

---

# 1. Hover

Hover should feel soft, not jumpy.

```txt
Cards: slight shadow increase or surface tint
Buttons: slightly deeper primary
Rows: soft purple background tint
Icon buttons: surface-high background
```

Do not:

```txt
Change shape on hover
Use harsh scale effects on app screens
Use black overlay hover
```

---

# 2. Active

Active navigation:

```txt
White pill on sidebar
Primary text/icon
Soft shadow or border
```

Active tab:

```txt
Primary underline or pill
No heavy fill unless segmented control
```

---

# 3. Focus

All interactive elements need visible keyboard focus.

```txt
focus-visible:ring-4
focus-visible:ring-primary/20
```

---

# 4. Disabled

Disabled controls:

```txt
Opacity 50–60%
No hover effect
Cursor not-allowed
Clear tooltip/reason when needed
```

Example:

```txt
Create Chapter disabled because Series is not Board-approved.
```

---

# 5. Loading

Use skeletons for content blocks.

Rules:

```txt
Button action → spinner inside MFButton
Card lists → skeleton rows
Page load → section skeletons
AI processing → progress/processing panel
```

---

# 6. Empty

Every major list should include empty state:

```txt
Icon
Title
Short explanation
Optional CTA
```

---

# 7. Error

Error state must be recoverable:

```txt
Explain what failed.
Offer Retry or Back.
Do not show raw stack trace.
```

---

# 8. Confirmation

Use confirmation dialog for:

```txt
Reject submission
Cancel series
Deactivate task type
Remove member
Delete page/file
Publish chapter
```

---

# 9. Toasts

Use toast for short feedback:

```txt
Task assigned.
Submission approved.
Comment resolved.
Ranking imported.
```

Do not use toast as the only place for critical state.
