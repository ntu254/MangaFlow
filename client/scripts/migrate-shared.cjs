const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

const replacements = [
  { search: /@\/components\/layout\/detail-drawer/g, replace: '@/shared/layout/detail-drawer' },
  { search: /@\/components\/layout\/page-layout/g, replace: '@/shared/layout/page-layout' },
  { search: /@\/components\/ui\/confirm-dialog/g, replace: '@/shared/ui/confirm-dialog' },
  { search: /@\/components\/status-pill/g, replace: '@/shared/ui/status-pill' }
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
    console.log(`Updated: ${path.relative(srcDir, file)}`);
  }
});

console.log(`Finished updating ${updatedFiles} files.`);
