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
  { from: '@/components/admin/settings-page', to: '@/features/admin/settings' },
  { from: '@/components/admin/files-storage-page', to: '@/features/admin/storage' },
  { from: '@/components/assistant/assistant-dashboard', to: '@/features/assistant/dashboard' },
  { from: '@/components/board/session-card', to: '@/features/board/sessions/components/session-card' },
  { from: '@/components/board/session-form', to: '@/features/board/sessions/components/session-form' },
  { from: '@/components/board/session-notes', to: '@/features/board/sessions/components/session-notes' },
  { from: '@/components/board/session-proposal-row', to: '@/features/board/sessions/components/session-proposal-row' },
  { from: '@/components/board/tie-break-panel', to: '@/features/board/sessions/components/tie-break-panel' },
  { from: '@/components/board/voting-panel', to: '@/features/board/sessions/components/voting-panel' },
  { from: '@/components/board/vote-progress', to: '@/features/board/sessions/components/vote-progress' },
  { from: '@/components/editor/chapter-review-page', to: '@/features/editor/reviews' },
  { from: '@/components/editor/storyboard-review-page', to: '@/features/editor/reviews' },
];

walkDir(srcDir, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const rep of replacements) {
    // Regex for: import ... from "@/components/..."
    const regex = new RegExp(`from "${rep.from}"`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `from "${rep.to}"`);
      changed = true;
    }
    // Also single quotes
    const regexSq = new RegExp(`from '${rep.from}'`, 'g');
    if (regexSq.test(content)) {
      content = content.replace(regexSq, `from '${rep.to}'`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated imports in ${filePath}`);
  }
});
