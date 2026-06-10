$ErrorActionPreference = "Stop"

npm run lint --prefix client
npm run build --prefix client
npm run lint --prefix server
npm run build --prefix server

Write-Host "MF-HIOS-098 verification passed"
