const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function readFile(p) { return fs.readFileSync(path.join(srcDir, p), 'utf8'); }
function writeFile(p, c) { fs.writeFileSync(path.join(srcDir, p), c, 'utf8'); }

// 1. sessions.queries.ts
const sessionsQueries = 'features/board/sessions/api/sessions.queries.ts';
if (fs.existsSync(path.join(srcDir, sessionsQueries))) {
  let content = readFile(sessionsQueries);
  content = content.replace(/import \{ boardKeys, type VotingSession \} from "@\/hooks\/use-board-queries";/g, 'import { boardKeys } from "@/hooks/use-board-queries";\nimport type { VotingSession } from "@/lib/voting-types";');
  writeFile(sessionsQueries, content);
}

// 2. proposal-review-page.tsx reason any
const proposalReview = 'components/editor/proposal-review-page.tsx';
if (fs.existsSync(path.join(srcDir, proposalReview))) {
  let content = readFile(proposalReview);
  content = content.replace(/onConfirm=\{\(reason\) => \{/g, 'onConfirm={(reason: string) => {');
  writeFile(proposalReview, content);
}

// 3. editor components importing from old review path
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

walkDir(path.join(srcDir, 'components', 'editor'), (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // matches from './review/...'
  const regexDot = /from ['"]\.\/review\/(.*?)['"]/g;
  if (regexDot.test(content)) {
    content = content.replace(regexDot, 'from "@/features/editor/reviews/components/review/$1"');
    changed = true;
  }
  // matches from '../review/...'
  const regexDotDot = /from ['"]\.\.\/review\/(.*?)['"]/g;
  if (regexDotDot.test(content)) {
    content = content.replace(regexDotDot, 'from "@/features/editor/reviews/components/review/$1"');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log('Fixed remaining pass 05 TSC errors.');
