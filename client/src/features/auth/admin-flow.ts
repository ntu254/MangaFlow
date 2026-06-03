import type { SystemRole } from "./auth-flow";

export const assignableSystemRoles = [
  "ADMIN",
  "MANGAKA",
  "ASSISTANT",
  "EDITOR",
  "BOARD"
] as const satisfies readonly SystemRole[];

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

export function buildAdminUsersUrl(apiBaseUrl: string) {
  return `${trimTrailingSlash(apiBaseUrl)}/admin/users`;
}

export function buildAdminCreateUserUrl(apiBaseUrl: string) {
  return `${trimTrailingSlash(apiBaseUrl)}/admin/users`;
}

export function buildAdminUserRoleUrl(apiBaseUrl: string, userId: string) {
  return `${trimTrailingSlash(apiBaseUrl)}/admin/users/${userId}/role`;
}

export function buildAdminUserStatusUrl(apiBaseUrl: string, userId: string) {
  return `${trimTrailingSlash(apiBaseUrl)}/admin/users/${userId}/status`;
}

export function buildAdminUserResetPasswordUrl(apiBaseUrl: string, userId: string) {
  return `${trimTrailingSlash(apiBaseUrl)}/admin/users/${userId}/reset-password`;
}
