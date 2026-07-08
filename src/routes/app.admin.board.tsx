import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "@/shared/ui/module-placeholder";

export const Route = createFileRoute("/app/admin/board")({
  head: () => ({
    meta: [
      { title: "Admin · Board members — beachRead Studio" },
      { name: "description", content: "Quản lý thành viên Board." },
      { property: "og:title", content: "Admin · Board" },
      { property: "og:description", content: "Board members." },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      phase={8}
      title="Admin · Board Members"
      description="Quản lý Board member và quyền vote."
    />
  ),
});
