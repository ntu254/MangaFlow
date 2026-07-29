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

fix('components/access/access-summary-card.tsx', [
  { from: /from "\.\/role-badge"/g, to: 'from "@/entities/user"' },
  { from: /from "\.\/scope-badge"/g, to: 'from "@/entities/user"' }
]);

fix('components/series/chapter-kpi-strip.tsx', [
  { from: /from "\.\/chapter-status-pill"/g, to: 'from "@/entities/chapter"' }
]);

fix('components/series/chapter-table.tsx', [
  { from: /from "\.\/chapter-status-pill"/g, to: 'from "@/entities/chapter"' }
]);

fix('components/series/publication-calendar.tsx', [
  { from: /from "\.\/chapter-status-pill"/g, to: 'from "@/entities/chapter"' }
]);

fix('components/series/series-card.tsx', [
  { from: /from "\.\/chapter-status-pill"/g, to: 'from "@/entities/chapter"' }
]);

fix('features/assistant/tasks/components/my-tasks-page.tsx', [
  { from: /from "\.\/task-status-summary"/g, to: 'from "@/entities/task"' }
]);

fix('features/editor/reviews/components/chapter-review-page.tsx', [
  { from: /from "\.\/review\/review-status-pill"/g, to: 'from "@/entities/submission"' },
  { from: /from "\.\/review\/deadline-risk-pill"/g, to: 'from "@/entities/submission"' }
]);

fix('features/editor/reviews/components/review/review-detail-drawer.tsx', [
  { from: /from "\.\/priority-pill"/g, to: 'from "@/entities/submission"' },
  { from: /from "\.\/review-status-pill"/g, to: 'from "@/entities/submission"' }
]);

fix('features/editor/reviews/components/review/review-queue-table.tsx', [
  { from: /from "\.\/review-status-pill"/g, to: 'from "@/entities/submission"' },
  { from: /from "\.\/priority-pill"/g, to: 'from "@/entities/submission"' }
]);

fix('features/editor/reviews/components/storyboard-review-page.tsx', [
  { from: /from "\.\/review\/review-status-pill"/g, to: 'from "@/entities/submission"' }
]);

fix('lib/assistant-access.ts', [
  { from: /from "\.\/workflow\/task-status-utils"/g, to: 'from "@/entities/task"' }
]);
