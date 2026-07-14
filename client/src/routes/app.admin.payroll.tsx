import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/admin/payroll")({
  head: () => ({
    meta: [
      { title: "Admin - User Management - beachRead Studio" },
      { name: "description", content: "Payroll operations are outside the MVP admin surface." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/app/admin/users" });
  },
});
