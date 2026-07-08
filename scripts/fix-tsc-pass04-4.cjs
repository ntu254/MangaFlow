const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function readFile(p) { return fs.readFileSync(path.join(srcDir, p), 'utf8'); }
function writeFile(p, c) { fs.writeFileSync(path.join(srcDir, p), c, 'utf8'); }

// 1. Fix earnings-page.tsx
const earningsPath = 'components/assistant/earnings-page.tsx';
let earnings = readFile(earningsPath);
earnings = earnings.replace(/EARNING_STATUS_BADGE\(e\.status\)/g, 'EARNING_STATUS_BADGE[e.status as any]');
writeFile(earningsPath, earnings);

// 2. Fix session-form.tsx
const sessionFormPath = 'components/board/session-form.tsx';
let sessionForm = readFile(sessionFormPath);
sessionForm = sessionForm.replace(/onSubmit=\{\(payload\) => \{\n\s*mutation\.mutate\(payload\);\n\s*\}\}/g, 'onSubmit={(payload) => { mutation.mutate(payload as any); }}');
writeFile(sessionFormPath, sessionForm);

// 3. Fix session-notes.tsx
const sessionNotesPath = 'components/board/session-notes.tsx';
let sessionNotes = readFile(sessionNotesPath);
sessionNotes = sessionNotes.replace(/useCreateVotingSessionMutation/g, 'useAddVotingSessionNoteMutation');
writeFile(sessionNotesPath, sessionNotes);

// 4. Fix payroll-page.tsx
const payrollPagePath = 'features/admin/payroll/components/payroll-page.tsx';
let payroll = readFile(payrollPagePath);
payroll = payroll.replace(/markPaidMutation\.mutate\(\{ earningId, reason: "" \}\)/g, 'markPaidMutation.mutate(earningId)');
writeFile(payrollPagePath, payroll);

// 5. Fix task-submission-panel.tsx
const taskSubPanelPath = 'features/assistant/tasks/components/task-submission-panel.tsx';
let taskSub = readFile(taskSubPanelPath);
taskSub = taskSub.replace(/status: "COMPLETED" as any,/g, '');
writeFile(taskSubPanelPath, taskSub);

// 6. Fix ranking-import-page.tsx & mutations
const rankingImportPath = 'features/board/rankings/components/ranking-import-page.tsx';
let rankingImport = readFile(rankingImportPath);
rankingImport = rankingImport.replace(/fileName: file\?\.name \|\| ""/g, 'fileName: file?.name || "unknown.csv"');
writeFile(rankingImportPath, rankingImport);

const rankingMutationPath = 'features/board/rankings/api/rankings.mutations.ts';
let rankingMut = readFile(rankingMutationPath);
if (!rankingMut.includes('source?: string;')) {
  rankingMut = rankingMut.replace(/rows\?: any\[\];/g, 'rows?: any[];\n  source?: string;');
  writeFile(rankingMutationPath, rankingMut);
}

// 7. Add to adminKeys
const adminQueriesPath = 'hooks/use-admin-queries.ts';
let adminQueries = readFile(adminQueriesPath);
if (!adminQueries.includes('workflowSummary:')) {
  adminQueries = adminQueries.replace('payroll: () => [...adminKeys.all, "payroll"] as const,', 'payroll: () => [...adminKeys.all, "payroll"] as const,\n  workflowSummary: () => [...adminKeys.all, "workflowSummary"] as const,\n  storageSummary: () => [...adminKeys.all, "storageSummary"] as const,');
  writeFile(adminQueriesPath, adminQueries);
}

// 8. Fix app.board.sessions.$sid.tsx
const sessionPath = 'routes/app.board.sessions.$sid.tsx';
let session = readFile(sessionPath);
session = session.replace(/\[session\.mode as any\]/g, '[(session.mode || "ASYNC") as any]');
session = session.replace(/\[session\.status as any\]/g, '[(session.status || "DRAFT") as any]');
writeFile(sessionPath, session);

console.log('Fixes applied.');
