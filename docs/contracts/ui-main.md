# UI Contract: MangaFlow Main UI System

## Purpose

This contract defines the shared UI rules for MangaFlow.

All new screens must follow the MangaFlow visual direction:

```txt
Clean Pastel Creative SaaS
Minimalism + Tactile Softness
Light theme only
Reusable component-first development
Feature screens composed from shared components
```

---

# Source Docs

- `../design/ui-style-guide.md`
- `../design/design-tokens.md`
- `../design/component-system.md`
- `../design/layout-patterns.md`
- `../design/ui-do-dont.md`
- `../validation/ui-review-checklist.md`

---

# Visual Mood

MangaFlow UI should feel like:

```txt
soft creative studio
pastel SaaS
rounded bento layout
clean manga production dashboard
calm but playful workspace
```

---

# Global Rules

```txt
Use light theme as the default.
Use pastel background.
Use white or near-white bento cards.
Use soft purple ambient shadows.
Use rounded pill navigation.
Use rounded-full buttons.
Use Plus Jakarta Sans.
Use shared components before creating feature-specific UI.
Do not create one-off button, card, badge, navbar, or sidebar styles.
```

---

# Do Not

```txt
Do not use dark theme as default.
Do not use heavy gradients.
Do not use harsh black shadows.
Do not use square enterprise cards.
Do not hardcode status colors inside screens.
Do not duplicate navbar/sidebar logic per role.
Do not bypass MFButton, MFCard, MFBadge, or MFProgress.
```

---

# Required Shared Components

All new screens should be built from:

```txt
MFButton
MFCard
MFBadge
MFIconCircle
MFProgress
MFTabs
MFSection
MFPagePreviewCard
MFUploadBox
MarketingNavbar
AppNavbar
RoleSidebar
PageShell
```

---

# Required Implementation Rules

```txt
All components use TypeScript props.
Shared UI components live under client/src/shared/components/ui.
Feature components live under client/src/features/{feature}/components.
Use cn() for class composition.
Use Tailwind tokens, not raw colors.
Wrap ShadCN primitives with MangaFlow components before use.
Status UI must map through status-ui.ts.
```

---

# Validation

A UI story is done only when:

```txt
The screen uses shared components.
Colors come from design tokens.
Buttons use MFButton.
Cards use MFCard.
Badges use MFBadge or StatusBadge.
Spacing follows the 4px baseline.
Radius follows the MangaFlow radius scale.
Shadow uses ambient/card/dropdown shadow.
Empty/loading/error states exist.
Mobile layout does not break.
UI review checklist passes.
```

---

# Verify Command

```bash
npm test
npm run build
```
