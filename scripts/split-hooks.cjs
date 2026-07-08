const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function readFile(p) { return fs.readFileSync(path.join(srcDir, p), 'utf8'); }
function writeFile(p, c) { fs.writeFileSync(path.join(srcDir, p), c, 'utf8'); }

// 1. Admin Users
const adminQueriesPath = 'hooks/use-admin-queries.ts';
let adminQueries = readFile(adminQueriesPath);

const usersHooks = `import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/services";
import { adminKeys, retryAdminQuery, type AdminQueryOptions, type AdminUser } from "@/hooks/use-admin-queries";

export function useAdminUsersQuery(options: AdminQueryOptions = {}) {
  return useQuery<AdminUser[]>({
    queryKey: adminKeys.users(),
    queryFn: () => adminApi.users() as Promise<AdminUser[]>,
    enabled: options.enabled ?? true,
    retry: retryAdminQuery,
    staleTime: 60000,
  });
}

export function useAdminUserQuery(userId: string) {
  return useQuery<AdminUser>({
    queryKey: adminKeys.user(userId),
    queryFn: () => adminApi.getUser(userId) as Promise<AdminUser>,
    enabled: !!userId,
    staleTime: 60000,
  });
}

export function useAdminUserMutation() {
  const queryClient = useQueryClient();
  return useMutation<AdminUser, Error, { userId: string; patch: Record<string, unknown> }>({
    mutationFn: ({ userId, patch }) =>
      adminApi.updateUser(userId, patch) as Promise<AdminUser>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}
`;

fs.mkdirSync(path.join(srcDir, 'features/admin/users/api'), { recursive: true });
writeFile('features/admin/users/api/users.queries.ts', usersHooks);

// Extract Payroll hooks
const payrollHooks = `import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/services";
import { adminKeys, retryAdminQuery, type AdminQueryOptions, type Earning } from "@/hooks/use-admin-queries";

export function useAdminPayrollQuery(options: AdminQueryOptions = {}) {
  return useQuery<Earning[]>({
    queryKey: adminKeys.payroll(),
    queryFn: () => adminApi.payroll() as Promise<Earning[]>,
    enabled: options.enabled ?? true,
    retry: retryAdminQuery,
    staleTime: 60000,
  });
}

export function useConfirmPayrollMutation() {
  const queryClient = useQueryClient();
  return useMutation<Earning, Error, string>({
    mutationFn: (earningId) => adminApi.confirmPayroll(earningId) as Promise<Earning>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payroll() });
    },
  });
}

export function useMarkPaidPayrollMutation() {
  const queryClient = useQueryClient();
  return useMutation<Earning, Error, { earningId: string; reason: string }>({
    mutationFn: ({ earningId, reason }) =>
      adminApi.markPaidPayroll(earningId, reason) as Promise<Earning>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payroll() });
    },
  });
}

export function useVoidPayrollMutation() {
  const queryClient = useQueryClient();
  return useMutation<Earning, Error, { earningId: string; reason: string }>({
    mutationFn: ({ earningId, reason }) =>
      adminApi.voidPayroll(earningId, reason) as Promise<Earning>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payroll() });
    },
  });
}
`;

fs.mkdirSync(path.join(srcDir, 'features/admin/payroll/api'), { recursive: true });
writeFile('features/admin/payroll/api/payroll.queries.ts', payrollHooks);

// Clean up use-admin-queries.ts and add exports
// Also need to export AdminQueryOptions and retryAdminQuery
adminQueries = adminQueries.replace('type AdminQueryOptions', 'export type AdminQueryOptions');
adminQueries = adminQueries.replace('function retryAdminQuery', 'export function retryAdminQuery');

const usersPattern = /export function useAdminUsersQuery[\s\S]*?\}\);[\s]*\}/;
const userDetailPattern = /export function useAdminUserQuery[\s\S]*?\}\);[\s]*\}/;
const userMutationPattern = /export function useAdminUserMutation[\s\S]*?\}\);[\s]*\}/;

adminQueries = adminQueries.replace(usersPattern, '');
adminQueries = adminQueries.replace(userDetailPattern, '');
adminQueries = adminQueries.replace(userMutationPattern, '');

const payrollPattern1 = /export function useAdminPayrollQuery[\s\S]*?\}\);[\s]*\}/;
const payrollPattern2 = /export function useConfirmPayrollMutation[\s\S]*?\}\);[\s]*\}/;
const payrollPattern3 = /export function useMarkPaidPayrollMutation[\s\S]*?\}\);[\s]*\}/;
const payrollPattern4 = /export function useVoidPayrollMutation[\s\S]*?\}\);[\s]*\}/;

adminQueries = adminQueries.replace(payrollPattern1, '');
adminQueries = adminQueries.replace(payrollPattern2, '');
adminQueries = adminQueries.replace(payrollPattern3, '');
adminQueries = adminQueries.replace(payrollPattern4, '');

adminQueries += `\nexport { useAdminUsersQuery, useAdminUserQuery, useAdminUserMutation } from "@/features/admin/users/api/users.queries";\n`;
adminQueries += `export { useAdminPayrollQuery, useConfirmPayrollMutation, useMarkPaidPayrollMutation, useVoidPayrollMutation } from "@/features/admin/payroll/api/payroll.queries";\n`;

writeFile(adminQueriesPath, adminQueries);
console.log('Processed admin hooks');
