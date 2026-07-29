const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
function readFile(p) { return fs.readFileSync(path.join(srcDir, p), 'utf8'); }
function writeFile(p, c) { fs.writeFileSync(path.join(srcDir, p), c, 'utf8'); }

// 1. features/board/sessions/index.ts
const sessionsIndex = 'features/board/sessions/index.ts';
if (fs.existsSync(path.join(srcDir, sessionsIndex))) {
  let content = readFile(sessionsIndex);
  content += `\nexport * from "./components/session-card";\nexport * from "./components/session-form";\nexport * from "./components/session-notes";\nexport * from "./components/session-proposal-row";\nexport * from "./components/tie-break-panel";\nexport * from "./components/vote-progress";\nexport * from "./components/voting-panel";\n`;
  writeFile(sessionsIndex, content);
}

// 2. features/assistant/tasks/index.ts
const tasksIndex = 'features/assistant/tasks/index.ts';
if (fs.existsSync(path.join(srcDir, tasksIndex))) {
  let content = readFile(tasksIndex);
  content += `\nexport * from "./components/task-helpers";\n`;
  writeFile(tasksIndex, content);
}

// 3. Fix routes
function fixImports(file, replacements) {
  const fullPath = path.join(srcDir, file);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  for (const rep of replacements) {
    const regex = new RegExp(`from "${rep.from}"`, 'g');
    content = content.replace(regex, `from "${rep.to}"`);
  }
  fs.writeFileSync(fullPath, content, 'utf8');
}

fixImports('routes/app.dashboard.tsx', [
  { from: '@/features/assistant/tasks/components/task-helpers', to: '@/features/assistant/tasks' }
]);

fixImports('routes/app.board.sessions.new.tsx', [
  { from: '@/features/board/sessions/components/session-form', to: '@/features/board/sessions' }
]);

fixImports('routes/app.board.sessions.index.tsx', [
  { from: '@/features/board/sessions/components/session-card', to: '@/features/board/sessions' }
]);

fixImports('routes/app.board.sessions.$sid.tsx', [
  { from: '@/features/board/sessions/components/session-proposal-row', to: '@/features/board/sessions' },
  { from: '@/features/board/sessions/components/session-notes', to: '@/features/board/sessions' },
  { from: '@/features/board/sessions/components/tie-break-panel', to: '@/features/board/sessions' }
]);

console.log('Boundary fix complete.');
