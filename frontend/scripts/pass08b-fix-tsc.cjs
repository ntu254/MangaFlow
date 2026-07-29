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

fix('features/editor/reviews/components/chapter-review-page.tsx', [
  { from: /from "\.\/review\/decision-actions"/g, to: 'from "@/shared/ui/decision-actions"' },
  { from: /onAct: \(reason\) =>/g, to: 'onAct: (reason?: string) =>' }
]);

fix('features/editor/reviews/components/storyboard-review-page.tsx', [
  { from: /from "\.\/review\/decision-actions"/g, to: 'from "@/shared/ui/decision-actions"' },
  { from: /onAct: \(reason\) =>/g, to: 'onAct: (reason?: string) =>' }
]);
