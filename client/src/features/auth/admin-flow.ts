import type { SystemRole, UserStatus } from "./auth-flow";

type RoleReviewUser = {
  systemRole: SystemRole | null;
  requestedSystemRole: "MANGAKA" | "ASSISTANT" | null;
  status: UserStatus;
};

export function getAdminRoleReviewRoute() {
  return "/app/admin/users/role-review";
}

export function isAdminRoleReviewUser(user: RoleReviewUser) {
  return (
    user.status === "ACTIVE" &&
    user.systemRole === null &&
    user.requestedSystemRole !== null
  );
}

