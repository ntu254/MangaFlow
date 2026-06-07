# UI Review Checklist

Before a UI story is complete, check:

```txt
[ ] Screen matches Clean Pastel Creative SaaS vibe
[ ] Light theme is default
[ ] Background uses pastel surface
[ ] Cards use white or surface-container-lowest
[ ] Buttons use MFButton
[ ] Cards use MFCard
[ ] Badges use MFBadge or StatusBadge
[ ] Status colors map from status-ui.ts
[ ] Radius uses rounded-xl / rounded-3xl / rounded-full
[ ] Shadow uses ambient/card/dropdown shadow
[ ] Spacing follows 4px baseline
[ ] Typography uses Plus Jakarta Sans
[ ] Empty state exists
[ ] Loading state exists
[ ] Error state exists
[ ] Mobile layout works
[ ] No one-off component styling
[ ] Feature UI is reusable where possible
[ ] Feature screens compose shared components
[ ] ShadCN primitives are wrapped when shared equivalent exists
[ ] Navigation/sidebar behavior is not duplicated
[ ] Icon-only buttons have aria-label
[ ] Keyboard focus is visible
[ ] Dangerous actions have confirmation
```

---

# Quick Scoring

| Score | Meaning |
|---|---|
| 50% | Looks okay but inconsistent |
| 70% | Uses tokens and shared components |
| 85% | Has states, responsive behavior, contracts |
| 100% | Agent can extend UI without guessing |

---

# UI Story Done Definition

A UI story is complete only when:

```txt
npm run build passes
Relevant tests pass
UI review checklist passes
No one-off components were introduced unnecessarily
Screen follows the correct UI contract
```
