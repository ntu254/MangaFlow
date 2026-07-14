import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/admin/rates")({
  head: () => ({
    meta: [
      { title: "Admin - Task Rates - beachRead Studio" },
      { name: "description", content: "Task rates are outside the MVP admin surface." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/app/admin/users" });
  },
});
