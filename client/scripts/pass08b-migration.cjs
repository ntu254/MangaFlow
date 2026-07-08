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
moveFile('components/editor/editor-annotation-studio.tsx', 'features/editor/annotation-studio/components/editor-annotation-studio.tsx');
moveFile('components/editor/annotation/annotation-toolbar.tsx', 'features/editor/annotation-studio/components/annotation-toolbar.tsx');
moveFile('components/editor/annotation/comment-inspector.tsx', 'features/editor/annotation-studio/components/comment-inspector.tsx');
moveFile('components/editor/annotation/editor-page-canvas.tsx', 'features/editor/annotation-studio/components/editor-page-canvas.tsx');
moveFile('components/editor/editor-submission-review.tsx', 'features/editor/submission-review/components/editor-submission-review.tsx');
moveFile('features/editor/reviews/components/review/decision-actions.tsx', 'shared/ui/decision-actions.tsx');

// Indices
writeFile('features/editor/annotation-studio/index.ts', 'export * from "./components/editor-annotation-studio";\n');
writeFile('features/editor/submission-review/index.ts', 'export * from "./components/editor-submission-review";\n');

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
    { from: /from "@\/components\/editor\/editor-annotation-studio"/g, to: 'from "@/features/editor/annotation-studio"' },
    { from: /from "@\/components\/editor\/editor-submission-review"/g, to: 'from "@/features/editor/submission-review"' },
    { from: /from "@\/features\/editor\/reviews\/components\/review\/decision-actions"/g, to: 'from "@/shared/ui/decision-actions"' },
  ];

  for (const { from, to } of replaces) {
    if (from.test(content)) {
      content = content.replace(from, to);
      changed = true;
    }
  }
  
  // Local fixes in editor-annotation-studio.tsx
  if (file.endsWith('editor-annotation-studio.tsx')) {
    const localReplaces = [
      { from: /from "\.\/annotation\/annotation-toolbar"/g, to: 'from "./annotation-toolbar"' },
      { from: /from "\.\/annotation\/editor-page-canvas"/g, to: 'from "./editor-page-canvas"' },
      { from: /from "\.\/annotation\/comment-inspector"/g, to: 'from "./comment-inspector"' },
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

// Clean up empty directories
const annDir = path.join(srcDir, 'components/editor/annotation');
if (fs.existsSync(annDir)) {
  const contents = fs.readdirSync(annDir);
  if (contents.length === 0) {
    fs.rmdirSync(annDir);
    console.log('Removed empty directory: components/editor/annotation');
  }
}

console.log('Migration complete.');
