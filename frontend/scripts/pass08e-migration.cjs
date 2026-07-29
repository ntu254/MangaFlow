const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

const moves = [
  // Dashboard
  {
    from: 'components/admin/admin-dashboard.tsx',
    to: 'features/admin/dashboard/components/admin-dashboard.tsx',
  },
  // Series Management
  {
    from: 'components/admin/series-management-page.tsx',
    to: 'features/admin/series-management/components/series-management-page.tsx',
  },
  // Studios
  {
    from: 'components/admin/studios-page.tsx',
    to: 'features/admin/studios/components/studios-page.tsx',
  },
  // Workflow Monitor
  {
    from: 'components/admin/workflow-monitor-page.tsx',
    to: 'features/admin/workflow-monitor/components/workflow-monitor-page.tsx',
  },
  // Shared
  {
    from: 'components/admin/admin-access.tsx',
    to: 'shared/ui/admin/admin-access.tsx',
  },
  {
    from: 'components/admin/admin-utils.tsx',
    to: 'shared/ui/admin/admin-utils.tsx',
  },
  {
    from: 'components/admin/admin-data.ts',
    to: 'shared/ui/admin/admin-data.ts',
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

// Delete obsolete files
['components/admin/payroll-admin-page.tsx', 'components/admin/system-settings-page.tsx'].forEach(file => {
  const filePath = path.join(srcDir, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted: ${file}`);
  }
});

// Create index files
const indexes = {
  'features/admin/dashboard/index.ts': `export { AdminDashboard } from "./components/admin-dashboard";\n`,
  'features/admin/series-management/index.ts': `export { SeriesManagementPage } from "./components/series-management-page";\n`,
  'features/admin/studios/index.ts': `export { StudiosPage } from "./components/studios-page";\n`,
  'features/admin/workflow-monitor/index.ts': `export { WorkflowMonitorPage } from "./components/workflow-monitor-page";\n`,
};

for (const [file, content] of Object.entries(indexes)) {
  const filePath = path.join(srcDir, file);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log(`Created/Updated: ${file}`);
}

// Remove empty directory
const adminDir = path.join(srcDir, 'components/admin');
if (fs.existsSync(adminDir) && fs.readdirSync(adminDir).length === 0) {
  fs.rmdirSync(adminDir);
  console.log(`Removed empty directory: components/admin`);
}

console.log("Migration complete.");
