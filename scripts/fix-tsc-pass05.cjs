const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function readFile(p) { return fs.readFileSync(path.join(srcDir, p), 'utf8'); }
function writeFile(p, c) { fs.writeFileSync(path.join(srcDir, p), c, 'utf8'); }

// 1. system-settings-page.tsx
const sysSettings = 'components/admin/system-settings-page.tsx';
if (fs.existsSync(path.join(srcDir, sysSettings))) {
  let content = readFile(sysSettings);
  content = content.replace(/from ".\/settings-page"/g, 'from "@/features/admin/settings"');
  writeFile(sysSettings, content);
}

// 2. settings-page.tsx
const settingsPage = 'features/admin/settings/components/settings-page.tsx';
if (fs.existsSync(path.join(srcDir, settingsPage))) {
  let content = readFile(settingsPage);
  content = content.replace(/from "\.\/admin-utils"/g, 'from "@/components/admin/admin-utils"');
  writeFile(settingsPage, content);
}

// 3. files-storage-page.tsx
const filesStoragePage = 'features/admin/storage/components/files-storage-page.tsx';
if (fs.existsSync(path.join(srcDir, filesStoragePage))) {
  let content = readFile(filesStoragePage);
  content = content.replace(/from "\.\/admin-data"/g, 'from "@/components/admin/admin-data"');
  content = content.replace(/from "\.\/admin-utils"/g, 'from "@/components/admin/admin-utils"');
  writeFile(filesStoragePage, content);
}

// 4. use-board-queries.ts -> export VotingSession
const boardQueries = 'hooks/use-board-queries.ts';
if (fs.existsSync(path.join(srcDir, boardQueries))) {
  let content = readFile(boardQueries);
  content = content.replace(/interface VotingSession \{/g, 'export interface VotingSession {');
  writeFile(boardQueries, content);
}

// 5. editor chapter & storyboard review reason
const chapterReview = 'features/editor/reviews/components/chapter-review-page.tsx';
if (fs.existsSync(path.join(srcDir, chapterReview))) {
  let content = readFile(chapterReview);
  content = content.replace(/onConfirm=\{\(reason\) => \{/g, 'onConfirm={(reason: string) => {');
  writeFile(chapterReview, content);
}

const storyboardReview = 'features/editor/reviews/components/storyboard-review-page.tsx';
if (fs.existsSync(path.join(srcDir, storyboardReview))) {
  let content = readFile(storyboardReview);
  content = content.replace(/onConfirm=\{\(reason\) => \{/g, 'onConfirm={(reason: string) => {');
  writeFile(storyboardReview, content);
}

// 6. fix the import in app.review.$submissionId.tsx that imported from review/decision-actions
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath, callback);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      callback(fullPath);
    }
  }
}

walkDir(srcDir, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const regexSq = /from ['"]@\/components\/editor\/review\/(.*?)['"]/g;
  if (regexSq.test(content)) {
    content = content.replace(regexSq, 'from "@/features/editor/reviews/components/review/$1"');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log('Pass 05 TSC fixes applied.');
