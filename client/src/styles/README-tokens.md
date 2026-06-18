# MangaFlow Design Tokens

Single source of truth: `globals.css`. Tokens are CSS variables mapped into
Tailwind v4 `@theme`, with light values in `:root` and dark overrides in `.dark`
(dark UI not yet enabled — token-ready only).

## Rule
- Use **semantic tokens**, never hardcoded scales:
  - `bg-background` / `text-foreground` / `border-border`
  - `bg-primary` / `text-primary-foreground` (violet)
  - `text-muted-foreground` (slate-500), `bg-muted`, `bg-card`
  - `bg-sidebar` family for the role nav chrome
- ❌ Do not use `gray-*` or `purple-*`. Primary is **violet**, neutral is **slate**.
- Semantic status colors (badges/accents) follow DESIGN.md:
  success=`emerald`, error=`red`, review=`purple`, board=`amber`/`orange`,
  AI=`fuchsia`, task=`blue`. These may use Tailwind scales directly for soft
  badges (`bg-emerald-50 text-emerald-700 border-emerald-200`).

## Layout tokens
| Token | Purpose |
|---|---|
| `--sidebar-width` | expanded sidebar |
| `--sidebar-rail-width` | collapsed icon rail |
| `--navbar-height` | global top navbar |
| `--context-header-height` | entity context header |

Reference via arbitrary values, e.g. `w-[var(--sidebar-width)]`.
