const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function fix(file, replaces) {
  const fullPath = path.join(srcDir, file);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  for (const { from, to } of replaces) {
    if (from.test(content)) {
      content = content.replace(from, to);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Fixed', file);
  }
}

fix('features/assistant/tasks/components/assistant-task-card.tsx', [
  { from: /from "\.\/task-helpers"/g, to: 'from "@/entities/task"' }
]);

fix('features/assistant/tasks/components/assistant-task-detail-drawer.tsx', [
  { from: /from "\.\/task-helpers"/g, to: 'from "@/entities/task"' }
]);

fix('features/assistant/tasks/components/assistant-task-table.tsx', [
  { from: /from "\.\/task-helpers"/g, to: 'from "@/entities/task"' }
]);

fix('features/assistant/tasks/components/my-tasks-page.tsx', [
  { from: /from "\.\/task-helpers"/g, to: 'from "@/entities/task"' }
]);

fix('features/assistant/tasks/index.ts', [
  { from: /export \* from "\.\/components\/task-helpers";\n/g, to: '' }
]);

fix('features/mangaka/reviews/components/submission-review.tsx', [
  { from: /from "@\/features\/assistant\/tasks\/components\/submission-history"/g, to: 'from "@/features/assistant/task-studio/components/submission-history"' }
]);

fix('routes/app.dashboard.tsx', [
  { from: /import { buildTaskContext } from "@\/features\/assistant\/tasks";/g, to: 'import { buildTaskContext } from "@/entities/task";' }
]);
