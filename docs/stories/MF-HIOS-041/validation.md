# Validation

## Proof Strategy

Client build proves type-safe wiring; server tests ensure Board backend remains green.

## Commands

```bash
npm run build
npm run test --prefix server
```

## Acceptance Evidence

- `npm run build`: passed
- `npm run test --prefix server`: passed, 16 files / 74 tests
