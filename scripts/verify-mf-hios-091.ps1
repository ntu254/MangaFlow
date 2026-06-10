param()

$ErrorActionPreference = "Stop"

npm run lint --prefix server
npm run build --prefix server
npm run test --prefix server -- series
npm run lint --prefix client
npm run build --prefix client

Write-Host "MF-HIOS-091 verification passed"

