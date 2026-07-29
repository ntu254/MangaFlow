const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

const replacements = [
  { search: /@\/components\/admin\/users-page/g, replace: '@/features/admin/users' },
  { search: /@\/components\/admin\/payroll-page/g, replace: '@/features/admin/payroll' },
  { search: /@\/components\/assistant\/my-tasks-page/g, replace: '@/features/assistant/tasks' },
  { search: /@\/components\/board\/decision-history-page/g, replace: '@/features/board/decisions' },
  { search: /@\/components\/board\/ranking-import-page/g, replace: '@/features/board/rankings' },
  { search: /@\/components\/board\/rankings\/ranking-import-preview/g, replace: '@/features/board/rankings/components/ranking-import-preview' }
];

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walkDir(srcDir);
let updatedFiles = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  replacements.forEach(r => {
    newContent = newContent.replace(r.search, r.replace);
  });
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    updatedFiles++;
    console.log(`Updated routes/imports: ${path.relative(srcDir, file)}`);
  }
});

// Specific internal fixes for my-tasks-page.tsx
const myTasksPath = path.join(srcDir, 'features', 'assistant', 'tasks', 'components', 'my-tasks-page.tsx');
if (fs.existsSync(myTasksPath)) {
  let content = fs.readFileSync(myTasksPath, 'utf8');
  content = content.replace(/from "\.\/task\//g, 'from "./');
  fs.writeFileSync(myTasksPath, content, 'utf8');
  console.log('Fixed my-tasks-page internal imports');
}

// Specific fixes for assistant-dashboard.tsx
const dashboardPath = path.join(srcDir, 'components', 'assistant', 'assistant-dashboard.tsx');
if (fs.existsSync(dashboardPath)) {
  let content = fs.readFileSync(dashboardPath, 'utf8');
  content = content.replace(/from "\.\/task\//g, 'from "@/features/assistant/tasks/components/');
  fs.writeFileSync(dashboardPath, content, 'utf8');
  console.log('Fixed assistant-dashboard internal imports');
}

// Specific fix for ranking-import-page
const rankingImportPath = path.join(srcDir, 'features', 'board', 'rankings', 'components', 'ranking-import-page.tsx');
if (fs.existsSync(rankingImportPath)) {
  let content = fs.readFileSync(rankingImportPath, 'utf8');
  content = content.replace(/@\/components\/board\/rankings\/ranking-import-preview/g, './ranking-import-preview');
  fs.writeFileSync(rankingImportPath, content, 'utf8');
  console.log('Fixed ranking-import-page internal imports');
}

// Specific fix for assistant-task-detail-drawer.tsx
const taskDetailPath = path.join(srcDir, 'features', 'assistant', 'tasks', 'components', 'assistant-task-detail-drawer.tsx');
if (fs.existsSync(taskDetailPath)) {
  let content = fs.readFileSync(taskDetailPath, 'utf8');
  content = content.replace(/from "\.\/task-helpers"/g, 'from "./task-helpers"');
  fs.writeFileSync(taskDetailPath, content, 'utf8');
  console.log('Fixed assistant-task-detail-drawer.tsx internal imports');
}
