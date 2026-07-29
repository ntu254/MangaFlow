const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function moveFile(from, to) {
  const fullFrom = path.join(srcDir, from);
  const fullTo = path.join(srcDir, to);
  if (fs.existsSync(fullFrom)) {
    ensureDir(path.dirname(fullTo));
    fs.renameSync(fullFrom, fullTo);
    console.log(`Moved: ${from} -> ${to}`);
  }
}

function appendFile(p, c) {
  const full = path.join(srcDir, p);
  ensureDir(path.dirname(full));
  fs.appendFileSync(full, c, 'utf8');
}

function writeFile(p, c) {
  const full = path.join(srcDir, p);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, c, 'utf8');
}

// Moves
moveFile('features/assistant/tasks/components/task-helpers.ts', 'entities/task/model/task-helpers.ts');
moveFile('components/assistant/task-studio-page.tsx', 'features/assistant/task-studio/components/task-studio-page.tsx');
moveFile('features/assistant/tasks/components/submission-history.tsx', 'features/assistant/task-studio/components/submission-history.tsx');
moveFile('features/assistant/tasks/components/task-brief-panel.tsx', 'features/assistant/task-studio/components/task-brief-panel.tsx');
moveFile('features/assistant/tasks/components/task-feedback-panel.tsx', 'features/assistant/task-studio/components/task-feedback-panel.tsx');
moveFile('features/assistant/tasks/components/task-region-preview.tsx', 'features/assistant/task-studio/components/task-region-preview.tsx');
moveFile('features/assistant/tasks/components/task-submission-panel.tsx', 'features/assistant/task-studio/components/task-submission-panel.tsx');

// Public APIs
appendFile('entities/task/index.ts', 'export * from "./model/task-helpers";\n');
writeFile('features/assistant/task-studio/index.ts', 'export * from "./components/task-studio-page";\n');

// Global imports update
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(srcDir);
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const replaces = [
    { from: /from "@\/features\/assistant\/tasks\/components\/task-helpers"/g, to: 'from "@/entities/task"' },
    { from: /from "@\/components\/assistant\/task-studio-page"/g, to: 'from "@/features/assistant/task-studio"' },
  ];

  for (const { from, to } of replaces) {
    if (from.test(content)) {
      content = content.replace(from, to);
      changed = true;
    }
  }
  
  // Local fixes in task-studio-page.tsx
  if (file.endsWith('task-studio-page.tsx')) {
    const localReplaces = [
      { from: /from "@\/features\/assistant\/tasks\/components\/submission-history"/g, to: 'from "./submission-history"' },
      { from: /from "@\/features\/assistant\/tasks\/components\/task-brief-panel"/g, to: 'from "./task-brief-panel"' },
      { from: /from "@\/features\/assistant\/tasks\/components\/task-feedback-panel"/g, to: 'from "./task-feedback-panel"' },
      { from: /from "@\/features\/assistant\/tasks\/components\/task-region-preview"/g, to: 'from "./task-region-preview"' },
      { from: /from "@\/features\/assistant\/tasks\/components\/task-submission-panel"/g, to: 'from "./task-submission-panel"' },
    ];
    for (const { from, to } of localReplaces) {
      if (from.test(content)) {
        content = content.replace(from, to);
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
  }
});

console.log('Migration complete.');
