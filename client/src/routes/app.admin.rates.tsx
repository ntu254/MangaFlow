import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/shared/ui/module-placeholder";

export const Route = createFileRoute("/app/admin/rates")({
  head: () => ({
    meta: [
      { title: "Admin · Task Rates — beachRead Studio" },
      { name: "description", content: "Quản lý task type và rate cho payroll." },
      { property: "og:title", content: "Admin · Task Rates" },
      { property: "og:description", content: "Task rates." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      phase={7}
      title="Admin · Task Rates"
      description="Quản lý task type và rate snapshot để tính earning."
    />
  ),
});
