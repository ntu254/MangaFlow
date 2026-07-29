const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function readFile(p) { return fs.readFileSync(path.join(srcDir, p), 'utf8'); }
function writeFile(p, c) { fs.writeFileSync(path.join(srcDir, p), c, 'utf8'); }

// 1. audit-page.tsx
const auditPage = 'features/admin/audit/components/audit-page.tsx';
if (fs.existsSync(path.join(srcDir, auditPage))) {
  let content = readFile(auditPage);
  content = content.replace(/from "\.\/admin-access"/g, 'from "@/components/admin/admin-access"');
  content = content.replace(/from "\.\/admin-utils"/g, 'from "@/components/admin/admin-utils"');
  writeFile(auditPage, content);
}

// 2. admin-notifications-page.tsx
const adminNotifications = 'features/admin/notifications/components/admin-notifications-page.tsx';
if (fs.existsSync(path.join(srcDir, adminNotifications))) {
  let content = readFile(adminNotifications);
  content = content.replace(/from "\.\/admin-data"/g, 'from "@/components/admin/admin-data"');
  content = content.replace(/from "\.\/admin-utils"/g, 'from "@/components/admin/admin-utils"');
  writeFile(adminNotifications, content);
}

console.log('Fixed relative internal admin imports.');
