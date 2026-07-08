const fs = require('fs');
const path = require('path');

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
    regex: /from "\.\/admin-utils"/g,
    replacement: 'from "@/shared/ui/admin/admin-utils"'
  },
  {
    regex: /from "\.\/admin-access"/g,
    replacement: 'from "@/shared/ui/admin/admin-access"'
  },
  {
    regex: /from "\.\/admin-data"/g,
    replacement: 'from "@/shared/ui/admin/admin-data"'
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

// Fix index files
const indexes = {
  'features/admin/series-management/index.ts': `export { AdminSeriesManagementPage as SeriesManagementPage } from "./components/series-management-page";\n`,
  'features/admin/studios/index.ts': `export { AdminStudiosPage as StudiosPage } from "./components/studios-page";\n`,
  'features/admin/workflow-monitor/index.ts': `export { AdminWorkflowMonitorPage as WorkflowMonitorPage } from "./components/workflow-monitor-page";\n`,
};

for (const [file, content] of Object.entries(indexes)) {
  const filePath = path.join(srcDir, file);
  fs.writeFileSync(filePath, content);
  console.log(`Updated Index: ${file}`);
}

// Fix missing imports in studios-page.tsx
const studiosPagePath = path.join(srcDir, 'features/admin/studios/components/studios-page.tsx');
if (fs.existsSync(studiosPagePath)) {
  let studiosContent = fs.readFileSync(studiosPagePath, 'utf8');
  // Need to add User type import if missing
  if (!studiosContent.includes('import type { User }')) {
    studiosContent = studiosContent.replace('import { useAuth }', 'import { useAuth, type User }');
    if (!studiosContent.includes('type User')) {
       studiosContent = 'import type { User } from "@/lib/auth";\n' + studiosContent;
    }
  }
  
  studiosContent = studiosContent.replace(/\(user\) =>/g, '(user: any) =>');
  fs.writeFileSync(studiosPagePath, studiosContent);
  console.log(`Fixed any types in studios-page.tsx`);
}

// Fix route imports
const routeReplacements = [
  {
    file: 'routes/app.admin.series.tsx',
    regex: /AdminSeriesManagementPage/g,
    replacement: 'SeriesManagementPage'
  },
  {
    file: 'routes/app.admin.studios.tsx',
    regex: /AdminStudiosPage/g,
    replacement: 'StudiosPage'
  },
  {
    file: 'routes/app.admin.workflows.tsx',
    regex: /AdminWorkflowMonitorPage/g,
    replacement: 'WorkflowMonitorPage'
  }
];

for (const { file, regex, replacement } of routeReplacements) {
  const filePath = path.join(srcDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content.replace(regex, replacement);
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent);
      console.log(`Fixed route: ${file}`);
    }
  }
}

console.log(`Fixes applied.`);
