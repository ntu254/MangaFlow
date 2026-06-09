# Validation

```powershell
npm run lint --prefix server
npm run build --prefix server
npm run test --prefix server -- admin auth
npm run lint --prefix client
npm run build --prefix client
powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-090.ps1
scripts/bin/harness-cli.exe story verify MF-HIOS-090
```

Manual QA:

- Admin loads `/app/admin/board-members`.
- Admin adds active `BOARD` user as member.
- Admin assigns chair.
- Admin deactivates/reactivates member.
- UI copy does not imply Admin can vote/finalize Board decisions.
