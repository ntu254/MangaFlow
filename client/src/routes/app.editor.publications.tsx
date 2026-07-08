import { createFileRoute } from "@tanstack/react-router";
import { EditorPublicationsPage } from "@/features/editor/publications";

export const Route = createFileRoute("/app/editor/publications")({
  head: () => ({ meta: [{ title: "Publications — beachRead Studio" }] }),
  component: EditorPublicationsPage,
});
