const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function moveFile(from, to, transforms = []) {
  const fullFrom = path.join(srcDir, from);
  const fullTo = path.join(srcDir, to);
  if (fs.existsSync(fullFrom)) {
    ensureDir(path.dirname(fullTo));
    let content = fs.readFileSync(fullFrom, 'utf8');
    for (const { searchValue, replaceValue } of transforms) {
      content = content.replace(searchValue, replaceValue);
    }
    fs.writeFileSync(fullTo, content, 'utf8');
    fs.unlinkSync(fullFrom);
    console.log(`Moved: ${from} -> ${to}`);
  }
}

function writeIndex(dir, exports) {
  const fullDir = path.join(srcDir, dir);
  ensureDir(fullDir);
  fs.writeFileSync(path.join(fullDir, 'index.ts'), exports.join('\n') + '\n', 'utf8');
}

// 1. User Entity
moveFile('components/role-badge.tsx', 'entities/user/ui/role-badge.tsx');
moveFile('components/access/role-badge.tsx', 'entities/user/ui/access-role-badge.tsx', [
  { searchValue: /from "@\/components\/role-badge"/g, replaceValue: 'from "./role-badge"' }
]);
moveFile('components/access/scope-badge.tsx', 'entities/user/ui/scope-badge.tsx');
writeIndex('entities/user', [
  'export * from "./ui/role-badge";',
  'export * from "./ui/access-role-badge";',
  'export * from "./ui/scope-badge";'
]);

// 2. Proposal Entity
moveFile('components/proposal/status-pill.tsx', 'entities/proposal/ui/status-pill.tsx');
moveFile('components/proposal/status-flow.tsx', 'entities/proposal/ui/status-flow.tsx');
writeIndex('entities/proposal', [
  'export * from "./ui/status-pill";',
  'export * from "./ui/status-flow";'
]);

// 3. Chapter Entity
moveFile('components/series/chapter-status-pill.tsx', 'entities/chapter/ui/chapter-status-pill.tsx');
writeIndex('entities/chapter', [
  'export * from "./ui/chapter-status-pill";'
]);

// 4. Submission Entity
moveFile('features/editor/reviews/components/review/review-status-pill.tsx', 'entities/submission/ui/review-status-pill.tsx');
moveFile('features/editor/reviews/components/review/deadline-risk-pill.tsx', 'entities/submission/ui/deadline-risk-pill.tsx');
moveFile('features/editor/reviews/components/review/priority-pill.tsx', 'entities/submission/ui/priority-pill.tsx');
writeIndex('entities/submission', [
  'export * from "./ui/review-status-pill";',
  'export * from "./ui/deadline-risk-pill";',
  'export * from "./ui/priority-pill";'
]);

// 5. Task Entity
moveFile('lib/workflow/task-status-utils.ts', 'entities/task/model/task-status-utils.ts');
moveFile('features/assistant/tasks/components/task-status-summary.tsx', 'entities/task/ui/task-status-summary.tsx', [
  { searchValue: /from "@\/lib\/workflow\/task-status-utils"/g, replaceValue: 'from "../model/task-status-utils"' }
]);
writeIndex('entities/task', [
  'export * from "./model/task-status-utils";',
  'export * from "./ui/task-status-summary";'
]);

console.log('Entities extracted successfully.');
