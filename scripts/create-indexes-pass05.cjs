const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

const indexes = {
  'features/admin/settings/index.ts': 'export * from "./components/settings-page";',
  'features/admin/storage/index.ts': 'export * from "./components/files-storage-page";\nexport * from "./api/storage.queries";',
  'features/assistant/dashboard/index.ts': 'export * from "./components/assistant-dashboard";',
  'features/board/sessions/index.ts': 'export * from "./api/sessions.queries";',
  'features/editor/reviews/index.ts': 'export * from "./components/chapter-review-page";\nexport * from "./components/storyboard-review-page";'
};

for (const [file, content] of Object.entries(indexes)) {
  const fullPath = path.join(srcDir, file);
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Created ${file}`);
}
