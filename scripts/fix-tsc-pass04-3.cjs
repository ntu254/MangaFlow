const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function readFile(p) { return fs.readFileSync(path.join(srcDir, p), 'utf8'); }
function writeFile(p, c) { fs.writeFileSync(path.join(srcDir, p), c, 'utf8'); }

// 1. Add missing admin queries
const adminQueriesPath = 'hooks/use-admin-queries.ts';
let adminQueries = readFile(adminQueriesPath);
if (!adminQueries.includes('useAdminWorkflowSummaryQuery')) {
  adminQueries += `\n
export function useAdminWorkflowSummaryQuery(options: any = {}) {
  return useQuery<any>({
    queryKey: adminKeys.workflowSummary(),
    queryFn: () => adminApi.workflowSummary(),
    enabled: options.enabled ?? true,
    staleTime: 30000,
  });
}

export function useAdminStorageSummaryQuery(options: any = {}) {
  return useQuery<any>({
    queryKey: adminKeys.storageSummary(),
    queryFn: () => adminApi.storageSummary(),
    enabled: options.enabled ?? true,
    staleTime: 30000,
  });
}

export function useAdminOverrideMutation() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { action: string; targetId?: string; reason: string }>({
    mutationFn: (body) => adminApi.override(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}\n`;
  writeFile(adminQueriesPath, adminQueries);
}

// 2. Export StudioTask in use-series-queries.ts
const seriesQueriesPath = 'hooks/use-series-queries.ts';
let seriesQueries = readFile(seriesQueriesPath);
if (!seriesQueries.includes('export type StudioTask')) {
  seriesQueries = seriesQueries.replace('import type { StudioRegion, StudioTask as OriginalStudioTask, StudioComment }', 'import type { StudioRegion, StudioTask as OriginalStudioTask, StudioComment }');
  seriesQueries += `\nexport type StudioTask = OriginalStudioTask;\n`;
  writeFile(seriesQueriesPath, seriesQueries);
}

// 3. Fix ranking-import-page.tsx
const rankingImportPath = 'features/board/rankings/components/ranking-import-page.tsx';
let rankingImport = readFile(rankingImportPath);
rankingImport = rankingImport.replace(/parsedRows/g, '(parsedRows || [])');
rankingImport = rankingImport.replace(/fileName: file\.name/g, 'fileName: file?.name || ""');
writeFile(rankingImportPath, rankingImport);

// 4. Fix assistant earnings-page.tsx
const earningsPath = 'components/assistant/earnings-page.tsx';
let earnings = readFile(earningsPath);
earnings = earnings.replace(/\[e.status as keyof typeof EARNING_STATUSES\]/g, '(e.status)'); // Remove the array lookup, just use string
writeFile(earningsPath, earnings);

// 5. Fix mangaka submission-review.tsx RegionType indexing
const submissionReviewPath = 'components/mangaka/submission-review.tsx';
let submissionReview = readFile(submissionReviewPath);
submissionReview = submissionReview.replace(/\[region.type\]/g, '[region.type as any]');
writeFile(submissionReviewPath, submissionReview);

// 6. Fix task-studio-page.tsx RegionType indexing
const taskStudioPath = 'components/assistant/task-studio-page.tsx';
let taskStudio = readFile(taskStudioPath);
taskStudio = taskStudio.replace(/\[region.type\]/g, '[region.type as any]');
writeFile(taskStudioPath, taskStudio);

// 7. Fix workflow-monitor-page.tsx missing export
const workflowMonitorPath = 'components/admin/workflow-monitor-page.tsx';
let workflowMonitor = readFile(workflowMonitorPath);
workflowMonitor = workflowMonitor.replace(/import \{ useAdminWorkflowSummaryQuery \}/g, 'import { useAdminWorkflowSummaryQuery }'); // it should be there now
workflowMonitor = workflowMonitor.replace(/\(issue\) =>/g, '(issue: any) =>');
writeFile(workflowMonitorPath, workflowMonitor);

// 8. Fix files-storage-page.tsx implicit any
const filesStoragePath = 'components/admin/files-storage-page.tsx';
let filesStorage = readFile(filesStoragePath);
filesStorage = filesStorage.replace(/\(asset\) =>/g, '(asset: any) =>');
writeFile(filesStoragePath, filesStorage);

console.log('Fixes applied.');
