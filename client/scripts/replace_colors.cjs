const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      content = content.replace(/bg-indigo-/g, 'bg-violet-');
      content = content.replace(/text-indigo-/g, 'text-violet-');
      content = content.replace(/border-indigo-/g, 'border-violet-');
      content = content.replace(/ring-indigo-/g, 'ring-violet-');
      content = content.replace(/fill-indigo-/g, 'fill-violet-');
      
      content = content.replace(/bg-red-/g, 'bg-rose-');
      content = content.replace(/text-red-/g, 'text-rose-');
      content = content.replace(/border-red-/g, 'border-rose-');
      content = content.replace(/ring-red-/g, 'ring-rose-');
      content = content.replace(/fill-red-/g, 'fill-rose-');
      
      content = content.replace(/bg-green-/g, 'bg-emerald-');
      content = content.replace(/text-green-/g, 'text-emerald-');
      content = content.replace(/border-green-/g, 'border-emerald-');
      content = content.replace(/ring-green-/g, 'ring-emerald-');
      content = content.replace(/fill-green-/g, 'fill-emerald-');
      
      content = content.replace(/bg-orange-/g, 'bg-amber-');
      content = content.replace(/text-orange-/g, 'text-amber-');
      content = content.replace(/border-orange-/g, 'border-amber-');
      content = content.replace(/ring-orange-/g, 'ring-amber-');
      content = content.replace(/fill-orange-/g, 'fill-amber-');

      fs.writeFileSync(fullPath, content);
    }
  }
}

replaceInDir('D:/vibe-coding/MangaFlow/client/src');
console.log('Done replacing colors');
