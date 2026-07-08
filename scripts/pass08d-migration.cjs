const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

const moves = [
  // Dashboard
  {
    from: 'components/board/board-dashboard.tsx',
    to: 'features/board/dashboard/components/board-dashboard.tsx',
  },
  // Queue
  {
    from: 'components/board/board-queue-page.tsx',
    to: 'features/board/queue/components/board-queue-page.tsx',
  },
  {
    from: 'components/board/proposal-decision-detail.tsx',
    to: 'features/board/queue/components/proposal-decision-detail.tsx',
  },
  {
    from: 'components/board/board-vote-progress.tsx',
    to: 'features/board/queue/components/board-vote-progress.tsx',
  },
  // Proposal Subcomponents -> Queue
  {
    from: 'components/board/proposal/creative-materials-readonly.tsx',
    to: 'features/board/queue/components/creative-materials-readonly.tsx',
  },
  {
    from: 'components/board/proposal/editor-recommendation-card.tsx',
    to: 'features/board/queue/components/editor-recommendation-card.tsx',
  },
  {
    from: 'components/board/proposal/proposal-summary-card.tsx',
    to: 'features/board/queue/components/proposal-summary-card.tsx',
  },
  {
    from: 'components/board/proposal/risk-assessment-card.tsx',
    to: 'features/board/queue/components/risk-assessment-card.tsx',
  },
  // DecisionEffectPreview -> Entities
  {
    from: 'components/board/decision-effect-preview.tsx',
    to: 'entities/proposal/ui/decision-effect-preview.tsx',
  },
  // At Risk
  {
    from: 'components/board/at-risk-reviews-page.tsx',
    to: 'features/board/at-risk/components/at-risk-reviews-page.tsx',
  },
  {
    from: 'components/board/at-risk/at-risk-decision-panel.tsx',
    to: 'features/board/at-risk/components/at-risk-decision-panel.tsx',
  },
  {
    from: 'components/board/at-risk/at-risk-queue-table.tsx',
    to: 'features/board/at-risk/components/at-risk-queue-table.tsx',
  },
  {
    from: 'components/board/at-risk/performance-snapshot.tsx',
    to: 'features/board/at-risk/components/performance-snapshot.tsx',
  },
  // Series Rankings
  {
    from: 'components/board/series-rankings-page.tsx',
    to: 'features/board/series-rankings/components/series-rankings-page.tsx',
  },
];

moves.forEach(({ from, to }) => {
  const fromPath = path.join(srcDir, from);
  const toPath = path.join(srcDir, to);
  
  if (fs.existsSync(fromPath)) {
    fs.mkdirSync(path.dirname(toPath), { recursive: true });
    fs.renameSync(fromPath, toPath);
    console.log(`Moved: ${from} -> ${to}`);
  } else {
    console.warn(`Missing: ${from}`);
  }
});

// Create index files
const indexes = {
  'features/board/dashboard/index.ts': `export { BoardDashboard } from "./components/board-dashboard";\n`,
  'features/board/queue/index.ts': `export { BoardQueuePage } from "./components/board-queue-page";\nexport { ProposalDecisionDetail } from "./components/proposal-decision-detail";\n`,
  'features/board/at-risk/index.ts': `export { AtRiskReviewsPage } from "./components/at-risk-reviews-page";\n`,
  'features/board/series-rankings/index.ts': `export { SeriesRankingsPage } from "./components/series-rankings-page";\n`,
  'entities/proposal/index.ts': fs.existsSync(path.join(srcDir, 'entities/proposal/index.ts')) 
    ? fs.readFileSync(path.join(srcDir, 'entities/proposal/index.ts'), 'utf8') + `export { DecisionEffectPreview } from "./ui/decision-effect-preview";\n`
    : `export { DecisionEffectPreview } from "./ui/decision-effect-preview";\n`,
};

for (const [file, content] of Object.entries(indexes)) {
  const filePath = path.join(srcDir, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log(`Created/Updated: ${file}`);
}

// Remove empty directories
['components/board/proposal', 'components/board/at-risk', 'components/board'].forEach(dir => {
  const dirPath = path.join(srcDir, dir);
  if (fs.existsSync(dirPath) && fs.readdirSync(dirPath).length === 0) {
    fs.rmdirSync(dirPath);
    console.log(`Removed empty directory: ${dir}`);
  }
});

console.log("Migration complete.");
