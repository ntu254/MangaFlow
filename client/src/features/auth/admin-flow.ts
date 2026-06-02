import type { SystemRole, UserStatus } from "./auth-flow";

type RoleReviewUser = {
  systemRole: SystemRole | null;
  requestedSystemRole: "MANGAKA" | "ASSISTANT" | null;
  status: UserStatus;
};

export function getAdminRoleReviewRoute() {
  return "/app/admin/users/role-review";
}

export const assignableSystemRoles = [
  "MANGAKA",
  "ASSISTANT",
  "EDITOR",
  "BOARD"
] as const satisfies readonly SystemRole[];

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

export function buildAdminRoleReviewUrl(apiBaseUrl: string) {
  return `${trimTrailingSlash(apiBaseUrl)}/admin/users?role=pending&status=ACTIVE`;
}

export function buildAdminUserRoleUrl(apiBaseUrl: string, userId: string) {
  return `${trimTrailingSlash(apiBaseUrl)}/admin/users/${userId}/role`;
}

export function buildAdminUserStatusUrl(apiBaseUrl: string, userId: string) {
  return `${trimTrailingSlash(apiBaseUrl)}/admin/users/${userId}/status`;
}

export function isAdminRoleReviewUser(user: RoleReviewUser) {
  return (
    user.status === "ACTIVE" &&
    user.systemRole === null &&
    user.requestedSystemRole !== null
  );
}
