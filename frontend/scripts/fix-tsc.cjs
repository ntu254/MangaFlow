const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

// Replacements for missing modules across the whole codebase
const globalReplacements = [
  { search: /@\/components\/assistant\/task\//g, replace: '@/features/assistant/tasks/components/' },
  { search: /from "\.\/task\//g, replace: 'from "@/features/assistant/tasks/components/' }, // catch relative ones
  { search: /@\/components\/board\/rankings\//g, replace: '@/features/board/rankings/components/' }
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
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  globalReplacements.forEach(r => {
    newContent = newContent.replace(r.search, r.replace);
  });
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
  }
});

// Fix specific Admin paths
const adminFiles = [
  path.join(srcDir, 'features', 'admin', 'payroll', 'components', 'payroll-page.tsx'),
  path.join(srcDir, 'features', 'admin', 'users', 'components', 'users-page.tsx')
];

adminFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/from "\.\/admin-access"/g, 'from "@/components/admin/admin-access"');
    content = content.replace(/from "\.\/admin-utils"/g, 'from "@/components/admin/admin-utils"');
    fs.writeFileSync(file, content, 'utf8');
  }
});

// Fix confirm-dialog.tsx imports
const confirmDialogPath = path.join(srcDir, 'shared', 'ui', 'confirm-dialog.tsx');
if (fs.existsSync(confirmDialogPath)) {
  let content = fs.readFileSync(confirmDialogPath, 'utf8');
  content = content.replace(/from "\.\/alert-dialog"/g, 'from "@/components/ui/alert-dialog"');
  content = content.replace(/from "\.\/button"/g, 'from "@/components/ui/button"');
  content = content.replace(/from "\.\/label"/g, 'from "@/components/ui/label"');
  content = content.replace(/from "\.\/textarea"/g, 'from "@/components/ui/textarea"');
  // Fix implicit any
  content = content.replace(/onChange={\(e\) => setVoidReason\(e.target.value\)}/, 'onChange={(e: any) => setVoidReason(e.target.value)}');
  fs.writeFileSync(confirmDialogPath, content, 'utf8');
}

// Fix assistant-dashboard.tsx task-helpers
const dashboardPath = path.join(srcDir, 'components', 'assistant', 'assistant-dashboard.tsx');
if (fs.existsSync(dashboardPath)) {
  let content = fs.readFileSync(dashboardPath, 'utf8');
  content = content.replace(/from "\.\/task\/task-helpers"/g, 'from "@/features/assistant/tasks/components/task-helpers"');
  fs.writeFileSync(dashboardPath, content, 'utf8');
}

// Fix payroll-admin-page.tsx
const payrollAdminPath = path.join(srcDir, 'components', 'admin', 'payroll-admin-page.tsx');
if (fs.existsSync(payrollAdminPath)) {
  let content = fs.readFileSync(payrollAdminPath, 'utf8');
  content = content.replace(/from "\.\/payroll-page"/g, 'from "@/features/admin/payroll/components/payroll-page"');
  fs.writeFileSync(payrollAdminPath, content, 'utf8');
}

// Fix task-studio-page implicit any
const taskStudioPath = path.join(srcDir, 'components', 'assistant', 'task-studio-page.tsx');
if (fs.existsSync(taskStudioPath)) {
  let content = fs.readFileSync(taskStudioPath, 'utf8');
  content = content.replace(/\(p\) => p\.id === pageId/, '(p: any) => p.id === pageId');
  fs.writeFileSync(taskStudioPath, content, 'utf8');
}

console.log('Fixes applied.');
