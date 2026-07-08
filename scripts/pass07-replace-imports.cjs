const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const replacements = [
  { from: /from ".*?components\/role-badge"/g, to: 'from "@/entities/user"' },
  { from: /from ".*?components\/access\/role-badge"/g, to: 'from "@/entities/user"' },
  { from: /from ".*?components\/access\/scope-badge"/g, to: 'from "@/entities/user"' },
  { from: /from ".*?components\/proposal\/status-pill"/g, to: 'from "@/entities/proposal"' },
  { from: /from ".*?components\/proposal\/status-flow"/g, to: 'from "@/entities/proposal"' },
  { from: /from ".*?components\/series\/chapter-status-pill"/g, to: 'from "@/entities/chapter"' },
  { from: /from ".*?features\/editor\/reviews\/components\/review\/review-status-pill"/g, to: 'from "@/entities/submission"' },
  { from: /from ".*?features\/editor\/reviews\/components\/review\/deadline-risk-pill"/g, to: 'from "@/entities/submission"' },
  { from: /from ".*?features\/editor\/reviews\/components\/review\/priority-pill"/g, to: 'from "@/entities/submission"' },
  { from: /from ".*?lib\/workflow\/task-status-utils"/g, to: 'from "@/entities/task"' },
  { from: /from ".*?features\/assistant\/tasks\/components\/task-status-summary"/g, to: 'from "@/entities/task"' },
];

const files = walk(srcDir);
files.forEach(file => {
  // Skip the ones we just moved inside entities (they might use local relative imports, wait)
  // Actually, wait, inside entities/user/index.ts we want 'export * from "./ui/role-badge"' so we shouldn't replace .* there!
  // It's better to use exact match for absolute paths, and then manually fix relative paths if TSC fails.
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  // Exact absolute paths:
  const absReplacements = [
    { from: /from "@\/components\/role-badge"/g, to: 'from "@/entities/user"' },
    { from: /from "@\/components\/access\/role-badge"/g, to: 'from "@/entities/user"' },
    { from: /from "@\/components\/access\/scope-badge"/g, to: 'from "@/entities/user"' },
    { from: /from "@\/components\/proposal\/status-pill"/g, to: 'from "@/entities/proposal"' },
    { from: /from "@\/components\/proposal\/status-flow"/g, to: 'from "@/entities/proposal"' },
    { from: /from "@\/components\/series\/chapter-status-pill"/g, to: 'from "@/entities/chapter"' },
    { from: /from "@\/features\/editor\/reviews\/components\/review\/review-status-pill"/g, to: 'from "@/entities/submission"' },
    { from: /from "@\/features\/editor\/reviews\/components\/review\/deadline-risk-pill"/g, to: 'from "@/entities/submission"' },
    { from: /from "@\/features\/editor\/reviews\/components\/review\/priority-pill"/g, to: 'from "@/entities/submission"' },
    { from: /from "@\/lib\/workflow\/task-status-utils"/g, to: 'from "@/entities/task"' },
    { from: /from "@\/features\/assistant\/tasks\/components\/task-status-summary"/g, to: 'from "@/entities/task"' },
  ];

  for (const { from, to } of absReplacements) {
    if (from.test(content)) {
      content = content.replace(from, to);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
  }
});

console.log('Absolute imports replaced.');
