import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/admin/materials")({
  head: () => ({
    meta: [
      { title: "Admin - User Management - beachRead Studio" },
      {
        name: "description",
        content: "Material library administration is outside the MVP admin surface.",
      },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/app/admin/users" });
  },
});
