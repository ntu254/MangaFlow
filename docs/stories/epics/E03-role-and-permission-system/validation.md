# Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id <id> --unit 1 --integration 1 --e2e 0 --platform 0`.

| Layer | Expected proof |
| --- | --- |
| Unit | No logic complex enough for isolated units. |
| Integration | Manual endpoint testing via Postman / Typechecking. |
| E2E | Ensure unauthorized roles see the `RoleGuard` Access Denied screen. |
| Platform | Not required. |
| Release | Verify Mangakas can still access their Series. |
