import { createFileRoute } from "@tanstack/react-router";
import { AdminPayrollPage } from "@/features/admin/payroll";

export const Route = createFileRoute("/app/admin/payroll")({
  head: () => ({
    meta: [
      { title: "Admin - Payroll - beachRead Studio" },
      { name: "description", content: "Assistant earning review and payroll controls." },
      { property: "og:title", content: "Admin - Payroll" },
      { property: "og:description", content: "Payroll operations." },
    ],
  }),
  component: AdminPayrollPage,
});
