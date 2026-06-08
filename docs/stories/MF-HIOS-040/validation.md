# Validation

## Proof Strategy

Unit tests prove vote summary, finalize plurality, tie handling, and chair-only tie-break.

## Commands

```bash
npm run test --prefix server
npm run build
```

## Acceptance Evidence

- `npm run test --prefix server`: 16 files passed, 74 tests passed.
- `npm run build`: server TypeScript build passed; client TypeScript + Vite build passed.
