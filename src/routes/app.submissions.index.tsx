import { createFileRoute } from "@tanstack/react-router";
import { SubmissionsListPage } from "@/features/proposals/list";

export const Route = createFileRoute("/app/submissions/")({
  component: SubmissionsListPage,
});
