import { createFileRoute } from "@tanstack/react-router";
import { AdminUsersPage } from "@/features/admin/users";

export const Route = createFileRoute("/app/admin/users")({
  head: () => ({
    meta: [
      { title: "Admin - Users - MangaFlow Studio" },
      { name: "description", content: "User, role, scope, and account status management." },
      { property: "og:title", content: "Admin - Users" },
      { property: "og:description", content: "User management." },
    ],
  }),
  component: AdminUsersPage,
});
