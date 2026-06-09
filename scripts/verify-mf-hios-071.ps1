npm run lint --prefix server
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run build --prefix server
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run test --prefix server -- submission comment task chapter publication board ranking dashboard accessPolicy env
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run lint --prefix client
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run build --prefix client
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
python scripts/verify-product-contract-scope.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
python scripts/verify-architecture-docs.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
python scripts/verify-ui-design-system.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
