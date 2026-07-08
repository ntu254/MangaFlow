const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

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

const replacements = [
  { from: '@/components/assistant/earnings-page', to: '@/features/assistant/earnings' },
  { from: '@/components/assistant/submissions-page', to: '@/features/assistant/submissions' },
  { from: '@/components/editor/publications-page', to: '@/features/editor/publications' },
  { from: '@/components/admin/admin-notifications-page', to: '@/features/admin/notifications' },
  { from: '@/components/assistant/assistant-notifications-page', to: '@/features/assistant/notifications' },
  { from: '@/components/board/board-notifications-page', to: '@/features/board/notifications' },
  { from: '@/components/editor/editor-notifications-page', to: '@/features/editor/notifications' },
  { from: '@/components/admin/audit-page', to: '@/features/admin/audit' },
  { from: '@/components/admin/audit-logs-page', to: '@/features/admin/audit' },
  { from: '@/components/mangaka/review-queue-page', to: '@/features/mangaka/reviews' },
  { from: '@/components/mangaka/submission-review', to: '@/features/mangaka/reviews' },
];

walkDir(srcDir, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const rep of replacements) {
    const regex = new RegExp(`from "${rep.from}"`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `from "${rep.to}"`);
      changed = true;
    }
    const regexSq = new RegExp(`from '${rep.from}'`, 'g');
    if (regexSq.test(content)) {
      content = content.replace(regexSq, `from '${rep.to}'`);
      changed = true;
    }
  }

  // Handle internal relative imports that might be broken now
  // editor publications
  if (filePath.includes('publications-page.tsx') && content.includes('./publications/')) {
    content = content.replace(/\.\/publications\//g, './publications/'); // It moved together, should be ok
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated imports in ${filePath}`);
  }
});
