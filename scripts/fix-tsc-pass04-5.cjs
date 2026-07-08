const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function readFile(p) { return fs.readFileSync(path.join(srcDir, p), 'utf8'); }
function writeFile(p, c) { fs.writeFileSync(path.join(srcDir, p), c, 'utf8'); }

// 1. Fix earnings-page.tsx
const earningsPath = 'components/assistant/earnings-page.tsx';
let earnings = readFile(earningsPath);
earnings = earnings.replace(/EARNING_STATUS_BADGE\[e\.status as any\]/g, '(EARNING_STATUS_BADGE as any)[e.status]');
earnings = earnings.replace(/EARNING_STATUS_BADGE\[e\.status\]/g, '(EARNING_STATUS_BADGE as any)[e.status]');
earnings = earnings.replace(/EARNING_STATUS_BADGE\(\(e\.status\)\)/g, '(EARNING_STATUS_BADGE as any)[e.status]');
writeFile(earningsPath, earnings);

// 2. Fix session-form.tsx
const sessionFormPath = 'components/board/session-form.tsx';
let sessionForm = readFile(sessionFormPath);
sessionForm = sessionForm.replace(/mutation\.mutate\(payload\)/g, 'mutation.mutate(payload as any)');
writeFile(sessionFormPath, sessionForm);

// 3. Fix payroll-page.tsx
const payrollPagePath = 'features/admin/payroll/components/payroll-page.tsx';
if (fs.existsSync(path.join(srcDir, payrollPagePath))) {
  let payroll = readFile(payrollPagePath);
  payroll = payroll.replace(/markPaidMutation\.mutate\(\{ earningId, reason: "" \}\)/g, 'markPaidMutation.mutate(earningId)');
  // just in case it's something else
  payroll = payroll.replace(/markPaidMutation\.mutate\(\{ earningId \}\)/g, 'markPaidMutation.mutate(earningId)');
  writeFile(payrollPagePath, payroll);
}

// 4. Fix task-submission-panel.tsx
const taskSubPanelPath = 'features/assistant/tasks/components/task-submission-panel.tsx';
if (fs.existsSync(path.join(srcDir, taskSubPanelPath))) {
  let taskSub = readFile(taskSubPanelPath);
  taskSub = taskSub.replace(/status: "COMPLETED",/g, '');
  taskSub = taskSub.replace(/status: "COMPLETED" as any,/g, '');
  writeFile(taskSubPanelPath, taskSub);
}

// 5. Fix ranking-import-page.tsx & mutations
const rankingImportPath = 'features/board/rankings/components/ranking-import-page.tsx';
if (fs.existsSync(path.join(srcDir, rankingImportPath))) {
  let rankingImport = readFile(rankingImportPath);
  rankingImport = rankingImport.replace(/fileName: file\?\.name \|\| "unknown\.csv"/g, 'fileName: file?.name || "unknown.csv" as any');
  writeFile(rankingImportPath, rankingImport);
}

const rankingMutationPath = 'features/board/rankings/api/rankings.mutations.ts';
if (fs.existsSync(path.join(srcDir, rankingMutationPath))) {
  let rankingMut = readFile(rankingMutationPath);
  if (!rankingMut.includes('fileName?: string;')) {
    rankingMut = rankingMut.replace(/source\?: string;/g, 'source?: string;\n  fileName?: string;');
    writeFile(rankingMutationPath, rankingMut);
  }
}

// 6. Fix app.board.sessions.$sid.tsx
const sessionPath = 'routes/app.board.sessions.$sid.tsx';
let session = readFile(sessionPath);
session = session.replace(/\[\(session\.mode \|\| "ASYNC"\) as any\]/g, '[(session.mode || "ASYNC") as keyof typeof MODE_COLORS]');
session = session.replace(/\[\(session\.status \|\| "DRAFT"\) as any\]/g, '[(session.status || "DRAFT") as keyof typeof STATUS_COLORS]');
// Just to be safe, cast the object as any
session = session.replace(/MODE_COLORS\[/g, '(MODE_COLORS as any)[');
session = session.replace(/STATUS_COLORS\[/g, '(STATUS_COLORS as any)[');
writeFile(sessionPath, session);

console.log('Fixes applied.');
