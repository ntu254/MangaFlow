# MangaFlow UI Style Guide

> Contract scope: all MangaFlow frontend screens, shared UI components, marketing pages, workspace screens, dashboard screens, and feature-specific UI.

> MVP boundary: production-only internal studio workflows. Public catalog,
> personal library, chapter reader, and end-user reading-progress UI are out of
> scope.

---

# 1. Direction

MangaFlow uses a **Clean Pastel Creative SaaS** visual direction.

```txt
Clean Pastel Creative SaaS
Minimalism + Tactile Softness
Light theme only
Rounded bento layout
Reusable component-first development
Feature screens composed from shared components
```

The product should feel like a calm creative studio for manga production, not a dark developer tool or gray enterprise dashboard.

---

# 2. Visual Mood

MangaFlow UI should feel:

```txt
soft
creative
calm
modern
friendly
studio-like
manga-production focused
organized but playful
```

It should not feel:

```txt
enterprise-gray
dark-heavy
over-gradient
sharp-cornered
dashboard-template-like
random per feature
```

---

# 3. Core Surface Style

Use:

```txt
Pastel app background
White / near-white bento cards
Rounded 2xl / 3xl containers
Rounded-full buttons
Soft purple ambient shadow
Gentle borders
Clear whitespace
```

Avoid:

```txt
Hard black shadows
Square enterprise panels
Default browser-looking inputs
Dense tables without spacing
One-off colors
Heavy gradients
Dark theme as default
```

---

# 4. Typography

Use **Plus Jakarta Sans** across the app.

Typography should be:

```txt
clean
readable
modern
friendly
well-spaced
```

Text hierarchy:

```txt
Display / Page Hero: bold, large, tight letter spacing
Section heading: semibold/bold
Body: regular, high line-height
Labels: medium/semibold
Metadata: muted text color
```

---

# 5. Core Visual Rules

## Do

```txt
Use white cards on pastel background
Use soft purple shadow
Use pill navigation
Use rounded bento cards
Use consistent status badges
Use reusable components
Use design tokens
Use clear spacing
Use role-based layouts consistently
```

## Do not

```txt
Do not create one-off styles
Do not use harsh black shadows
Do not use dark theme as default
Do not use heavy gradients
Do not use square enterprise panels
Do not hardcode status colors inside feature screens
Do not duplicate navbar/sidebar logic per role
Do not bypass MangaFlow shared components
```

---

# 6. Design Inspiration Mapping

The landing style should map into product UI like this:

| Landing Pattern | App Equivalent |
|---|---|
| Floating pill navbar | AppNavbar with soft surface and rounded controls |
| Hero workspace preview | Dashboard preview cards and workspace summary cards |
| Creative pipeline | Workflow status stepper |
| Role tabs | Role-based tabs / segmented controls |
| Large white role card | Bento cards for dashboards and detail pages |
| Upload draft box | MFUploadBox |
| Action items list | TaskQueue / ActionItemList |
| Progress bar | MFProgress / ChapterProgressCard |

---

# 7. Global UI Invariant

Every screen must look like it belongs to the same product.

```txt
Same tokens
Same radius
Same shadow
Same button style
Same card style
Same badge style
Same navigation style
Same spacing rhythm
```
