const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const adminHooksFile = path.join(srcDir, 'hooks/use-admin-queries.ts');
const boardHooksFile = path.join(srcDir, 'hooks/use-board-queries.ts');

function readFile(p) { return fs.readFileSync(p, 'utf8'); }
function writeFile(p, c) { fs.writeFileSync(p, c, 'utf8'); }

// --- Admin Storage ---
let adminContent = readFile(adminHooksFile);

const storageSummaryRegex = /export function useAdminStorageSummaryQuery[\s\S]*?^}/m;
const storageMatch = adminContent.match(storageSummaryRegex);

if (storageMatch) {
  const storageApiContent = `import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/services";
import { adminKeys } from "@/hooks/use-admin-queries";

${storageMatch[0]}
`;
  writeFile(path.join(srcDir, 'features/admin/storage/api/storage.queries.ts'), storageApiContent);
  adminContent = adminContent.replace(storageSummaryRegex, `export { useAdminStorageSummaryQuery } from "@/features/admin/storage/api/storage.queries";`);
  writeFile(adminHooksFile, adminContent);
}

// --- Board Sessions ---
let boardContent = readFile(boardHooksFile);

const sessionHooks = [
  /export function useVotingSessionsQuery[\s\S]*?^}/m,
  /export function useCreateVotingSessionMutation[\s\S]*?^}/m,
  /export function useAddVotingSessionNoteMutation[\s\S]*?^}/m,
  /export function useCancelVotingSessionMutation[\s\S]*?^}/m,
  /export function useCloseVotingSessionMutation[\s\S]*?^}/m,
  /export function useVotingSessionQuery[\s\S]*?^}/m,
];

let sessionsApiContent = `import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { boardApi } from "@/lib/api/services";
import { apiRequest } from "@/lib/api/client";
import { boardKeys, type VotingSession } from "@/hooks/use-board-queries";

`;

let hasSessionHooks = false;

for (const hookRegex of sessionHooks) {
  const match = boardContent.match(hookRegex);
  if (match) {
    sessionsApiContent += match[0] + "\n\n";
    // Get the name of the function
    const fnNameMatch = match[0].match(/export function (\w+)/);
    if (fnNameMatch) {
      boardContent = boardContent.replace(hookRegex, `export { ${fnNameMatch[1]} } from "@/features/board/sessions/api/sessions.queries";`);
      hasSessionHooks = true;
    }
  }
}

if (hasSessionHooks) {
  writeFile(path.join(srcDir, 'features/board/sessions/api/sessions.queries.ts'), sessionsApiContent);
  writeFile(boardHooksFile, boardContent);
}

console.log('Hooks split complete.');
