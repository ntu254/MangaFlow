const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.join(__dirname, '..', 'src');

function findFiles(dir, ext, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, ext, fileList);
    } else if (filePath.endsWith(ext)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = findFiles(srcDir, '.tsx').concat(findFiles(srcDir, '.ts'));

const replacements = [
  {
    regex: /@\/components\/board\/board-dashboard/g,
    replacement: '@/features/board/dashboard'
  },
  {
    regex: /@\/components\/board\/board-queue-page/g,
    replacement: '@/features/board/queue'
  },
  {
    regex: /@\/components\/board\/proposal-decision-detail/g,
    replacement: '@/features/board/queue'
  },
  {
    regex: /@\/components\/board\/board-vote-progress/g,
    replacement: '@/features/board/queue/components/board-vote-progress'
  },
  {
    regex: /@\/components\/board\/proposal\/creative-materials-readonly/g,
    replacement: '@/features/board/queue/components/creative-materials-readonly'
  },
  {
    regex: /@\/components\/board\/proposal\/editor-recommendation-card/g,
    replacement: '@/features/board/queue/components/editor-recommendation-card'
  },
  {
    regex: /@\/components\/board\/proposal\/proposal-summary-card/g,
    replacement: '@/features/board/queue/components/proposal-summary-card'
  },
  {
    regex: /@\/components\/board\/proposal\/risk-assessment-card/g,
    replacement: '@/features/board/queue/components/risk-assessment-card'
  },
  {
    regex: /@\/components\/board\/decision-effect-preview/g,
    replacement: '@/entities/proposal'
  },
  {
    regex: /@\/components\/board\/at-risk-reviews-page/g,
    replacement: '@/features/board/at-risk'
  },
  {
    regex: /@\/components\/board\/at-risk\/at-risk-decision-panel/g,
    replacement: '@/features/board/at-risk/components/at-risk-decision-panel'
  },
  {
    regex: /@\/components\/board\/at-risk\/at-risk-queue-table/g,
    replacement: '@/features/board/at-risk/components/at-risk-queue-table'
  },
  {
    regex: /@\/components\/board\/at-risk\/performance-snapshot/g,
    replacement: '@/features/board/at-risk/components/performance-snapshot'
  },
  {
    regex: /@\/components\/board\/series-rankings-page/g,
    replacement: '@/features/board/series-rankings'
  }
];

let changedFiles = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  for (const { regex, replacement } of replacements) {
    newContent = newContent.replace(regex, replacement);
  }
  
  if (newContent !== content) {
    fs.writeFileSync(file, newContent);
    console.log(`Updated: ${path.relative(srcDir, file)}`);
    changedFiles++;
  }
}

console.log(`Updated imports in ${changedFiles} files.`);
