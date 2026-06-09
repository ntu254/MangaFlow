param()

$ErrorActionPreference = "Stop"

npm run lint --prefix client
npm run build --prefix client

Write-Host "MF-HIOS-084 verification passed"
