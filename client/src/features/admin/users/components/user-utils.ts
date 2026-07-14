import type { AdminUser } from "../../api/admin-queries";

export function formatUserDateTime(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatUserDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function isLastAdmin(user: AdminUser, users: AdminUser[], activeAdminCount?: number) {
  if (user.role.toUpperCase() !== "ADMIN") return false;
  if (typeof activeAdminCount === "number") return activeAdminCount <= 1;
  const adminCount = users.filter(
    (candidate) => candidate.role.toUpperCase() === "ADMIN" && candidate.active !== false,
  ).length;
  return adminCount <= 1;
}

export function privilegeLabel(user: AdminUser) {
  if (user.isChair) return "Chair";
  if (user.isEditorInChief) return "Editor-in-Chief";
  return "-";
}
