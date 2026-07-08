const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

const indexes = {
  'features/assistant/earnings/index.ts': 'export * from "./components/earnings-page";',
  'features/assistant/submissions/index.ts': 'export * from "./components/submissions-page";',
  'features/editor/publications/index.ts': 'export * from "./components/publications-page";',
  'features/admin/notifications/index.ts': 'export * from "./components/admin-notifications-page";',
  'features/assistant/notifications/index.ts': 'export * from "./components/assistant-notifications-page";',
  'features/board/notifications/index.ts': 'export * from "./components/board-notifications-page";',
  'features/editor/notifications/index.ts': 'export * from "./components/editor-notifications-page";',
  'features/admin/audit/index.ts': 'export * from "./components/audit-page";\nexport * from "./api/audit.queries";',
  'features/mangaka/reviews/index.ts': 'export * from "./components/review-queue-page";\nexport * from "./components/submission-review";'
};

for (const [file, content] of Object.entries(indexes)) {
  const fullPath = path.join(srcDir, file);
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Created ${file}`);
}
