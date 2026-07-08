const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function readFile(p) { return fs.readFileSync(path.join(srcDir, p), 'utf8'); }
function writeFile(p, c) { fs.writeFileSync(path.join(srcDir, p), c, 'utf8'); }

const seriesQueriesPath = 'hooks/use-series-queries.ts';
let seriesQueries = readFile(seriesQueriesPath);

// Create api files
const tasksHooks = `import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { studioKeys, taskKeys, submissionKeys, chapterKeys, type StudioTask } from "@/hooks/use-series-queries";

export function useStudioTasksQuery(filters: {
  seriesId?: string;
  chapterId?: string;
  pageId?: string;
  regionId?: string;
  assigneeId?: string;
  status?: string;
}) {
  const params = new URLSearchParams();
  if (filters.seriesId) params.set("seriesId", filters.seriesId);
  if (filters.chapterId) params.set("chapterId", filters.chapterId);
  if (filters.pageId) params.set("pageId", filters.pageId);
  if (filters.regionId) params.set("regionId", filters.regionId);
  if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString();
  return useQuery<StudioTask[]>({
    queryKey: studioKeys.tasks(filters),
    queryFn: () => apiRequest<StudioTask[]>(\`/studio/tasks\${qs ? \`?\${qs}\` : ""}\`),
    staleTime: 30000,
  });
}

export function useStudioTaskDetailQuery(taskId: string) {
  return useQuery<StudioTask>({
    queryKey: studioKeys.task(taskId),
    queryFn: () => apiRequest<StudioTask>(\`/studio/tasks/\${taskId}\`),
    enabled: !!taskId,
    staleTime: 30000,
  });
}

export function useCreateStudioTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    StudioTask,
    Error,
    {
      chapterId: string;
      pageId: string;
      regionId?: string;
      seriesId?: string;
      title: string;
      type: string;
      priority: string;
      description?: string;
      dueDate?: string;
      assigneeId?: string;
    }
  >({
    mutationFn: (body) => apiRequest<StudioTask>("/studio/tasks", { method: "POST", body }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: studioKeys.tasks({ chapterId: variables.chapterId }),
      });
      queryClient.invalidateQueries({
        queryKey: studioKeys.tasks({ pageId: variables.pageId }),
      });
    },
  });
}

export function useUpdateStudioTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    StudioTask,
    Error,
    { id: string; patch: Partial<StudioTask>; chapterId?: string; pageId?: string }
  >({
    mutationFn: ({ id, patch }) =>
      apiRequest<StudioTask>(\`/studio/tasks/\${id}\`, { method: "PATCH", body: patch }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: studioKeys.task(variables.id) });
      if (variables.chapterId || variables.pageId) {
        if (variables.chapterId) {
          queryClient.invalidateQueries({
            queryKey: studioKeys.tasks({ chapterId: variables.chapterId }),
          });
        }
        if (variables.pageId) {
          queryClient.invalidateQueries({
            queryKey: studioKeys.tasks({ pageId: variables.pageId }),
          });
        }
      } else {
        queryClient.invalidateQueries({ queryKey: studioKeys.all });
      }
    },
  });
}

export function useStudioTaskActionMutation(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    Error,
    { action: string; payload?: unknown; chapterId?: string; pageId?: string }
  >({
    mutationFn: ({ action, payload }) =>
      apiRequest<unknown>(\`/studio/tasks/\${taskId}/actions/\${action}\`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: studioKeys.task(taskId) });
      queryClient.invalidateQueries({ queryKey: studioKeys.all });
      if (variables.chapterId) {
        queryClient.invalidateQueries({
          queryKey: chapterKeys.readiness(variables.chapterId),
        });
      }
    },
  });
}
`;

fs.mkdirSync(path.join(srcDir, 'features/assistant/tasks/api'), { recursive: true });
writeFile('features/assistant/tasks/api/tasks.queries.ts', tasksHooks);

const t1 = /export function useStudioTasksQuery[\s\S]*?\}\);[\s]*\}/;
const t2 = /export function useStudioTaskDetailQuery[\s\S]*?\}\);[\s]*\}/;
const t3 = /export function useCreateStudioTaskMutation[\s\S]*?\}\);[\s]*\}/;
const t4 = /export function useUpdateStudioTaskMutation[\s\S]*?\}\);[\s]*\}/;
const t5 = /export function useStudioTaskActionMutation[\s\S]*?\}\);[\s]*\}/;

seriesQueries = seriesQueries.replace(t1, '');
seriesQueries = seriesQueries.replace(t2, '');
seriesQueries = seriesQueries.replace(t3, '');
seriesQueries = seriesQueries.replace(t4, '');
seriesQueries = seriesQueries.replace(t5, '');

seriesQueries += `\nexport { useStudioTasksQuery, useStudioTaskDetailQuery, useCreateStudioTaskMutation, useUpdateStudioTaskMutation, useStudioTaskActionMutation } from "@/features/assistant/tasks/api/tasks.queries";\n`;

writeFile(seriesQueriesPath, seriesQueries);
console.log('Processed series hooks');
