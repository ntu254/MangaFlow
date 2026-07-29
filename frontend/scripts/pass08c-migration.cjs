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

function writeFile(p, c) {
  const full = path.join(srcDir, p);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, c, 'utf8');
}

// Moves
moveFile('components/editor/proposal-review-page.tsx', 'features/editor/proposal-review/components/proposal-review-page.tsx');
moveFile('features/editor/reviews/components/review/editorial-checklist.tsx', 'features/editor/proposal-review/components/editorial-checklist.tsx');

moveFile('components/editor/review-queue-page.tsx', 'features/editor/review-queue/components/review-queue-page.tsx');
moveFile('features/editor/reviews/components/review/review-queue-table.tsx', 'features/editor/review-queue/components/review-queue-table.tsx');
moveFile('features/editor/reviews/components/review/review-detail-drawer.tsx', 'features/editor/review-queue/components/review-detail-drawer.tsx');

moveFile('components/editor/board-briefs-page.tsx', 'features/editor/board-briefs/components/board-briefs-page.tsx');
moveFile('lib/stores/board-briefs.ts', 'features/editor/board-briefs/model/board-briefs-store.ts');

// Indices
writeFile('features/editor/proposal-review/index.ts', 'export * from "./components/proposal-review-page";\n');
writeFile('features/editor/review-queue/index.ts', 'export * from "./components/review-queue-page";\n');
writeFile('features/editor/board-briefs/index.ts', 'export * from "./components/board-briefs-page";\n');

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
    { from: /from "@\/components\/editor\/proposal-review-page"/g, to: 'from "@/features/editor/proposal-review"' },
    { from: /from "@\/components\/editor\/review-queue-page"/g, to: 'from "@/features/editor/review-queue"' },
    { from: /from "@\/components\/editor\/board-briefs-page"/g, to: 'from "@/features/editor/board-briefs"' },
    { from: /from "@\/features\/editor\/reviews\/components\/review\/editorial-checklist"/g, to: 'from "@/features/editor/proposal-review/components/editorial-checklist"' },
    { from: /from "@\/features\/editor\/reviews\/components\/review\/review-queue-table"/g, to: 'from "@/features/editor/review-queue/components/review-queue-table"' },
    { from: /from "@\/features\/editor\/reviews\/components\/review\/review-detail-drawer"/g, to: 'from "@/features/editor/review-queue/components/review-detail-drawer"' },
    { from: /from "@\/lib\/stores\/board-briefs"/g, to: 'from "@/features/editor/board-briefs/model/board-briefs-store"' },
    { from: /import \{ EditorialChecklist \} from "\@\/features\/editor\/proposal-review\/components\/editorial-checklist"/g, to: 'import { EditorialChecklist } from "./editorial-checklist"' },
    { from: /import \{ ReviewQueueTable \} from "\@\/features\/editor\/review-queue\/components\/review-queue-table"/g, to: 'import { ReviewQueueTable } from "./review-queue-table"' }
  ];

  for (const { from, to } of replaces) {
    if (from.test(content)) {
      content = content.replace(from, to);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
  }
});

// Clean up empty directories
const revDir = path.join(srcDir, 'features/editor/reviews/components/review');
if (fs.existsSync(revDir)) {
  const contents = fs.readdirSync(revDir);
  if (contents.length === 0) {
    fs.rmdirSync(revDir);
    console.log('Removed empty directory: features/editor/reviews/components/review');
  }
}

console.log('Migration complete.');
