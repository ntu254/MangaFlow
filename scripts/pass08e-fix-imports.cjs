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
    regex: /@\/components\/admin\/admin-dashboard/g,
    replacement: '@/features/admin/dashboard'
  },
  {
    regex: /@\/components\/admin\/series-management-page/g,
    replacement: '@/features/admin/series-management'
  },
  {
    regex: /@\/components\/admin\/studios-page/g,
    replacement: '@/features/admin/studios'
  },
  {
    regex: /@\/components\/admin\/workflow-monitor-page/g,
    replacement: '@/features/admin/workflow-monitor'
  },
  {
    regex: /@\/components\/admin\/admin-access/g,
    replacement: '@/shared/ui/admin/admin-access'
  },
  {
    regex: /@\/components\/admin\/admin-utils/g,
    replacement: '@/shared/ui/admin/admin-utils'
  },
  {
    regex: /@\/components\/admin\/admin-data/g,
    replacement: '@/shared/ui/admin/admin-data'
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
