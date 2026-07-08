import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/shared/ui/module-placeholder";

export const Route = createFileRoute("/app/earnings")({
  head: () => ({
    meta: [
      { title: "Earnings — beachRead Studio" },
      { name: "description", content: "Assistant earning tracking (pending → confirmed → paid)." },
      { property: "og:title", content: "Earnings — beachRead Studio" },
      { property: "og:description", content: "Assistant earnings." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      phase={7}
      title="Assistant Earnings"
      description="Tính earning từ EDITOR_APPROVED task, rate snapshot, status pending/confirmed/paid/void. MVP không tích hợp payment gateway."
    />
  ),
});
