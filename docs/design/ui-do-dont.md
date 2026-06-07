# MangaFlow UI Do / Don't

---

# Do

```txt
Use Clean Pastel Creative SaaS style.
Use light theme.
Use Plus Jakarta Sans.
Use white bento cards.
Use large radius.
Use soft purple ambient shadow.
Use MFButton for buttons.
Use MFCard for cards.
Use MFBadge/StatusBadge for statuses.
Use status-ui.ts for status color mapping.
Use shared layout components.
Use empty/loading/error states.
Use responsive layouts.
```

---

# Don't

```txt
Do not use dark theme as default.
Do not use heavy gradients.
Do not use harsh black shadows.
Do not use square enterprise cards.
Do not hardcode status colors inside screens.
Do not duplicate navbar/sidebar per feature.
Do not create one-off button/card/badge styles.
Do not use random icon sizes.
Do not make dense cramped dashboards.
Do not hide critical workflow actions.
```

---

# Bad Example

```tsx
<button className="bg-blue-600 rounded-md shadow-xl">
  Approve
</button>
```

Why bad:

```txt
Wrong color
Wrong radius
Wrong shadow
Bypasses MFButton
```

---

# Good Example

```tsx
<MFButton variant="primary" iconRight={<ArrowRight />}>
  Approve
</MFButton>
```
