# Validation

Required commands:

```powershell
npm run lint --prefix server
npm run build --prefix server
npm run test --prefix server -- admin auth
npm run lint --prefix client
npm run build --prefix client
powershell -ExecutionPolicy Bypass -File scripts/verify-mf-hios-089.ps1
scripts/bin/harness-cli.exe story verify MF-HIOS-089
```

Manual QA:

- Admin opens `/app/admin/users` and sees backend-loaded users.
- Admin creates a user.
- Admin changes a user's role.
- Admin suspends and reactivates a user.
- Admin cannot suspend own account; backend returns an error.
