const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const adminHooksFile = path.join(srcDir, 'hooks/use-admin-queries.ts');

function readFile(p) { return fs.readFileSync(p, 'utf8'); }
function writeFile(p, c) { fs.writeFileSync(p, c, 'utf8'); }

// --- Admin Audit Logs ---
let adminContent = readFile(adminHooksFile);

const auditQueryRegex = /export function useAdminAuditQuery[\s\S]*?^}/m;
const auditMatch = adminContent.match(auditQueryRegex);

if (auditMatch) {
  const auditApiContent = `import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/services";
import { adminKeys, type AuditEntry } from "@/hooks/use-admin-queries";

type AdminQueryOptions = {
  enabled?: boolean;
};

import { isUnauthorizedApiError } from "@/lib/api/client";
function retryAdminQuery(failureCount: number, error: Error) {
  if (isUnauthorizedApiError(error)) return false;
  return failureCount < 2;
}

${auditMatch[0]}
`;
  writeFile(path.join(srcDir, 'features/admin/audit/api/audit.queries.ts'), auditApiContent);
  adminContent = adminContent.replace(auditQueryRegex, `export { useAdminAuditQuery } from "@/features/admin/audit/api/audit.queries";`);
  writeFile(adminHooksFile, adminContent);
  console.log('Hooks split complete.');
}
