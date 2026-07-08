const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

const moves = [
  {
    from: 'shared/ui/admin/admin-utils.tsx',
    to: 'features/admin/_shared/components/admin-utils.tsx',
  },
  {
    from: 'shared/ui/admin/admin-access.tsx',
    to: 'features/admin/_shared/components/admin-access.tsx',
  },
  {
    from: 'shared/ui/admin/admin-data.ts',
    to: 'features/admin/_shared/model/admin-data.ts',
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

// Create index.ts
const indexPath = path.join(srcDir, 'features/admin/_shared/index.ts');
const indexContent = `export * from "./components/admin-utils";\nexport * from "./components/admin-access";\nexport * from "./model/admin-data";\n`;
fs.writeFileSync(indexPath, indexContent);
console.log(`Created: features/admin/_shared/index.ts`);

// Delete old dir
const oldDir = path.join(srcDir, 'shared/ui/admin');
if (fs.existsSync(oldDir) && fs.readdirSync(oldDir).length === 0) {
  fs.rmdirSync(oldDir);
  console.log(`Removed empty directory: shared/ui/admin`);
}

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

const regex1 = /from "@\/shared\/ui\/admin\/admin-utils"/g;
const regex2 = /from "@\/shared\/ui\/admin\/admin-access"/g;
const regex3 = /from "@\/shared\/ui\/admin\/admin-data"/g;
const replacement = 'from "@/features/admin/_shared"';

let changedFiles = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(regex1, replacement).replace(regex2, replacement).replace(regex3, replacement);
  
  if (newContent !== content) {
    fs.writeFileSync(file, newContent);
    console.log(`Updated imports in: ${path.relative(srcDir, file)}`);
    changedFiles++;
  }
}

console.log(`Updated imports in ${changedFiles} files. Migration complete.`);
