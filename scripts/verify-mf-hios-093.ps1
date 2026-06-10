$ErrorActionPreference = "Stop"

npm run lint --prefix server
npm run build --prefix server
npm run test --prefix server -- task
npm run lint --prefix client
npm run build --prefix client

Write-Host "MF-HIOS-093 verification passed"
