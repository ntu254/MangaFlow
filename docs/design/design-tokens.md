# MangaFlow Design Tokens

> Tokens are the source of truth for MangaFlow UI.

> Tokens apply to the production-only MVP UI and must be reused before any
> feature-specific styling.

---

# 1. Color Tokens

## Core palette

```ts
export const mangaFlowColors = {
  background: "#fef7ff",
  surface: "#fef7ff",
  surfaceLowest: "#ffffff",
  surfaceLow: "#f9f1fb",
  surfaceContainer: "#f3ebf6",
  surfaceHigh: "#ede6f0",
  surfaceHighest: "#e7e0ea",

  text: "#1d1a21",
  textMuted: "#4a4452",
  outline: "#7b7483",
  outlineVariant: "#ccc3d4",

  primary: "#9065d5",
  primaryDeep: "#6f44b2",
  primaryContainer: "#ecdcff",
  primaryContainerDim: "#d5baff",

  secondary: "#e560bc",
  secondaryDeep: "#a52885",
  secondaryContainer: "#ffd8ec",

  tertiary: "#ff7196",
  tertiaryDeep: "#a72d53",
  tertiaryContainer: "#ffd9df",

  coral: "#ff9971",
  yellow: "#ffc95e",
  lime: "#f9f871",

  error: "#ba1a1a",
  errorContainer: "#ffdad6",
}
```

## Usage rules

| Token | Use |
|---|---|
| `background` | App background |
| `surfaceLowest` | Main cards |
| `surfaceLow` | Sidebar / secondary panels |
| `primary` | Main CTA, active states |
| `secondary` | Secondary highlight |
| `tertiary` | Important review/attention accents |
| `coral/yellow/lime` | Tags, soft status accents |
| `text` | Main text |
| `textMuted` | Labels, metadata, placeholders |
| `outlineVariant` | Gentle borders |

---

# 2. Typography Tokens

```ts
export const typography = {
  display: "text-[48px] leading-[56px] font-bold tracking-[-0.02em]",
  displayLg: "text-[56px] leading-[64px] font-bold tracking-[-0.02em]",
  headlineLg: "text-[32px] leading-[40px] font-bold tracking-[-0.01em]",
  headlineMd: "text-[24px] leading-[32px] font-semibold",
  titleLg: "text-[20px] leading-[28px] font-semibold",
  bodyLg: "text-[18px] leading-[28px] font-normal",
  bodyMd: "text-[16px] leading-[24px] font-normal",
  labelMd: "text-[14px] leading-[20px] font-semibold tracking-[0.01em]",
  labelSm: "text-[12px] leading-[16px] font-medium",
}
```

Font family:

```txt
Plus Jakarta Sans
```

---

# 3. Radius Tokens

```ts
export const radius = {
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "2.5rem",
  "3xl": "3rem",
  full: "9999px",
}
```

Usage:

| Token | Use |
|---|---|
| `rounded-full` | Buttons, nav pills, icon buttons |
| `rounded-xl` | Inputs, small cards |
| `rounded-2xl` | Panels |
| `rounded-3xl` | Main bento cards |

---

# 4. Spacing Tokens

4px baseline.

```ts
export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  xxl: "48px",
  containerPadding: "40px",
  gutter: "24px",
}
```

Rules:

```txt
Use 16px inside compact cards.
Use 24px inside normal panels.
Use 32px between major sections.
Use 48px between page-level blocks.
```

---

# 5. Shadow Tokens

```ts
export const shadows = {
  ambient: "0px 10px 30px rgba(144, 101, 213, 0.08)",
  card: "0px 12px 36px rgba(144, 101, 213, 0.10)",
  dropdown: "0px 16px 44px rgba(29, 26, 33, 0.12)",
  focus: "0 0 0 4px rgba(144, 101, 213, 0.16)",
}
```

Rules:

```txt
Do not use harsh black shadow.
Use purple-tinted ambient shadow.
Use shadow sparingly.
```

---

# 6. Tailwind Token Mapping

Suggested `tailwind.config.ts`:

```ts
colors: {
  background: "#fef7ff",
  surface: "#fef7ff",
  "surface-lowest": "#ffffff",
  "surface-low": "#f9f1fb",
  "surface-container": "#f3ebf6",
  "surface-high": "#ede6f0",
  "surface-highest": "#e7e0ea",
  "on-surface": "#1d1a21",
  "on-surface-muted": "#4a4452",
  "outline": "#7b7483",
  "outline-variant": "#ccc3d4",
  primary: "#9065d5",
  "primary-deep": "#6f44b2",
  "primary-container": "#ecdcff",
  secondary: "#e560bc",
  tertiary: "#ff7196",
  coral: "#ff9971",
  yellow: "#ffc95e",
  lime: "#f9f871",
}
```

---

# 7. Status UI Token Rule

Do not hardcode status colors in screens.

Use:

```txt
client/src/shared/lib/status-ui.ts
```

Example:

```ts
export const taskStatusUI = {
  TODO: { label: "To Do", tone: "neutral" },
  IN_PROGRESS: { label: "In Progress", tone: "primary" },
  SUBMITTED: { label: "Submitted", tone: "secondary" },
  REVISION_REQUESTED: { label: "Revision", tone: "warning" },
  EDITOR_APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
}
```
