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

